import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { hashToken, randomToken, rateLimit } from "@/lib/security";
import { mailer } from "@/lib/mail";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);
    if (user.emailVerified) return ok({ success: true, alreadyVerified: true });

    const limit = rateLimit(`resend:${user.id}`, 3, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

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

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
