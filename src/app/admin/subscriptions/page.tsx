import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { StatCard } from "@/components/admin/StatCard";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Suscripciones" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "canceled", label: "Canceladas" },
  { key: "failed", label: "Fallidas" },
  { key: "basic", label: "Básico" },
  { key: "premium", label: "Premium" },
];

const STATUS_LABELS: Record<string, { label: string; tone: "positive" | "warning" | "danger" | "neutral" }> = {
  ACTIVE: { label: "Activa", tone: "positive" },
  TRIALING: { label: "Prueba", tone: "positive" },
  PAST_DUE: { label: "Pago pendiente", tone: "danger" },
  UNPAID: { label: "Impagada", tone: "danger" },
  CANCELED: { label: "Cancelada", tone: "warning" },
  INCOMPLETE: { label: "Incompleta", tone: "neutral" },
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "";

  const where: Prisma.SubscriptionWhereInput = {
    ...(filter === "active" ? { status: { in: ["ACTIVE", "TRIALING"] as const } } : {}),
    ...(filter === "canceled" ? { status: "CANCELED" as const } : {}),
    ...(filter === "failed" ? { status: { in: ["PAST_DUE", "UNPAID"] as const } } : {}),
    ...(filter === "basic" ? { plan: "BASIC" as const } : {}),
    ...(filter === "premium" ? { plan: "PREMIUM" as const } : {}),
    ...(filter === "" ? { plan: { not: "FREE" as const } } : {}),
  };

  const [subscriptions, active, canceled, failed] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { user: true },
      take: 200,
    }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.subscription.count({ where: { status: { in: ["PAST_DUE", "UNPAID"] } } }),
  ]);

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow mb-2">Facturación</p>
        <h1 className="display-lg text-ink">Suscripciones</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Activas" value={active} accent="positive" />
        <StatCard label="Canceladas" value={canceled} />
        <StatCard label="Con incidencia de pago" value={failed} accent="lip" />
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Link
            key={item.label}
            href={item.key ? `/admin/subscriptions?filter=${item.key}` : "/admin/subscriptions"}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
              filter === item.key
                ? "border-lip/50 bg-lip/12 text-lip-soft"
                : "border-line text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="surface overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <th className="px-5 py-3.5 font-bold">Usuario</th>
                <th className="px-3 py-3.5 font-bold">Plan</th>
                <th className="px-3 py-3.5 font-bold">Estado</th>
                <th className="px-3 py-3.5 text-right font-bold">Precio</th>
                <th className="px-3 py-3.5 font-bold">Inicio</th>
                <th className="px-3 py-3.5 font-bold">Renovación</th>
                <th className="px-3 py-3.5 font-bold">Cancelación</th>
                <th className="px-5 py-3.5 font-bold">ID Stripe</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => {
                const status = STATUS_LABELS[subscription.status] ?? {
                  label: subscription.status,
                  tone: "neutral" as const,
                };
                return (
                  <tr key={subscription.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{subscription.user.email}</p>
                      <p className="text-[11px] text-ink-faint">
                        {subscription.user.displayName ?? "Sin nombre"}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill tone={subscription.plan === "PREMIUM" ? "positive" : "neutral"}>
                        {subscription.plan === "PREMIUM"
                          ? "Premium"
                          : subscription.plan === "BASIC"
                            ? "Básico"
                            : "Free"}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill tone={status.tone}>
                        {subscription.cancelAtPeriodEnd ? "Cancela al vencer" : status.label}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-ink-muted">
                      {formatMoney(subscription.priceCents, subscription.currency)}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {formatDate(subscription.currentPeriodStart)}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {formatDate(subscription.currentPeriodEnd)}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {formatDate(subscription.canceledAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-[11px] text-ink-faint">
                        {subscription.stripeSubscriptionId ?? "—"}
                      </code>
                    </td>
                  </tr>
                );
              })}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-ink-faint">
                    No hay suscripciones en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
