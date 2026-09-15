import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { href: "/videos", label: "Catálogo" },
      { href: "/pricing", label: "Suscripciones" },
      { href: "/faq", label: "Preguntas frecuentes" },
      { href: "/contact", label: "Contacto" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/login", label: "Iniciar sesión" },
      { href: "/register", label: "Crear cuenta" },
      { href: "/subscription", label: "Mi suscripción" },
      { href: "/forgot-password", label: "Recuperar contraseña" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Términos y condiciones" },
      { href: "/privacy", label: "Política de privacidad" },
      { href: "/cookies", label: "Política de cookies" },
      { href: "/refunds", label: "Cancelación y reembolsos" },
      { href: "/report", label: "Reportar contenido" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line-soft bg-[#0a0a0c]">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-ink-muted">
              Catálogo privado de vídeo bajo suscripción. Acceso restringido, contenido exclusivo
              y reproducción protegida mediante enlaces temporales.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-ink-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
              SOLO +18
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="focus-ring text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline my-12" />

        <div className="flex flex-col gap-4 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Noctra. Todos los derechos reservados.</p>
          <p className="max-w-lg leading-relaxed">
            Plataforma destinada exclusivamente a personas mayores de 18 años. Todo el contenido
            se publica con el consentimiento de las personas que aparecen en él.
          </p>
        </div>
      </div>
    </footer>
  );
}
