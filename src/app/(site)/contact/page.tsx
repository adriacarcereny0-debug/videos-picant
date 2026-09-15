import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Ponte en contacto con el equipo de Noctra.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-14 sm:px-6 lg:py-20">
      <div className="max-w-xl">
        <p className="eyebrow mb-4">Soporte</p>
        <h1 className="display-lg text-ink">Contacto</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">
          Escríbenos para cualquier duda sobre tu cuenta, tu suscripción o la facturación.
          Respondemos en un plazo máximo de 48 horas hábiles.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="surface p-6 sm:p-8">
          <ContactForm defaultEmail={user?.email ?? ""} />
        </div>

        <aside className="space-y-6">
          <div className="surface p-6">
            <h2 className="font-display mb-2 text-base font-bold text-ink">
              Reportar contenido
            </h2>
            <p className="text-[14px] leading-relaxed text-ink-muted">
              Si quieres denunciar un contenido concreto, utiliza el{" "}
              <Link href="/report" className="text-aurum underline underline-offset-2">
                formulario de reporte
              </Link>
              . Las solicitudes de retirada por publicación sin autorización se tramitan con
              carácter prioritario.
            </p>
          </div>

          <div className="surface p-6">
            <h2 className="font-display mb-2 text-base font-bold text-ink">Facturación</h2>
            <p className="text-[14px] leading-relaxed text-ink-muted">
              Las facturas y el método de pago se gestionan desde el portal de Stripe, accesible
              en <Link href="/subscription" className="text-aurum">Mi suscripción</Link>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
