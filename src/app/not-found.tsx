import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grain relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="lip-glow" aria-hidden />
      <div className="relative z-10 max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="display-lg text-ink">Esta página no existe</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
          El contenido que buscas no está disponible o has seguido un enlace caducado. Los
          accesos a los vídeos son temporales por seguridad.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Volver al inicio</ButtonLink>
          <ButtonLink href="/videos" variant="secondary">
            Ir al catálogo
          </ButtonLink>
        </div>
        <Link href="/contact" className="mt-8 block text-sm text-ink-faint hover:text-ink-muted">
          ¿Crees que es un error? Escríbenos
        </Link>
      </div>
    </div>
  );
}
