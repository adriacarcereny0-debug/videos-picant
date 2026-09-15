import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, LevelBadge, StatusPill } from "@/components/ui";
import { VideoCard } from "@/components/VideoCard";
import { IconArrowRight, IconBell, IconSparkle } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPublishedVideos } from "@/lib/videos";
import { formatDate, formatMoney, relativeTime } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; welcome?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const [latest, notifications] = await Promise.all([
    listPublishedVideos({ plan: user.plan, sort: "recent", take: 8 }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const recommended = latest.filter((v) => v.unlocked).slice(0, 3);
  const recent = latest.slice(0, 3);
  const subscription = user.subscription;
  const planName =
    user.plan === "PREMIUM" ? PLANS.PREMIUM.name : user.plan === "BASIC" ? PLANS.BASIC.name : "Sin plan";

  const justSubscribed = params.checkout === "success" || params.welcome === "1";

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-2">Tu cuenta</p>
        <h1 className="display-lg text-ink">
          Bienvenido, {user.displayName || user.email.split("@")[0]}
        </h1>
      </header>

      {justSubscribed && (
        <div className="surface flex items-center gap-4 border-aurum/30 px-6 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-aurum/15 text-aurum">
            <IconSparkle />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold text-ink">Suscripción activada</p>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Ya puedes reproducir todo el contenido incluido en tu plan.
            </p>
          </div>
        </div>
      )}

      {!user.emailVerified && (
        <div className="surface flex flex-col gap-3 border-warning/25 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">
            Tu dirección de correo todavía no está verificada.
          </p>
          <ButtonLink href="/profile" variant="secondary" size="sm" className="shrink-0">
            Verificar ahora
          </ButtonLink>
        </div>
      )}

      {/* Resumen de suscripción */}
      <section className="surface p-6 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Suscripción actual</p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.035em] text-ink">
                {planName}
              </h2>
              {user.plan !== "FREE" && <LevelBadge level={user.plan as "BASIC" | "PREMIUM"} />}
              <SubscriptionStatusPill
                status={subscription?.status}
                plan={user.plan}
                cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
              />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-10 gap-y-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Precio</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {user.plan === "FREE"
                    ? "—"
                    : `${formatMoney(subscription?.priceCents ?? 0)} / mes`}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  {subscription?.cancelAtPeriodEnd ? "Acceso hasta" : "Renovación"}
                </dt>
                <dd className="mt-1 font-semibold text-ink">
                  {user.plan === "FREE" ? "—" : formatDate(subscription?.currentPeriodEnd)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Desde</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {formatDate(subscription?.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            {user.plan === "FREE" ? (
              <ButtonLink href="/pricing">Elegir plan</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/subscription" variant="secondary">
                  Gestionar
                </ButtonLink>
                {user.plan === "BASIC" && (
                  <ButtonLink href="/pricing" size="sm">
                    Mejorar a Premium
                  </ButtonLink>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Últimos vídeos */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="display-md text-ink">Últimos vídeos</h2>
          <Link
            href="/videos"
            className="focus-ring group inline-flex items-center gap-2 text-[13px] font-semibold text-aurum"
          >
            Ver todo
            <IconArrowRight
              width={15}
              height={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
        {recent.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="surface px-6 py-10 text-center text-sm text-ink-muted">
            Todavía no hay vídeos publicados.
          </p>
        )}
      </section>

      {/* Recomendados */}
      {recommended.length > 0 && (
        <section>
          <h2 className="display-md mb-5 text-ink">Recomendados para ti</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Notificaciones recientes */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="display-md text-ink">Notificaciones</h2>
          <Link href="/notifications" className="text-[13px] font-semibold text-aurum">
            Ver todas
          </Link>
        </div>

        {notifications.length > 0 ? (
          <ul className="surface divide-y divide-[#1a1a20] !p-0">
            {notifications.map((item) => (
              <li key={item.id} className="flex gap-4 px-6 py-4">
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    item.readAt ? "bg-white/5 text-ink-faint" : "bg-aurum/15 text-aurum"
                  }`}
                >
                  <IconBell width={15} height={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">{relativeTime(item.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="surface px-6 py-10 text-center text-sm text-ink-muted">
            No tienes notificaciones.
          </p>
        )}
      </section>
    </div>
  );
}

function SubscriptionStatusPill({
  status,
  plan,
  cancelAtPeriodEnd,
}: {
  status?: string;
  plan: string;
  cancelAtPeriodEnd: boolean;
}) {
  if (plan === "FREE") return <StatusPill tone="neutral">Sin suscripción</StatusPill>;
  if (cancelAtPeriodEnd) return <StatusPill tone="warning">Cancelada · activa hasta el final</StatusPill>;
  if (status === "PAST_DUE" || status === "UNPAID")
    return <StatusPill tone="danger">Pago pendiente</StatusPill>;
  return <StatusPill tone="positive">Activa</StatusPill>;
}
