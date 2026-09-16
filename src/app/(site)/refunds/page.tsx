import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Cancelación y reembolsos",
  description: "Condiciones de cancelación y política de reembolsos de Madrastras.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalLayout
      title="Política de cancelación y reembolsos"
      updatedAt="15 de septiembre de 2026"
      intro="Queremos que cancelar sea tan sencillo como suscribirse."
    >
      <LegalSection title="Cómo cancelar">
        <p>
          Desde <a href="/subscription">Mi suscripción</a> puedes cancelar con un solo clic, sin
          llamadas ni formularios. También puedes hacerlo desde el portal de cliente de Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Efectos de la cancelación">
        <p>
          La cancelación detiene la renovación automática. Conservarás el acceso completo hasta
          el final del periodo ya abonado y no se realizarán nuevos cargos. Puedes reactivar la
          suscripción antes de esa fecha sin perder nada.
        </p>
      </LegalSection>

      <LegalSection title="Derecho de desistimiento">
        <p>
          Al tratarse de contenido digital de acceso inmediato, al contratar aceptas expresamente
          el inicio de la prestación y reconoces la pérdida del derecho de desistimiento una vez
          se ha accedido al contenido, conforme a la normativa de consumo aplicable.
        </p>
      </LegalSection>

      <LegalSection title="Reembolsos">
        <ul className="space-y-2">
          <li>
            Estudiamos caso por caso las solicitudes por <strong>cobros duplicados</strong> o
            errores de facturación, y los devolvemos íntegramente.
          </li>
          <li>
            Si una incidencia técnica atribuible a la plataforma te ha impedido acceder al
            servicio de forma prolongada, valoramos un reembolso proporcional.
          </li>
          <li>
            No se reembolsan periodos ya disfrutados por el mero hecho de no haber utilizado el
            servicio.
          </li>
        </ul>
        <p>
          Para solicitar un reembolso, escríbenos desde el{" "}
          <a href="/contact">formulario de contacto</a> indicando el correo de tu cuenta y la
          fecha del cargo. Respondemos en un plazo máximo de 5 días hábiles.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
