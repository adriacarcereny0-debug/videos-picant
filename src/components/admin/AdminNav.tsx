"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChart,
  IconCreditCard,
  IconFilm,
  IconFlag,
  IconGrid,
  IconLogout,
  IconSettings,
  IconUsers,
} from "@/components/icons";

const ITEMS = [
  { href: "/admin", label: "Resumen", icon: <IconGrid />, exact: true },
  { href: "/admin/videos", label: "Vídeos", icon: <IconFilm /> },
  { href: "/admin/users", label: "Usuarios", icon: <IconUsers /> },
  { href: "/admin/subscriptions", label: "Suscripciones", icon: <IconCreditCard /> },
  { href: "/admin/reports", label: "Reportes", icon: <IconFlag /> },
  { href: "/admin/settings", label: "Ajustes", icon: <IconSettings /> },
];

export function AdminNav({ pendingReports }: { pendingReports: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Administración">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                className={`focus-ring flex items-center gap-3 border-l-2 py-2.5 pl-4 text-[13px] font-medium transition-colors duration-300 ${
                  active
                    ? "border-lip text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <span className={active ? "text-lip" : "text-ink-faint"}>{item.icon}</span>
                {item.label}
                {item.href === "/admin/reports" && pendingReports > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-[2px] bg-danger px-1.5 text-[10px] font-bold text-noir">
                    {pendingReports}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hairline my-4 hidden lg:block" />

      <div className="hidden space-y-1 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 border-l-2 border-transparent py-2.5 pl-4 text-[13px] font-medium text-ink-muted transition-colors duration-300 hover:text-ink"
        >
          <span className="text-ink-faint">
            <IconChart />
          </span>
          Ver como usuario
        </Link>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="focus-ring flex w-full items-center gap-3 border-l-2 border-transparent py-2.5 pl-4 text-[13px] font-medium text-ink-muted transition-colors duration-300 hover:text-danger"
          >
            <span className="text-ink-faint">
              <IconLogout />
            </span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
