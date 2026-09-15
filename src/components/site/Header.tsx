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
  { href: "/faq", label: "FAQ" },
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
          className={`pointer-events-auto flex w-full max-w-[1180px] items-center justify-between gap-6 rounded-full border px-3 py-2.5 pl-5 transition-all duration-700 ease-[cubic-bezier(.32,.72,0,1)] sm:px-4 sm:pl-6 ${
            scrolled
              ? "border-white/[0.09] bg-obsidian/70 shadow-[0_24px_60px_-30px_rgba(0,0,0,1)] backdrop-blur-2xl"
              : "border-white/[0.05] bg-obsidian/25 backdrop-blur-xl"
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
                  className={`focus-ring relative rounded-full px-4 py-2 text-[13px] transition-colors duration-400 ${
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-full bg-white/[0.06]"
                      aria-hidden
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="focus-ring relative grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors duration-400 hover:bg-white/[0.06] hover:text-ink"
                  aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
                >
                  <IconBell width={18} height={18} />
                  {unread > 0 && (
                    <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full bg-aurum ring-[3px] ring-obsidian" />
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  className="focus-ring hidden items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] py-2 pl-2.5 pr-4 text-[13px] text-ink transition-all duration-400 hover:border-aurum/35 sm:flex"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-aurum/15 text-aurum">
                    <IconUser width={13} height={13} />
                  </span>
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
              className="focus-ring relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-400 hover:bg-white/[0.06] lg:hidden"
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
        className={`fixed inset-0 z-30 bg-obsidian/92 backdrop-blur-3xl transition-opacity duration-500 ease-[cubic-bezier(.32,.72,0,1)] lg:hidden ${
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
              className={`font-display border-b border-white/[0.06] py-5 text-4xl text-ink transition-all duration-700 ease-[cubic-bezier(.32,.72,0,1)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${120 + index * 60}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}

          <div
            className={`mt-10 flex flex-col gap-3 transition-all duration-700 ease-[cubic-bezier(.32,.72,0,1)] ${
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: open ? "380ms" : "0ms" }}
          >
            {user ? (
              <>
                <ButtonLink href="/dashboard" size="lg" full icon tabIndex={open ? 0 : -1}>
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
                <ButtonLink href="/register" size="lg" full icon tabIndex={open ? 0 : -1}>
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
