import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  order: z.array(z.object({ id: z.string(), sortOrder: z.number().int().min(0).max(9999) })).max(500),
});

/** Reordena el catálogo en una sola transacción. */
export async function PATCH(request: NextRequest) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const { order } = schema.parse(await request.json());

    await prisma.$transaction(
      order.map((item) =>
        prisma.video.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
