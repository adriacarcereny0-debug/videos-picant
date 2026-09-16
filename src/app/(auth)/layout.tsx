import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_minmax(480px,44%)]">
      {/* Panel editorial (solo escritorio) */}
      <aside className="relative hidden overflow-hidden border-r border-line-soft bg-[#0a0a0c] lg:block">
        <div className="lip-glow" aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <Logo size="lg" />
          <div className="max-w-md">
            <p className="eyebrow mb-5">Acceso privado</p>
            <p className="display-lg text-ink">
              Un catálogo cerrado.
              <br />
              Una sola llave:
              <span className="text-lip"> tu cuenta</span>.
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-muted">
              Cada reproducción se autoriza en el servidor y se sirve mediante enlaces firmados
              que caducan en minutos.
            </p>
          </div>
          <p className="text-xs text-ink-faint">
            Plataforma exclusiva para mayores de 18 años · © {new Date().getFullYear()} Madrastras
          </p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>
          {children}
          <p className="mt-10 text-center text-[11px] leading-relaxed text-ink-faint">
            Al continuar aceptas los{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink-muted">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-muted">
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
