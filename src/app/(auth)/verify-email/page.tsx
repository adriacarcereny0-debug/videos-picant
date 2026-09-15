import type { Metadata } from "next";
import Link from "next/link";
import { Alert, ButtonLink } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { hashToken, logSecurityEvent } from "@/lib/security";
import { notify } from "@/lib/notifications";
import { mailer } from "@/lib/mail";

export const metadata: Metadata = {
  title: "Verificar correo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function consumeToken(token: string): Promise<"ok" | "invalid" | "already"> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.purpose !== "EMAIL_VERIFICATION") return "invalid";
  if (record.usedAt) return "already";
  if (record.expiresAt < new Date()) return "invalid";
  if (record.user.emailVerified) return "already";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logSecurityEvent("EMAIL_VERIFIED", { userId: record.userId, email: record.user.email });
  await notify(
    record.userId,
    "ACCOUNT_VERIFIED",
    "Cuenta verificada",
    "Tu dirección de correo ha sido verificada correctamente.",
    "/dashboard",
  );
  await mailer.welcome(record.user.email);

  return "ok";
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await consumeToken(token) : "missing";

  if (result === "missing") {
    return (
      <div>
        <h1 className="display-md mb-3 text-ink">Verifica tu correo</h1>
        <p className="mb-6 text-sm leading-relaxed text-ink-muted">
          Te hemos enviado un enlace de verificación a tu dirección de correo. Ábrelo para
          confirmar tu cuenta.
        </p>
        <Alert>
          ¿No lo encuentras? Revisa la carpeta de correo no deseado o solicita un enlace nuevo
          desde tu perfil.
        </Alert>
        <ButtonLink href="/dashboard" full size="lg" className="mt-8">
          Ir a mi cuenta
        </ButtonLink>
      </div>
    );
  }

  if (result === "invalid") {
    return (
      <div>
        <h1 className="display-md mb-4 text-ink">Enlace no válido</h1>
        <Alert tone="danger">
          Este enlace de verificación no es válido o ha caducado. Puedes solicitar uno nuevo
          desde tu perfil.
        </Alert>
        <ButtonLink href="/profile" full size="lg" className="mt-8">
          Ir a mi perfil
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display-md mb-4 text-ink">
        {result === "already" ? "Correo ya verificado" : "Correo verificado"}
      </h1>
      <Alert tone="positive">
        {result === "already"
          ? "Tu dirección ya estaba verificada. Puedes continuar con normalidad."
          : "Tu dirección de correo ha sido verificada correctamente."}
      </Alert>
      <ButtonLink href="/dashboard" full size="lg" className="mt-8">
        Entrar en mi cuenta
      </ButtonLink>
      <Link href="/pricing" className="mt-4 block text-center text-sm text-ink-muted hover:text-ink">
        Ver suscripciones
      </Link>
    </div>
  );
}
