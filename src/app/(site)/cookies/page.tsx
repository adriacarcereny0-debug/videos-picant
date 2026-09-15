import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies utiliza Noctra y con qué finalidad.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de cookies"
      updatedAt="15 de septiembre de 2026"
      intro="Usamos el mínimo imprescindible de cookies: solo las necesarias para que la plataforma funcione."
    >
      <LegalSection title="Cookies que utilizamos">
        <ul className="space-y-3">
          <li>
            <strong>noctra_session</strong> — cookie técnica de sesión. HttpOnly, Secure y
            SameSite=Lax. Permite mantener tu sesión iniciada. Caduca a los 7 días, o a los 30 si
            marcas «Recordarme».
          </li>
          <li>
            <strong>noctra_age_ok</strong> — cookie técnica que recuerda que has confirmado ser
            mayor de 18 años, para no mostrarte la pantalla de verificación en cada visita.
            Caduca a los 90 días.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies de terceros">
        <p>
          Durante el proceso de pago, Stripe puede establecer sus propias cookies necesarias para
          la seguridad de la transacción y la prevención del fraude. Este tratamiento se rige por
          la política de privacidad de Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Cookies que NO utilizamos">
        <p>
          No usamos cookies publicitarias, de perfilado ni de seguimiento entre sitios. No
          cedemos datos de navegación a redes publicitarias.
        </p>
      </LegalSection>

      <LegalSection title="Gestión">
        <p>
          Puedes eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que,
          al tratarse de cookies técnicas, su bloqueo impedirá iniciar sesión y acceder al
          contenido.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
