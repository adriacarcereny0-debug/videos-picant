import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { mapStatus, planFromPriceId, priceCentsFor, stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import { notify } from "@/lib/notifications";
import { mailer } from "@/lib/mail";
import { logSecurityEvent } from "@/lib/security";
import { formatDate, formatMoney } from "@/lib/format";

export const runtime = "nodejs";
// El cuerpo debe leerse en crudo para poder verificar la firma.
export const dynamic = "force-dynamic";

/**
 * Webhooks de Stripe: ÚNICA fuente de verdad del estado de la suscripción.
 * Todo evento se verifica criptográficamente y se procesa una sola vez.
 */
export async function POST(request: NextRequest) {
  const sdk = stripe();
  if (!sdk || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Falta la firma." }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = sdk.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (error) {
    await logSecurityEvent("WEBHOOK_INVALID_SIGNATURE", {
      meta: { message: error instanceof Error ? error.message : "desconocido" },
    });
    return NextResponse.json({ error: "Firma no válida." }, { status: 400 });
  }

  // Idempotencia: Stripe puede reintentar el mismo evento.
  const already = await prisma.processedWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (already) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handleEvent(event);
    await prisma.processedWebhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  } catch (error) {
    console.error(`[stripe:webhook] fallo al procesar ${event.type}`, error);
    // 500 para que Stripe reintente.
    return NextResponse.json({ error: "Error al procesar el evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ */

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionChanged(event.data.object as Stripe.Subscription, event.id, event.type);
      break;

    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
      break;

    case "invoice.paid":
    case "invoice.payment_succeeded":
      await onInvoicePaid(event.data.object as Stripe.Invoice, event.id);
      break;

    case "invoice.payment_failed":
      await onInvoiceFailed(event.data.object as Stripe.Invoice, event.id);
      break;

    case "invoice.upcoming":
      await onInvoiceUpcoming(event.data.object as Stripe.Invoice);
      break;

    default:
      // Evento no relevante para el control de acceso.
      break;
  }
}

/** Localiza la suscripción interna a partir de los identificadores de Stripe. */
async function findSubscription(params: {
  customerId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
}) {
  if (params.subscriptionId) {
    const bySub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: params.subscriptionId },
      include: { user: true },
    });
    if (bySub) return bySub;
  }
  if (params.customerId) {
    const byCustomer = await prisma.subscription.findUnique({
      where: { stripeCustomerId: params.customerId },
      include: { user: true },
    });
    if (byCustomer) return byCustomer;
  }
  if (params.userId) {
    const byUser = await prisma.subscription.findUnique({
      where: { userId: params.userId },
      include: { user: true },
    });
    if (byUser) return byUser;
  }
  return null;
}

async function recordEvent(
  subscriptionId: string,
  type: string,
  stripeEventId: string,
  amountCents?: number | null,
  currency?: string | null,
) {
  await prisma.subscriptionEvent
    .create({
      data: {
        subscriptionId,
        type,
        stripeEventId,
        amountCents: amountCents ?? null,
        currency: currency ?? null,
      },
    })
    .catch(() => undefined);
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  const record = await findSubscription({ customerId, subscriptionId, userId });
  if (!record) return;

  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      stripeCustomerId: customerId ?? record.stripeCustomerId,
      stripeSubscriptionId: subscriptionId ?? record.stripeSubscriptionId,
    },
  });

  await recordEvent(record.id, "checkout.completed", eventId, session.amount_total, session.currency);
  // La activación efectiva llega con customer.subscription.created/updated.
}

