import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { ReportActions } from "@/components/admin/ReportActions";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE: "Contenido inapropiado",
  TECHNICAL: "Problema técnico",
  UNAUTHORIZED: "Publicado sin autorización",
  OTHER: "Otro",
};

const STATUS_TONES: Record<string, "warning" | "neutral" | "positive"> = {
  PENDING: "warning",
  REVIEWED: "neutral",
  RESOLVED: "positive",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  REVIEWED: "Revisado",
  RESOLVED: "Resuelto",
};

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "PENDING", label: "Pendientes" },
  { key: "REVIEWED", label: "Revisados" },
  { key: "RESOLVED", label: "Resueltos" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";

  const reports = await prisma.report.findMany({
    where: status ? { status: status as "PENDING" | "REVIEWED" | "RESOLVED" } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: true, video: true },
    take: 200,
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow mb-2">Moderación</p>
        <h1 className="display-lg text-ink">Reportes de contenido</h1>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Link
            key={item.label}
            href={item.key ? `/admin/reports?status=${item.key}` : "/admin/reports"}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
              status === item.key
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <th className="px-5 py-3.5 font-bold">Vídeo</th>
                <th className="px-3 py-3.5 font-bold">Usuario</th>
                <th className="px-3 py-3.5 font-bold">Motivo</th>
                <th className="px-3 py-3.5 font-bold">Fecha</th>
                <th className="px-3 py-3.5 font-bold">Estado</th>
                <th className="px-5 py-3.5 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-line-soft last:border-0 align-top">
                  <td className="px-5 py-4">
                    {report.video ? (
                      <Link
                        href={`/videos/${report.video.id}`}
                        className="font-medium text-ink hover:text-lip"
                      >
                        {report.video.title}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Reporte general</span>
                    )}
                    {report.description && (
                      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-muted">
                        {report.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-ink-muted">
                    {report.user?.email ?? report.contactEmail ?? "Anónimo"}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-ink-muted">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-ink-muted">
                    {formatDateTime(report.createdAt)}
                  </td>
                  <td className="px-3 py-4">
                    <StatusPill tone={STATUS_TONES[report.status]}>
                      {STATUS_LABELS[report.status]}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4">
                    <ReportActions reportId={report.id} status={report.status} />
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-ink-faint">
                    No hay reportes en esta vista.
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
