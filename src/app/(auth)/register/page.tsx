import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en Madrastras y elige tu suscripción.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
