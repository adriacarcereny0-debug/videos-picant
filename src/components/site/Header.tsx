"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";
import { IconBell, IconUser } from "@/components/icons";

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
];

/**
 * Isla flotante: la navegación no se pega al borde superior, flota como una
 * pastilla de cristal separada del contenido.
 */
export function Header({ user, unread }: { user: HeaderUser | null; unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-5 sm:pt-6">
        <div
          className={`pointer-events-auto flex w-full max-w-[1180px] items-center justify-between gap-6 border-b px-1 py-4 transition-colors duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            scrolled ? "border-line bg-noir/95 backdrop-blur-md" : "border-transparent"
          }`}
        >
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring relative px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
                    active ? "text-ink" : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-3 -bottom-[3px] h-[2px] bg-lip"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="focus-ring relative grid h-10 w-10 place-items-center text-ink-muted transition-colors duration-300 hover:text-ink"
                  aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
                >
                  <IconBell width={18} height={18} />
                  {unread > 0 && (
                    <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full bg-lip ring-[3px] ring-noir" aria-hidden />
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  className="focus-ring hidden items-center gap-2 border-b border-transparent py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:border-lip sm:flex"
                >
                  <IconUser width={14} height={14} className="text-lip" />
                  <span className="max-w-[110px] truncate">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <span className="hidden sm:block">
                  <ButtonLink href="/login" variant="ghost" size="sm">
                    Entrar
                  </ButtonLink>
                </span>
                <ButtonLink href="/register" size="sm">
                  Crear cuenta
                </ButtonLink>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="focus-ring relative grid h-10 w-10 place-items-center text-ink transition-colors duration-300 lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {/* Las dos líneas rotan y se cruzan hasta formar la X */}
              <span className="relative block h-[11px] w-[18px]" aria-hidden>
                <span
                  className={`absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-all duration-500 ease-[cubic-bezier(.32,.72,0,1)] ${
                    open ? "top-[5px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-all duration-500 ease-[cubic-bezier(.32,.72,0,1)] ${
                    open ? "top-[5px] -rotate-45" : "top-[10px]"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay a pantalla completa con revelado escalonado */}
      <div
        className={`fixed inset-0 z-30 bg-noir transition-opacity duration-400 ease-[cubic-bezier(.22,1,.36,1)] lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav
          className="flex h-full flex-col justify-center px-8 pb-24"
          aria-label="Menú"
          aria-hidden={!open}
        >
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              className={`font-display border-b border-line-soft py-5 text-[2.75rem] leading-none text-ink transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${80 + index * 50}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}

          <div
            className={`mt-10 flex flex-col gap-3 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: open ? "300ms" : "0ms" }}
          >
            {user ? (
              <>
                <ButtonLink href="/dashboard" size="lg" full tabIndex={open ? 0 : -1}>
                  Mi cuenta
                </ButtonLink>
                <ButtonLink
                  href="/subscription"
                  variant="secondary"
                  size="lg"
                  full
                  tabIndex={open ? 0 : -1}
                >
                  Mi suscripción
                </ButtonLink>
                {user.role === "ADMIN" && (
                  <ButtonLink
                    href="/admin"
                    variant="outline"
                    size="lg"
                    full
                    tabIndex={open ? 0 : -1}
                  >
                    Administración
                  </ButtonLink>
                )}
                <form action="/api/auth/logout" method="post" className="pt-2">
                  <button
                    type="submit"
                    tabIndex={open ? 0 : -1}
                    className="focus-ring w-full py-3 text-[14px] text-danger"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/register" size="lg" full tabIndex={open ? 0 : -1}>
                  Crear cuenta
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="secondary"
                  size="lg"
                  full
                  tabIndex={open ? 0 : -1}
                >
                  Iniciar sesión
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
