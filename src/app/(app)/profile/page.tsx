import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Perfil",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const [record, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">Cuenta</p>
        <h1 className="display-lg text-ink">Perfil</h1>
      </header>

      <ProfileForm
        email={user.email}
        displayName={user.displayName}
        emailVerified={user.emailVerified}
      />

      <section className="surface p-6 sm:p-7">
        <h2 className="font-display mb-1 text-lg font-bold text-ink">Sesiones activas</h2>
        <p className="mb-5 text-[13px] text-ink-muted">
          Al cambiar la contraseña se cierran todas las sesiones excepto la actual.
        </p>
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-1 rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="truncate text-ink-muted">{session.userAgent ?? "Dispositivo"}</span>
              <span className="shrink-0 text-ink-faint">
                Inicio: {formatDateTime(session.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface p-6 sm:p-7">
        <h2 className="font-display mb-4 text-lg font-bold text-ink">Datos de la cuenta</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Fecha de registro
            </dt>
            <dd className="mt-1 text-ink">{formatDateTime(record?.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Último acceso
            </dt>
            <dd className="mt-1 text-ink">{formatDateTime(record?.lastLoginAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
