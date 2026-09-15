import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, LevelBadge, StatusPill } from "@/components/ui";
import { SubscriptionActions } from "@/components/account/SubscriptionActions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Mi suscripción",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  "checkout.completed": "Pago inicial completado",
  "customer.subscription.created": "Suscripción creada",
  "customer.subscription.updated": "Suscripción actualizada",
  "customer.subscription.deleted": "Suscripción finalizada",
  "invoice.paid": "Pago realizado",
  "invoice.payment_failed": "Pago fallido",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const subscription = user.subscription;
  const events = subscription
    ? await prisma.subscriptionEvent.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const planName =
    user.plan === "PREMIUM"
      ? PLANS.PREMIUM.name
      : user.plan === "BASIC"
        ? PLANS.BASIC.name
        : "Sin suscripción";

  const endsOn = formatDate(subscription?.currentPeriodEnd);
  const hasActivePlan = user.plan !== "FREE";

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">Facturación</p>
        <h1 className="display-lg text-ink">Mi suscripción</h1>
      </header>

      {params.changed === "1" && (
        <div className="surface border-positive/25 px-6 py-4 text-sm text-positive">
          Hemos registrado el cambio de plan. Puede tardar unos segundos en reflejarse.
        </div>
      )}

      <section className="surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ink">
                {planName}
              </h2>
              {hasActivePlan && <LevelBadge level={user.plan as "BASIC" | "PREMIUM"} />}
            </div>

            <div className="mt-3">
              {!hasActivePlan ? (
                <StatusPill tone="neutral">Sin suscripción activa</StatusPill>
              ) : subscription?.cancelAtPeriodEnd ? (
                <StatusPill tone="warning">Cancelada · acceso hasta el {endsOn}</StatusPill>
              ) : subscription?.status === "PAST_DUE" || subscription?.status === "UNPAID" ? (
                <StatusPill tone="danger">Pago pendiente</StatusPill>
              ) : (
                <StatusPill tone="positive">Activa</StatusPill>
              )}
            </div>
          </div>

          {hasActivePlan && (
            <div className="text-left sm:text-right">
              <p className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ink">
                {formatMoney(subscription?.priceCents ?? 0, subscription?.currency ?? "eur")}
              </p>
              <p className="mt-1 text-[13px] text-ink-faint">al mes, IVA incluido</p>
            </div>
          )}
        </div>

        <div className="hairline my-7" />

        <dl className="grid grid-cols-1 gap-x-10 gap-y-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Estado</dt>
            <dd className="mt-1.5 font-semibold text-ink">
              {subscription?.status === "ACTIVE"
                ? "Activa"
                : subscription?.status === "TRIALING"
                  ? "Periodo de prueba"
                  : subscription?.status === "PAST_DUE"
                    ? "Pago pendiente"
                    : subscription?.status === "CANCELED"
                      ? "Cancelada"
                      : "Sin suscripción"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {subscription?.cancelAtPeriodEnd ? "Acceso hasta" : "Próxima renovación"}
            </dt>
            <dd className="mt-1.5 font-semibold text-ink">{hasActivePlan ? endsOn : "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Inicio del periodo
            </dt>
            <dd className="mt-1.5 font-semibold text-ink">
              {formatDate(subscription?.currentPeriodStart)}
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          {hasActivePlan ? (
            <SubscriptionActions
              canManage
              cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
              endsOn={endsOn}
            />
          ) : (
            <ButtonLink href="/pricing" size="lg">
              Elegir una suscripción
            </ButtonLink>
          )}
        </div>
      </section>

      {/* Cambio de plan */}
      {hasActivePlan && (
        <section className="surface p-6 sm:p-7">
          <h2 className="font-display text-lg font-bold text-ink">Cambiar de plan</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {user.plan === "BASIC"
              ? "Pasa a Premium para desbloquear todo el catálogo. El importe se prorratea automáticamente."
              : "Puedes cambiar al plan Básico en cualquier momento. El importe se prorratea automáticamente."}
          </p>
          <ButtonLink href="/pricing" variant="secondary" className="mt-5">
            Ver planes disponibles
          </ButtonLink>
        </section>
      )}

      {/* Historial */}
      <section>
        <h2 className="display-md mb-4 text-ink">Historial</h2>
        {events.length > 0 ? (
          <ul className="surface divide-y divide-[#1a1a20] !p-0">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    {EVENT_LABELS[event.type] ?? event.type}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {formatDateTime(event.createdAt)}
                  </p>
                </div>
                {event.amountCents !== null && (
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
                    {formatMoney(event.amountCents, event.currency ?? "eur")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="surface px-6 py-10 text-center text-sm text-ink-muted">
            Todavía no hay movimientos registrados.
          </p>
        )}
      </section>

      <p className="text-center text-xs leading-relaxed text-ink-faint">
        Las facturas y el método de pago se gestionan desde el portal de Stripe. Consulta la{" "}
        <Link href="/refunds" className="underline underline-offset-2 hover:text-ink-muted">
          política de cancelación y reembolsos
        </Link>
        .
      </p>
    </div>
  );
}
