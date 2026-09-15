import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
