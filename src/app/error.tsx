"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";
import { Logo } from "@/components/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="eyebrow mb-4">Algo ha fallado</p>
        <h1 className="display-lg text-ink">No hemos podido cargar esta página</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
          Se ha producido un error inesperado. Puedes intentarlo de nuevo; si persiste,
          escríbenos y lo revisamos.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Reintentar</Button>
          <ButtonLink href="/" variant="secondary">
            Volver al inicio
          </ButtonLink>
        </div>
        {error.digest && (
          <p className="mt-8 font-mono text-[11px] text-ink-faint">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
