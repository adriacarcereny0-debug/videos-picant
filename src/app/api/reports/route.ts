import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import { handleError, ok, tooManyRequests } from "@/lib/api";
import { rateLimit, requestContext } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const user = await getCurrentUser();

    const limit = rateLimit(`report:${user?.id ?? ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const payload = reportSchema.parse(await request.json());

    // Se ignoran identificadores de vídeo inexistentes en lugar de fallar.
    const videoExists = payload.videoId
      ? await prisma.video.findUnique({ where: { id: payload.videoId }, select: { id: true } })
      : null;

    await prisma.report.create({
      data: {
        userId: user?.id ?? null,
        videoId: videoExists?.id ?? null,
        reason: payload.reason,
        description: payload.description || "",
        contactEmail: payload.contactEmail || user?.email || null,
      },
    });

    return ok({ success: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
