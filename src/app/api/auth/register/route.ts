import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { hashToken, logSecurityEvent, randomToken, rateLimit, requestContext } from "@/lib/security";
import { mailer } from "@/lib/mail";
import { notify } from "@/lib/notifications";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      await logSecurityEvent("RATE_LIMITED", { meta: { route: "register" } });
      return tooManyRequests(limit.retryAfterSeconds);
    }

    const payload = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      // Mensaje genérico: no confirmamos qué correos están registrados.
      return fail("No se ha podido completar el registro con esos datos.", 409);
    }

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        displayName: payload.displayName || null,
        passwordHash: await hashPassword(payload.password),
        ageVerified: true,
        subscription: { create: { plan: "FREE", status: "INCOMPLETE" } },
      },
    });

    // Token de verificación de correo (24 h).
    const token = randomToken();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        purpose: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await mailer.verification(user.email, `${env.appUrl}/verify-email?token=${token}`);
    await notify(
      user.id,
      "WELCOME",
      "Bienvenido a Noctra",
      "Tu cuenta ya está creada. Elige una suscripción para acceder al catálogo privado.",
      "/pricing",
    );
    await logSecurityEvent("REGISTER", { userId: user.id, email: user.email });

    await createSession(user.id, true);

    return ok({ success: true, redirectTo: "/dashboard" }, 201);
  } catch (error) {
    return handleError(error);
  }
}
