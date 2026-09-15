import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { rateLimit } from "@/lib/security";
import { ensureCustomer, isStripeConfigured, priceCentsFor, priceIdFor, stripe } from "@/lib/stripe";
import { notify } from "@/lib/notifications";
import { PLANS } from "@/lib/plans";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Debes iniciar sesión para suscribirte.", 401);

    const limit = rateLimit(`checkout:${user.id}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const { plan } = checkoutSchema.parse(await request.json());
    const sdk = stripe();

    /* ---------------- Modo demostración (sin claves Stripe) ---------------- */
    if (!sdk || !isStripeConfigured()) {
      if (!env.demoMode) return fail("El sistema de pagos no está disponible.", 503);

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan,
          status: "ACTIVE",
          priceCents: priceCentsFor(plan),
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan,
          status: "ACTIVE",
          priceCents: priceCentsFor(plan),
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      await notify(
        user.id,
        "SUBSCRIPTION_ACTIVATED",
        `Plan ${PLANS[plan].name} activado`,
        "Tu suscripción de demostración está activa. Ya puedes reproducir el contenido incluido.",
        "/dashboard",
      );

      return ok({ url: "/dashboard?welcome=1", demo: true });
    }

    /* ----------------------------- Stripe real ---------------------------- */
    const customerId = await ensureCustomer(user.id, user.email, user.subscription?.stripeCustomerId ?? null);
    if (!customerId) return fail("No se ha podido crear el cliente de pago.", 500);

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });

    // Cambio de plan sobre una suscripción ya activa: proración, sin checkout.
    const existingId = user.subscription?.stripeSubscriptionId;
    if (existingId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(user.subscription!.status)) {
      const current = await sdk.subscriptions.retrieve(existingId);
      const item = current.items.data[0];

      await sdk.subscriptions.update(existingId, {
        items: [{ id: item.id, price: priceIdFor(plan) }],
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
        metadata: { userId: user.id, plan },
      });

      return ok({ url: "/subscription?changed=1" });
    }

    const session = await sdk.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(plan), quantity: 1 }],
      success_url: `${env.appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id, plan } },
      metadata: { userId: user.id, plan },
    });

    return ok({ url: session.url });
  } catch (error) {
    return handleError(error);
  }
}
