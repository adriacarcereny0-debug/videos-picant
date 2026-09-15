import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: { default: "Administración", template: "%s · Admin Noctra" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Puerta de acceso: rol ADMIN verificado en servidor en cada petición.
  const admin = await requireAdmin();
  const pendingReports = await prisma.report.count({ where: { status: "PENDING" } });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-line bg-obsidian/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo href="/admin" size="sm" />
            <span className="hidden rounded-full border border-aurum/30 bg-aurum/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-aurum sm:inline">
              Administración
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[13px] text-ink-muted sm:inline">{admin.email}</span>
            <Link
              href="/"
              className="focus-ring rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:border-aurum/40 hover:text-ink"
            >
              Ir al sitio
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
          <AdminNav pendingReports={pendingReports} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