async function onSubscriptionChanged(
  subscription: Stripe.Subscription,
  eventId: string,
  eventType: string,
) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const record = await findSubscription({
    customerId,
    subscriptionId: subscription.id,
    userId: subscription.metadata?.userId ?? null,
  });
  if (!record) return;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const metadataPlan =
    subscription.metadata?.plan === "PREMIUM" || subscription.metadata?.plan === "BASIC"
      ? subscription.metadata.plan
      : null;
  const fallbackPlan = record.plan === "FREE" ? "BASIC" : record.plan;
  const plan: "BASIC" | "PREMIUM" = planFromPriceId(priceId) ?? metadataPlan ?? fallbackPlan;
  const status = mapStatus(subscription.status);
  const planChanged = record.plan !== plan && record.plan !== "FREE";
  const wasActive = record.status === "ACTIVE" || record.status === "TRIALING";

  const periodStart = subscription.current_period_start ?? null;
  const periodEnd = subscription.current_period_end ?? null;

  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      plan,
      status,
      priceCents: item?.price?.unit_amount ?? priceCentsFor(plan),
      currency: subscription.currency ?? "eur",
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : record.currentPeriodStart,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : record.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  await recordEvent(record.id, eventType, eventId, item?.price?.unit_amount, subscription.currency);

  const planName = plan === "PREMIUM" ? PLANS.PREMIUM.name : PLANS.BASIC.name;

  if (!wasActive && (status === "ACTIVE" || status === "TRIALING")) {
    await notify(
      record.userId,
      "SUBSCRIPTION_ACTIVATED",
      `Plan ${planName} activado`,
      "Tu suscripción está activa. Ya puedes reproducir el contenido incluido en tu plan.",
      "/videos",
    );
    await mailer.subscriptionActivated(record.user.email, planName);
  } else if (planChanged) {
    await notify(
      record.userId,
      "PLAN_CHANGED",
      "Has cambiado de plan",
      `Tu suscripción es ahora el plan ${planName}.`,
      "/subscription",
    );
  }

  if (subscription.cancel_at_period_end && !record.cancelAtPeriodEnd) {
    const endsOn = formatDate(periodEnd ? new Date(periodEnd * 1000) : null);
    await notify(
      record.userId,
      "SUBSCRIPTION_CANCELED",
      "Suscripción cancelada",
      `Tu suscripción no se renovará. Mantendrás el acceso hasta el ${endsOn}.`,
      "/subscription",
    );
    await mailer.subscriptionCanceled(record.user.email, endsOn);
  }
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const record = await findSubscription({ customerId, subscriptionId: subscription.id });
  if (!record) return;

  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      stripeSubscriptionId: null,
    },
  });

  await recordEvent(record.id, "customer.subscription.deleted", eventId);
  await notify(
    record.userId,
    "SUBSCRIPTION_CANCELED",
    "Suscripción finalizada",
    "Tu suscripción ha finalizado. Puedes reactivarla cuando quieras.",
    "/pricing",
  );
}

async function onInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  const record = await findSubscription({ customerId });
  if (!record) return;

  await recordEvent(record.id, "invoice.paid", eventId, invoice.amount_paid, invoice.currency);

  const amount = formatMoney(invoice.amount_paid ?? 0, invoice.currency ?? "eur");
  const periodEnd = formatDate(record.currentPeriodEnd);

  await notify(
    record.userId,
    "PAYMENT_SUCCEEDED",
    "Pago confirmado",
    `Hemos recibido tu pago de ${amount}.`,
    "/subscription",
  );
  await mailer.paymentSucceeded(record.user.email, amount, periodEnd);
}

async function onInvoiceFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  const record = await findSubscription({ customerId });
  if (!record) return;

  await prisma.subscription.update({
    where: { id: record.id },
    data: { status: "PAST_DUE" },
  });

  await recordEvent(record.id, "invoice.payment_failed", eventId, invoice.amount_due, invoice.currency);
  await notify(
    record.userId,
    "PAYMENT_FAILED",
    "Pago rechazado",
    "No hemos podido procesar el cobro de tu suscripción. Actualiza tu método de pago.",
    "/subscription",
  );
  await mailer.paymentFailed(record.user.email);
}

async function onInvoiceUpcoming(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  const record = await findSubscription({ customerId });
  if (!record || record.plan === "FREE") return;

  const renewsOn = formatDate(record.currentPeriodEnd);
  const amount = formatMoney(invoice.amount_due ?? record.priceCents, invoice.currency ?? "eur");
  const planName = record.plan === "PREMIUM" ? PLANS.PREMIUM.name : PLANS.BASIC.name;

  await notify(
    record.userId,
    "RENEWAL_REMINDER",
    "Tu suscripción se renueva pronto",
    `El plan ${planName} se renovará el ${renewsOn} por ${amount}.`,
    "/subscription",
  );
  await mailer.renewalReminder(record.user.email, planName, renewsOn, amount);
}
