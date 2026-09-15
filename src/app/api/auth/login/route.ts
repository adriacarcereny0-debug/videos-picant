import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { logSecurityEvent, rateLimit, requestContext } from "@/lib/security";

export const runtime = "nodejs";

/** Mensaje único para credenciales incorrectas: no filtra si el correo existe. */
const GENERIC = "Correo electrónico o contraseña incorrectos.";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const payload = loginSchema.parse(await request.json());

    // Doble límite: por IP y por cuenta.
    const byIp = rateLimit(`login:ip:${ip}`, 12, 15 * 60 * 1000);
    const byEmail = rateLimit(`login:email:${payload.email}`, 6, 15 * 60 * 1000);
    if (!byIp.allowed || !byEmail.allowed) {
      await logSecurityEvent("LOGIN_BLOCKED", { email: payload.email });
      return tooManyRequests(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds));
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      await prisma.loginAttempt.create({
        data: { email: payload.email, ip, success: false, userId: user?.id ?? null },
      });
      await logSecurityEvent("LOGIN_FAILED", { email: payload.email, userId: user?.id });
      return fail(GENERIC, 401);
    }

    if (user.accountStatus === "SUSPENDED") {
      await logSecurityEvent("LOGIN_BLOCKED", { userId: user.id, email: user.email });
      return fail(
        "Tu cuenta está suspendida. Contacta con nosotros si crees que se trata de un error.",
        403,
      );
    }

    await prisma.$transaction([
      prisma.loginAttempt.create({
        data: { email: payload.email, ip, success: true, userId: user.id },
      }),
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    ]);

    await createSession(user.id, payload.remember ?? false);
    await logSecurityEvent("LOGIN_SUCCESS", { userId: user.id, email: user.email });

    return ok({
      success: true,
      redirectTo: user.role === "ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    return handleError(error);
  }
}
