import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Pie reducido a lo que de verdad se usa: navegación, cuenta y lo legal
 * obligatorio. Cuatro columnas de enlaces eran un directorio, no un pie.
 */
const NAV = [
  { href: "/videos", label: "Catálogo" },
  { href: "/pricing", label: "Suscripciones" },
  { href: "/subscription", label: "Mi suscripción" },
  { href: "/contact", label: "Contacto" },
];

const LEGAL = [
  { href: "/terms", label: "Términos" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/refunds", label: "Cancelación" },
  { href: "/report", label: "Reportar contenido" },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t border-line-soft">
      <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-[14px] leading-[1.7] text-ink-muted">
              Catálogo privado de vídeo bajo suscripción mensual. Acceso restringido y
              reproducción protegida con enlaces que caducan.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3" aria-label="Pie">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring text-[14px] text-ink-muted transition-colors duration-300 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hairline my-12" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring text-[12px] text-ink-faint transition-colors duration-300 hover:text-ink-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="flex items-center gap-3 text-[12px] text-ink-faint">
            <span className="bg-lip px-1.5 py-0.5 font-display text-[11px] leading-none text-ink">
              +18
            </span>
            © {new Date().getFullYear()} Madrastras
          </p>
        </div>
      </div>
    </footer>
  );
}
