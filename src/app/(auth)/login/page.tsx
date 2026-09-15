import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de Noctra.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
