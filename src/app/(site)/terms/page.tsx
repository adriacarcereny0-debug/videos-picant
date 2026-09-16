import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso del servicio de suscripción de Madrastras.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos y condiciones"
      updatedAt="15 de septiembre de 2026"
      intro="Estas condiciones regulan el acceso y el uso de Madrastras, una plataforma privada de vídeo bajo suscripción destinada exclusivamente a personas mayores de 18 años."
    >
      <LegalSection title="1. Objeto del servicio">
        <p>
          Madrastras ofrece acceso a un catálogo privado de contenido audiovisual mediante
          suscripciones mensuales de pago. El acceso a cada pieza depende del nivel del plan
          contratado: <strong>Básico</strong> o <strong>Premium</strong>.
        </p>
      </LegalSection>

      <LegalSection title="2. Mayoría de edad">
        <p>
          El uso de la plataforma está reservado a personas mayores de 18 años. Al registrarte
          declaras y garantizas que cumples este requisito. Nos reservamos el derecho de
          suspender cualquier cuenta cuando existan indicios razonables de incumplimiento.
        </p>
      </LegalSection>

      <LegalSection title="3. Cuenta de usuario">
        <p>
          La cuenta es personal e intransferible. Eres responsable de mantener la
          confidencialidad de tus credenciales y de toda la actividad realizada desde tu cuenta.
          Debes comunicarnos de inmediato cualquier uso no autorizado.
        </p>
      </LegalSection>

      <LegalSection title="4. Suscripciones y pagos">
        <ul className="space-y-2">
          <li>El plan Básico cuesta 9,99 € al mes, impuestos incluidos.</li>
          <li>El plan Premium cuesta 19,99 € al mes, impuestos incluidos.</li>
          <li>La facturación es mensual y se renueva automáticamente hasta que canceles.</li>
          <li>Los pagos se procesan a través de Stripe; no almacenamos datos de tarjetas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cancelación">
        <p>
          Puedes cancelar en cualquier momento desde tu panel. La cancelación surte efecto al
          final del periodo ya abonado, durante el cual conservas el acceso. Consulta la
          política de cancelación y reembolsos para más detalle.
        </p>
      </LegalSection>

      <LegalSection title="6. Uso permitido del contenido">
        <p>
          El contenido se ofrece únicamente para su visualización en streaming y para uso
          personal y privado. Queda expresamente prohibido:
        </p>
        <ul className="space-y-2">
          <li>Descargar, copiar, grabar o redistribuir el contenido por cualquier medio.</li>
          <li>Compartir credenciales o facilitar el acceso a terceros.</li>
          <li>Eludir o intentar eludir las medidas técnicas de protección.</li>
          <li>Usar sistemas automatizados para extraer contenido de la plataforma.</li>
        </ul>
        <p>
          El incumplimiento puede conllevar la suspensión inmediata de la cuenta sin derecho a
          reembolso, además de las acciones legales que correspondan.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual">
        <p>
          Todo el contenido, la marca, el diseño y el software de la plataforma están protegidos
          por la normativa de propiedad intelectual. La suscripción otorga un derecho de acceso
          limitado, revocable y no exclusivo; no transfiere titularidad alguna.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidad">
        <p>
          Trabajamos para mantener el servicio disponible de forma continuada, pero no podemos
          garantizar la ausencia total de interrupciones por mantenimiento, incidencias técnicas
          o causas ajenas a nuestro control.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificaciones">
        <p>
          Podemos actualizar estas condiciones. Te avisaremos con antelación razonable de
          cualquier cambio sustancial que afecte a tu suscripción. Si no estás de acuerdo, puedes
          cancelar antes de que el cambio entre en vigor.
        </p>
      </LegalSection>

      <LegalSection title="10. Contacto">
        <p>
          Para cualquier consulta sobre estas condiciones puedes escribirnos desde el{" "}
          <a href="/contact">formulario de contacto</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
