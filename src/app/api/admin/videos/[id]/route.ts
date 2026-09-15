import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { videoSchema } from "@/lib/validation";
import { fail, handleError, ok } from "@/lib/api";
import { buildStorageKey, deleteObject, putObject } from "@/lib/storage";
import { notifyNewVideo } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 300;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Miniatura ya subida directamente al almacenamiento, opcional en la edición. */
const patchKeysSchema = z.object({
  thumbnailKey: z.string().startsWith("thumbnails/").optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const { id } = await params;
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) return fail("Vídeo no encontrado.", 404);

    const isJson = request.headers.get("content-type")?.includes("application/json");
    const form = isJson ? null : await request.formData();
    const payload = isJson ? await request.json() : null;

    const parsed = videoSchema.parse(
      isJson
        ? payload
        : {
            title: form!.get("title"),
            description: form!.get("description") ?? "",
            category: form!.get("category") || "General",
            subscriptionLevel: form!.get("subscriptionLevel"),
            status: form!.get("status"),
            durationSeconds: form!.get("durationSeconds") ?? 0,
            publishedAt: form!.get("publishedAt") ?? "",
            sortOrder: form!.get("sortOrder") ?? 0,
            featured: form!.get("featured") === "true",
          },
    );

    let thumbnailKey = existing.thumbnailKey;

    if (isJson) {
      const { thumbnailKey: uploaded } = patchKeysSchema.parse(payload);
      if (uploaded && uploaded !== existing.thumbnailKey) {
        thumbnailKey = uploaded;
        await deleteObject(existing.thumbnailKey);
      }
    } else {
      const thumbnailFile = form!.get("thumbnail");
      if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
        if (!IMAGE_TYPES.includes(thumbnailFile.type)) {
          return fail("Formato de miniatura no admitido.", 415);
        }
        thumbnailKey = buildStorageKey("thumbnail", existing.id, thumbnailFile.name);
        await putObject(
          thumbnailKey,
          Buffer.from(await thumbnailFile.arrayBuffer()),
          thumbnailFile.type,
        );
        await deleteObject(existing.thumbnailKey);
      }
    }

    const goesLive = existing.status !== "PUBLISHED" && parsed.status === "PUBLISHED";
    const publishedAt = parsed.publishedAt
      ? new Date(parsed.publishedAt)
      : goesLive
        ? new Date()
        : existing.publishedAt;

    const updated = await prisma.video.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        subscriptionLevel: parsed.subscriptionLevel,
        status: parsed.status,
        durationSeconds: parsed.durationSeconds,
        sortOrder: parsed.sortOrder,
        featured: parsed.featured ?? false,
        publishedAt,
        thumbnailKey,
      },
    });

    if (goesLive && updated.publishedAt && updated.publishedAt <= new Date()) {
      await notifyNewVideo({
        id: updated.id,
        title: updated.title,
        subscriptionLevel: updated.subscriptionLevel,
      });
    }

    await logSecurityEvent("ADMIN_ACTION", {
      userId: user.id,
      meta: { action: "video.update", videoId: id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: { renditions: true },
    });
    if (!video) return fail("Vídeo no encontrado.", 404);

    // Primero los objetos, después el registro.
    await deleteObject(video.videoStorageKey);
    await deleteObject(video.thumbnailKey);
    if (video.previewKey) await deleteObject(video.previewKey);
    for (const rendition of video.renditions) await deleteObject(rendition.storageKey);

    await prisma.video.delete({ where: { id } });

    await logSecurityEvent("ADMIN_ACTION", {
      userId: user.id,
      meta: { action: "video.delete", videoId: id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
