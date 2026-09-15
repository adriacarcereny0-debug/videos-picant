import { Logo } from "@/components/Logo";

/**
 * Pantalla de configuración pendiente.
 *
 * Se muestra cuando la aplicación no puede hablar con la base de datos, que
 * en la práctica significa un despliegue todavía sin variables de entorno.
 * Es preferible a una pantalla de error genérica: dice exactamente qué falta.
 */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-20">
      <div className="w-full max-w-xl">
        <div className="mb-12 flex justify-center">
          <Logo href={null} size="lg" />
        </div>

        <div className="shell">
          <div className="shell-core p-8 sm:p-10">
            <p className="eyebrow mb-5">Configuración pendiente</p>
            <h1 className="display-md mb-5 text-ink">
              La plataforma está desplegada, pero le falta su
              <span className="accent-italic"> infraestructura</span>
            </h1>
            <p className="mb-8 text-[15px] leading-[1.75] text-ink-muted">
              No se ha podido conectar con la base de datos. Define estas variables de entorno
              en el proyecto y vuelve a desplegar.
            </p>

            <ul className="mb-8 space-y-3">
              {missing.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                  <code className="text-[13px] text-ink">{item}</code>
                </li>
              ))}
            </ul>

            <p className="text-[13px] leading-relaxed text-ink-faint">
              Las instrucciones completas, con los pasos de Neon, Vercel Blob y Stripe, están en
              el apartado «Despliegue en Vercel» del README del repositorio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
