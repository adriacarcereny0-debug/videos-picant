import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        <h1 className="display-md mb-4 text-ink">Enlace no válido</h1>
        <Alert tone="danger">
          El enlace de recuperación no es válido o está incompleto. Solicita uno nuevo.
        </Alert>
        <Link
          href="/forgot-password"
          className="mt-8 block text-center text-sm font-semibold text-aurum"
        >
          Solicitar un enlace nuevo
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
