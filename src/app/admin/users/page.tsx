import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { UserActions } from "@/components/admin/UserActions";
import { IconSearch } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

const PLAN_FILTERS = [
  { key: "", label: "Todos" },
  { key: "free", label: "Free" },
  { key: "basic", label: "Básico" },
  { key: "premium", label: "Premium" },
  { key: "suspended", label: "Suspendidos" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim();
  const plan = params.plan ?? "";

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { displayName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(plan === "suspended" ? { accountStatus: "SUSPENDED" as const } : {}),
    ...(plan === "free"
      ? {
          OR: [
            { subscription: null },
            { subscription: { plan: "FREE" as const } },
            { subscription: { status: { notIn: ["ACTIVE", "TRIALING"] as const } } },
          ],
        }
      : {}),
    ...(plan === "basic"
      ? { subscription: { plan: "BASIC" as const, status: { in: ["ACTIVE", "TRIALING"] as const } } }
      : {}),
    ...(plan === "premium"
      ? { subscription: { plan: "PREMIUM" as const, status: { in: ["ACTIVE", "TRIALING"] as const } } }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { subscription: true },
    take: 200,
  });

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Comunidad</p>
          <h1 className="display-lg text-ink">Usuarios</h1>
          <p className="mt-2 text-[14px] text-ink-muted">
            {users.length} {users.length === 1 ? "cuenta" : "cuentas"} en esta vista.
          </p>
        </div>

        <form action="/admin/users" className="relative w-full lg:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <IconSearch width={16} height={16} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Buscar por correo o nombre"
            aria-label="Buscar usuarios"
            className="w-full rounded-full border border-line bg-[#0d0d11] py-2.5 pl-10 pr-4 text-[13px] text-ink placeholder:text-ink-faint focus:border-aurum/50 focus:outline-none"
          />
          {plan && <input type="hidden" name="plan" value={plan} />}
        </form>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {PLAN_FILTERS.map((item) => {
          const active = plan === item.key;
          const query = new URLSearchParams();
          if (item.key) query.set("plan", item.key);
          if (search) query.set("q", search);
          return (
            <Link
              key={item.label}
              href={`/admin/users${query.toString() ? `?${query}` : ""}`}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                active
                  ? "border-aurum/50 bg-aurum/12 text-aurum-soft"
                  : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="surface overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <th className="px-5 py-3.5 font-bold">Usuario</th>
                <th className="px-3 py-3.5 font-bold">Plan</th>
                <th className="px-3 py-3.5 font-bold">Estado</th>
                <th className="px-3 py-3.5 font-bold">Renovación</th>
                <th className="px-3 py-3.5 font-bold">Registro</th>
                <th className="px-3 py-3.5 font-bold">Último acceso</th>
                <th className="px-5 py-3.5 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const active =
                  user.subscription?.status === "ACTIVE" ||
                  user.subscription?.status === "TRIALING";
                const planLabel = !active
                  ? "Free"
                  : user.subscription?.plan === "PREMIUM"
                    ? "Premium"
                    : user.subscription?.plan === "BASIC"
                      ? "Básico"
                      : "Free";

                return (
                  <tr key={user.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{user.email}</p>
                      <p className="text-[11px] text-ink-faint">
                        {user.displayName ?? "Sin nombre"}
                        {user.role === "ADMIN" && " · Administrador"}
                        {!user.emailVerified && " · Sin verificar"}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill
                        tone={
                          planLabel === "Premium"
                            ? "positive"
                            : planLabel === "Básico"
                              ? "neutral"
                              : "neutral"
                        }
                      >
                        {planLabel}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill tone={user.accountStatus === "ACTIVE" ? "positive" : "danger"}>
                        {user.accountStatus === "ACTIVE" ? "Activa" : "Suspendida"}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {active ? formatDate(user.subscription?.currentPeriodEnd) : "—"}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <UserActions
                        userId={user.id}
                        suspended={user.accountStatus === "SUSPENDED"}
                        isAdmin={user.role === "ADMIN"}
                      />
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-faint">
                    No hay usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-ink-faint">
        El panel no muestra en ningún caso datos bancarios: los métodos de pago se gestionan
        íntegramente en Stripe y la plataforma solo conserva identificadores de cliente y
        suscripción.
      </p>
    </div>
  );
}
