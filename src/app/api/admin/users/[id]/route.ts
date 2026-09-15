import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { fail, handleError, ok } from "@/lib/api";
import { revokeAllSessions } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({ action: z.enum(["suspend", "reactivate"]) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const { id } = await params;
    if (id === user.id) return fail("No puedes suspender tu propia cuenta.", 400);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail("Usuario no encontrado.", 404);
    if (target.role === "ADMIN") {
      return fail("No es posible suspender a otro administrador desde el panel.", 403);
    }

    const { action } = schema.parse(await request.json());

    await prisma.user.update({
      where: { id },
      data: { accountStatus: action === "suspend" ? "SUSPENDED" : "ACTIVE" },
    });

    // Suspender cierra todas las sesiones abiertas de esa cuenta.
    if (action === "suspend") await revokeAllSessions(id);

    await logSecurityEvent("ADMIN_ACTION", {
      userId: user.id,
      meta: { action: `user.${action}`, targetId: id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
