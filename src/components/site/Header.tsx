"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";
import { IconBell, IconClose, IconMenu, IconUser } from "@/components/icons";

export interface HeaderUser {
  displayName: string | null;
  email: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "BASIC" | "PREMIUM";
}

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/videos", label: "Vídeos" },
  { href: "/pricing", label: "Suscripciones" },
  { href: "/faq", label: "FAQ" },
];

export function Header({ user, unread }: { user: HeaderUser | null; unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-line-soft bg-obsidian/88 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 ${
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/notifications"
                className="focus-ring relative grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
                aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
              >
                <IconBell />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-aurum px-1 text-[10px] font-bold text-obsidian">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                className="focus-ring hidden items-center gap-2.5 rounded-full border border-line bg-elevated px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-aurum/40 sm:flex"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-aurum/15 text-aurum">
                  <IconUser width={14} height={14} />
                </span>
                <span className="max-w-[120px] truncate">
                  {user.displayName || user.email.split("@")[0]}
                </span>
              </Link>
            </>
          ) : (
            <>
              {/* El enlace se envuelve para que `hidden` no compita con el
                  `inline-flex` del propio botón. */}
              <span className="hidden sm:block">
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Iniciar sesión
                </ButtonLink>
              </span>
              <ButtonLink href="/register" size="sm">
                Registrarse
              </ButtonLink>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="focus-ring grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fade-in fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto border-t border-line bg-obsidian/97 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1 px-4 py-6" aria-label="Menú móvil">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-xl px-4 py-3.5 font-display text-lg font-bold text-ink transition-colors hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <div className="hairline my-4" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-4 py-3.5 text-[15px] text-ink-muted hover:text-ink"
                >
                  Mi cuenta
                </Link>
                <Link
                  href="/subscription"
                  className="rounded-xl px-4 py-3.5 text-[15px] text-ink-muted hover:text-ink"
                >
                  Mi suscripción
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-xl px-4 py-3.5 text-[15px] text-aurum hover:text-aurum-soft"
                  >
                    Panel de administración
                  </Link>
                )}
                <form action="/api/auth/logout" method="post" className="px-4 pt-3">
                  <button
                    type="submit"
                    className="focus-ring text-[15px] font-medium text-danger"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col gap-3 px-1 pt-2">
                <ButtonLink href="/register" size="lg" full>
                  Crear cuenta
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" size="lg" full>
                  Iniciar sesión
                </ButtonLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
