import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { AGE_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Verificación de edad",
  description: "Esta plataforma es exclusivamente para personas mayores de 18 años.",
  robots: { index: false, follow: false },
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/age-verification")) return "/";
  return value;
}

export default async function AgeVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  async function confirmAge(formData: FormData) {
    "use server";
    const target = safeNext(String(formData.get("next") ?? "/"));
    const store = await cookies();
    store.set(AGE_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    redirect(target);
  }

  return (
    <main className="grain relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div className="lip-glow" aria-hidden />

      <div className="relative z-10 w-full max-w-lg">
        <div className="surface rise p-8 text-center sm:p-11">
          <div className="mb-8 flex justify-center">
            <Logo href={null} size="lg" />
          </div>

          <p className="eyebrow mb-4">Acceso restringido</p>

          <h1 className="display-md mb-5 text-ink">
            Esta plataforma es exclusivamente para personas mayores de 18 años.
          </h1>

          <p className="mx-auto mb-9 max-w-md text-[15px] leading-relaxed text-ink-muted">
            El contenido alojado en Madrastras es de carácter privado y está destinado únicamente a
            un público adulto. Confirma tu edad para continuar.
          </p>

          <form action={confirmAge} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next} />
            <Button type="submit" size="lg" full>
              Soy mayor de 18 años
            </Button>
            <a
              href="https://www.google.com"
              rel="noreferrer"
              className="focus-ring inline-flex h-13 w-full items-center justify-center rounded-full border border-line px-7 text-[15px] font-semibold text-ink-muted transition-colors hover:border-danger/40 hover:text-danger"
            >
              Salir
            </a>
          </form>

          <div className="hairline my-8" />

          <p className="text-xs leading-relaxed text-ink-faint">
            Al continuar aceptas nuestros{" "}
            <a href="/terms" className="text-ink-muted underline underline-offset-2 hover:text-ink">
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a href="/privacy" className="text-ink-muted underline underline-offset-2 hover:text-ink">
              política de privacidad
            </a>
            . Guardaremos tu confirmación en una cookie técnica durante 90 días.
          </p>
        </div>
      </div>
    </main>
  );
}
