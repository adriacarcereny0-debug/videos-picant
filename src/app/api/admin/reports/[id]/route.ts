import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]),
  adminNote: z.string().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const { id } = await params;
    const payload = schema.parse(await request.json());

    await prisma.report.update({
      where: { id },
      data: {
        status: payload.status,
        adminNote: payload.adminNote,
        resolvedAt: payload.status === "RESOLVED" ? new Date() : null,
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
