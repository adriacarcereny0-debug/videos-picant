import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

/** Marca todas las notificaciones del usuario como leídas. */
export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
