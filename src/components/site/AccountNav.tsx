"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconBell,
  IconCreditCard,
  IconFilm,
  IconGrid,
  IconLogout,
  IconUser,
} from "@/components/icons";

const ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconGrid /> },
  { href: "/videos", label: "Vídeos", icon: <IconFilm /> },
  { href: "/subscription", label: "Mi suscripción", icon: <IconCreditCard /> },
  { href: "/notifications", label: "Notificaciones", icon: <IconBell /> },
  { href: "/profile", label: "Perfil", icon: <IconUser /> },
];

/** Navegación lateral (escritorio). */
export function AccountSidebar({ unread }: { unread: number }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-[calc(var(--header-h)+24px)] hidden lg:block" aria-label="Mi cuenta">
      <ul className="space-y-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
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
                {item.href === "/notifications" && unread > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-[2px] bg-lip px-1.5 text-[10px] font-bold text-ink">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hairline my-4" />

      <form action="/api/auth/logout" method="post">
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
    </nav>
  );
}

/** Barra inferior fija (móvil). */
export function AccountTabBar({ unread }: { unread: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-noir/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación de cuenta"
    >
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? "text-lip" : "text-ink-faint"
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.href === "/notifications" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-lip" />
                  )}
                </span>
                {item.label.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
