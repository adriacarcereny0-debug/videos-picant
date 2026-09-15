import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { handleError, ok, tooManyRequests } from "@/lib/api";
import { hashToken, logSecurityEvent, randomToken, rateLimit, requestContext } from "@/lib/security";
import { mailer } from "@/lib/mail";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const limit = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.accountStatus === "ACTIVE") {
      const token = randomToken();
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          purpose: "PASSWORD_RESET",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await mailer.passwordReset(user.email, `${env.appUrl}/reset-password?token=${token}`);
      await logSecurityEvent("PASSWORD_RESET_REQUESTED", { userId: user.id, email });
    }

    // Respuesta idéntica exista o no la cuenta (evita enumeración de usuarios).
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
