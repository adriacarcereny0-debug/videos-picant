import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resolvemos las dudas habituales sobre suscripciones, pagos, privacidad y acceso al contenido de Noctra.",
  alternates: { canonical: "/faq" },
};

const GROUPS = [
  {
    title: "Suscripción y pagos",
    items: [
      {
        q: "¿Qué diferencia hay entre el plan Básico y el Premium?",
        a: "El plan Básico (9,99 €/mes) da acceso a todo el contenido marcado como Básico. El plan Premium (19,99 €/mes) incluye ese mismo contenido más todo el catálogo Premium y acceso prioritario a los nuevos vídeos.",
      },
      {
        q: "¿Cómo se procesan los pagos?",
        a: "A través de Stripe. Noctra no almacena en ningún momento los datos de tu tarjeta: la información de pago viaja directamente a Stripe, que es el responsable de custodiarla.",
      },
      {
        q: "¿Puedo cambiar de plan?",
        a: "Sí. Desde «Mi suscripción» puedes pasar de Básico a Premium o al revés. El importe se prorratea automáticamente según el tiempo restante del periodo en curso.",
      },
      {
        q: "¿Hay permanencia?",
        a: "No. La suscripción es mensual y puedes cancelarla cuando quieras. Conservarás el acceso hasta el final del periodo ya pagado.",
      },
      {
        q: "¿Cómo cancelo?",
        a: "Desde «Mi suscripción», con un clic. También puedes gestionarlo desde el portal de cliente de Stripe, donde además puedes actualizar tu método de pago y descargar tus facturas.",
      },
    ],
  },
  {
    title: "Acceso y contenido",
    items: [
      {
        q: "¿Puedo ver el contenido sin suscripción?",
        a: "Puedes navegar por la plataforma y ver las fichas y miniaturas del catálogo, pero la reproducción requiere una suscripción activa del nivel correspondiente.",
      },
      {
        q: "¿En cuántos dispositivos puedo verlo?",
        a: "Tu cuenta funciona en móvil, tablet y ordenador. La sesión es personal e intransferible.",
      },
      {
        q: "¿Puedo descargar los vídeos?",
        a: "No. La reproducción se realiza en streaming mediante enlaces temporales firmados que caducan; no ofrecemos descarga.",
      },
    ],
  },
  {
    title: "Privacidad y seguridad",
    items: [
      {
        q: "¿Cómo protegéis los vídeos?",
        a: "Los ficheros se guardan en un almacenamiento de objetos privado. Antes de generar cualquier acceso comprobamos en el servidor tu plan y el nivel del vídeo, y solo entonces emitimos un enlace firmado con caducidad corta.",
      },
      {
        q: "¿Qué aparece en mi extracto bancario?",
        a: "Un cargo discreto correspondiente al concepto configurado en Stripe, sin referencias al tipo de contenido.",
      },
      {
        q: "¿Puedo eliminar mi cuenta?",
        a: "Sí. Escríbenos desde el formulario de contacto y eliminaremos tu cuenta y tus datos personales conforme a la política de privacidad.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-14 sm:px-6 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow mb-4">Ayuda</p>
        <h1 className="display-lg text-ink">Preguntas frecuentes</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">
          Si no encuentras lo que buscas, escríbenos desde el{" "}
          <Link href="/contact" className="text-aurum underline underline-offset-4">
            formulario de contacto
          </Link>
          .
        </p>
      </div>

      <div className="mt-14 space-y-14">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-aurum">
              {group.title}
            </h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="surface group overflow-hidden !p-0 [&[open]]:border-aurum/25"
                >
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-ink">
                    {item.q}
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-ink-faint transition-transform duration-300 group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-ink-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="surface mt-16 flex flex-col items-center gap-5 px-6 py-12 text-center">
        <h2 className="display-md text-ink">¿Listo para entrar?</h2>
        <p className="max-w-md text-sm text-ink-muted">
          Elige tu plan y accede al catálogo privado en menos de un minuto.
        </p>
        <ButtonLink href="/pricing" size="lg">
          Ver suscripciones
        </ButtonLink>
      </div>
    </div>
  );
}
