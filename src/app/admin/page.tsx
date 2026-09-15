import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { AreaChart, BarChart, ChartCard } from "@/components/admin/Charts";
import { ButtonLink, LevelBadge, StatusPill } from "@/components/ui";
import { IconChart, IconCreditCard, IconFilm, IconFlag, IconUsers } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { adminOverview, adminSeries } from "@/lib/stats";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Resumen" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, series, latestUsers, latestVideos] = await Promise.all([
    adminOverview(),
    adminSeries(30),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { subscription: true },
    }),
    prisma.video.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Panel de control</p>
          <h1 className="display-lg text-ink">Resumen</h1>
        </div>
        <ButtonLink href="/admin/videos?upload=1" size="sm">
          + Subir vídeo
        </ButtonLink>
      </header>

      {/* Métricas principales */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios registrados"
          value={stats.users.toLocaleString("es-ES")}
          hint={`${stats.activeUsers} activos en 30 días`}
          icon={<IconUsers width={16} height={16} />}
        />
        <StatCard
          label="Suscripciones activas"
          value={stats.activeSubs}
          hint={`${stats.canceledSubs} canceladas`}
          icon={<IconCreditCard width={16} height={16} />}
          accent="positive"
        />
        <StatCard
          label="Ingresos del mes"
          value={formatMoney(stats.monthlyRevenueCents)}
          hint={`Total histórico: ${formatMoney(stats.totalRevenueCents)}`}
          icon={<IconChart width={16} height={16} />}
          accent="aurum"
        />
        <StatCard
          label="Ingreso recurrente"
          value={formatMoney(stats.mrrCents)}
          hint="MRR según suscripciones vivas"
          icon={<IconChart width={16} height={16} />}
          accent="aurum"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Suscriptores Básico" value={stats.basic} accent="silver" />
        <StatCard label="Suscriptores Premium" value={stats.premium} accent="aurum" />
        <StatCard
          label="Vídeos"
          value={stats.videos}
          hint={`${stats.basicVideos} Básico · ${stats.premiumVideos} Premium`}
          icon={<IconFilm width={16} height={16} />}
        />
        <StatCard
          label="Reportes pendientes"
          value={stats.pendingReports}
          icon={<IconFlag width={16} height={16} />}
          accent={stats.pendingReports > 0 ? "aurum" : "neutral"}
        />
      </section>

      {/* Gráficos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Nuevas suscripciones · 30 días"
          value={String(series.newSubscriptions.reduce((sum, p) => sum + p.value, 0))}
        >
          <AreaChart points={series.newSubscriptions} accent="#c8a063" />
        </ChartCard>

        <ChartCard
          title="Ingresos · 30 días"
          value={formatMoney(
            Math.round(series.revenue.reduce((sum, p) => sum + p.value, 0) * 100),
          )}
        >
          <AreaChart
            points={series.revenue}
            accent="#4fbf8b"
            format={(n) => formatMoney(Math.round(n * 100))}
          />
        </ChartCard>

        <ChartCard
          title="Usuarios nuevos · 30 días"
          value={String(series.newUsers.reduce((sum, p) => sum + p.value, 0))}
        >
          <BarChart points={series.newUsers} accent="#aab4c4" />
        </ChartCard>

        <ChartCard
          title="Cancelaciones · 30 días"
          value={String(series.cancellations.reduce((sum, p) => sum + p.value, 0))}
        >
          <BarChart points={series.cancellations} accent="#d96a6a" />
        </ChartCard>
      </section>

      {/* Listados recientes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface !p-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Últimos registros
            </h2>
            <Link href="/admin/users" className="text-[12px] font-semibold text-aurum">
              Ver todos
            </Link>
          </div>
          <ul className="divide-y divide-[#1a1a20]">
            {latestUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{user.email}</p>
                  <p className="text-[11px] text-ink-faint">{formatDate(user.createdAt)}</p>
                </div>
                <StatusPill
                  tone={
                    user.subscription?.plan === "PREMIUM"
                      ? "positive"
                      : user.subscription?.plan === "BASIC"
                        ? "neutral"
                        : "neutral"
                  }
                >
                  {user.subscription?.plan === "PREMIUM"
                    ? "Premium"
                    : user.subscription?.plan === "BASIC"
                      ? "Básico"
                      : "Free"}
                </StatusPill>
              </li>
            ))}
            {latestUsers.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-ink-faint">Sin usuarios.</li>
            )}
          </ul>
        </div>

        <div className="surface !p-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Últimos vídeos
            </h2>
            <Link href="/admin/videos" className="text-[12px] font-semibold text-aurum">
              Gestionar
            </Link>
          </div>
          <ul className="divide-y divide-[#1a1a20]">
            {latestVideos.map((video) => (
              <li key={video.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{video.title}</p>
                  <p className="text-[11px] text-ink-faint">
                    {video.status === "PUBLISHED" ? "Publicado" : "Borrador"} ·{" "}
                    {video.viewCount} reproducciones
                  </p>
                </div>
                <LevelBadge level={video.subscriptionLevel} />
              </li>
            ))}
            {latestVideos.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-ink-faint">Sin vídeos.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
