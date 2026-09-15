import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { authorizePlayback, recordView } from "@/lib/videos";
import { fail, handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({ watchedSeconds: z.coerce.number().int().min(0).max(86400) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    // Solo se contabiliza si el usuario realmente puede ver el vídeo.
    const grant = await authorizePlayback(id);
    if (!grant.allowed) return fail("Sin acceso a este contenido.", 403);

    const { watchedSeconds } = schema.parse(await request.json());
    await recordView(id, user.id, watchedSeconds);

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
