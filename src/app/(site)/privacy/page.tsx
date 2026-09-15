import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales en Noctra.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      updatedAt="15 de septiembre de 2026"
      intro="Explicamos qué datos recogemos, con qué finalidad y qué derechos puedes ejercer sobre ellos."
    >
      <LegalSection title="1. Datos que tratamos">
        <ul className="space-y-2">
          <li>
            <strong>Datos de cuenta:</strong> correo electrónico, nombre para mostrar y
            contraseña (almacenada siempre como hash, nunca en claro).
          </li>
          <li>
            <strong>Datos de suscripción:</strong> plan contratado, estado, fechas de periodo e
            identificadores de Stripe. No tenemos acceso a los datos de tu tarjeta.
          </li>
          <li>
            <strong>Datos de uso:</strong> vídeos reproducidos y segundos visualizados, para
            ofrecer recomendaciones y estadísticas agregadas.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, agente de usuario y registros de
            seguridad para prevenir accesos abusivos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Finalidad y base jurídica">
        <p>
          Tratamos tus datos para prestar el servicio contratado (ejecución del contrato),
          cumplir obligaciones legales y fiscales, y garantizar la seguridad de la plataforma
          (interés legítimo).
        </p>
      </LegalSection>

      <LegalSection title="3. Encargados de tratamiento">
        <p>
          Compartimos únicamente los datos imprescindibles con los proveedores necesarios para
          operar: pasarela de pago (Stripe), proveedor de almacenamiento de objetos, proveedor de
          correo transaccional e infraestructura de alojamiento. Todos ellos actúan bajo contrato
          de encargo de tratamiento.
        </p>
      </LegalSection>

      <LegalSection title="4. Conservación">
        <p>
          Conservamos los datos de cuenta mientras la suscripción esté activa y, tras su baja,
          durante los plazos legales aplicables en materia fiscal y de prevención del fraude.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus derechos">
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación
          y portabilidad escribiéndonos desde el <a href="/contact">formulario de contacto</a>.
          También puedes presentar una reclamación ante la autoridad de control competente.
        </p>
      </LegalSection>

      <LegalSection title="6. Seguridad">
        <p>
          Aplicamos cifrado en tránsito (HTTPS), hash seguro de contraseñas, cookies HttpOnly,
          protección frente a CSRF y XSS, limitación de intentos de acceso y almacenamiento
          privado de los vídeos con enlaces firmados de caducidad corta.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
