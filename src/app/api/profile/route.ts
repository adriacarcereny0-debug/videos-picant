import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, revokeAllSessions, verifyPassword, createSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { fail, handleError, ok } from "@/lib/api";
import { logSecurityEvent } from "@/lib/security";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    const payload = profileSchema.parse(await request.json());

    const data: { displayName?: string | null; passwordHash?: string } = {};

    if (payload.displayName !== undefined) {
      data.displayName = payload.displayName || null;
    }

    let passwordChanged = false;
    if (payload.newPassword) {
      if (!payload.currentPassword) {
        return fail("Introduce tu contraseña actual para cambiarla.", 400);
      }
      const record = await prisma.user.findUnique({ where: { id: user.id } });
      if (!record || !(await verifyPassword(payload.currentPassword, record.passwordHash))) {
        return fail("La contraseña actual no es correcta.", 403);
      }
      data.passwordHash = await hashPassword(payload.newPassword);
      passwordChanged = true;
    }

    await prisma.user.update({ where: { id: user.id }, data });

    if (passwordChanged) {
      // Se cierran todas las sesiones y se abre una nueva para este dispositivo.
      await revokeAllSessions(user.id);
      await createSession(user.id, true);
      await logSecurityEvent("PASSWORD_RESET_COMPLETED", { userId: user.id, email: user.email });
    }

    return ok({ success: true, passwordChanged });
  } catch (error) {
    return handleError(error);
  }
}
