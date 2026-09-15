import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    const { id } = await params;
    // El filtro por userId impide marcar notificaciones ajenas.
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return ok({ success: true, updated: result.count });
  } catch (error) {
    return handleError(error);
  }
}
