import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, revokeAllSessions } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { hashToken, logSecurityEvent, rateLimit, requestContext } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const limit = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const { token, password } = resetPasswordSchema.parse(await request.json());

    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (
      !record ||
      record.purpose !== "PASSWORD_RESET" ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      return fail("El enlace no es válido o ha caducado.", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Un cambio de contraseña invalida cualquier sesión abierta.
    await revokeAllSessions(record.userId);
    await logSecurityEvent("PASSWORD_RESET_COMPLETED", {
      userId: record.userId,
      email: record.user.email,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
