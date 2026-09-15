import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { videoSchema } from "@/lib/validation";
import { fail, handleError, ok } from "@/lib/api";
import { buildStorageKey, putObject } from "@/lib/storage";
import { notifyNewVideo } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Alta de vídeo con subida al almacenamiento privado. */
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const form = await request.formData();

    const parsed = videoSchema.parse({
      title: form.get("title"),
      description: form.get("description") ?? "",
      category: form.get("category") || "General",
      subscriptionLevel: form.get("subscriptionLevel"),
      status: form.get("status"),
      durationSeconds: form.get("durationSeconds") ?? 0,
      publishedAt: form.get("publishedAt") ?? "",
      sortOrder: form.get("sortOrder") ?? 0,
    });

    const videoFile = form.get("video");
    const thumbnailFile = form.get("thumbnail");

    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return fail("Selecciona el archivo de vídeo.", 400);
    }
    if (!(thumbnailFile instanceof File) || thumbnailFile.size === 0) {
      return fail("Selecciona una miniatura.", 400);
    }
    if (!VIDEO_TYPES.includes(videoFile.type)) {
      return fail("Formato de vídeo no admitido. Usa MP4, WebM o MOV.", 415);
    }
    if (!IMAGE_TYPES.includes(thumbnailFile.type)) {
      return fail("Formato de miniatura no admitido. Usa JPG, PNG, WebP o AVIF.", 415);
    }
    if (videoFile.size > MAX_VIDEO_BYTES) return fail("El vídeo supera los 2 GB.", 413);
    if (thumbnailFile.size > MAX_IMAGE_BYTES) return fail("La miniatura supera los 8 MB.", 413);

    // Slug único.
    const base = slugify(parsed.title) || "video";
    let slug = base;
    for (let i = 2; await prisma.video.findUnique({ where: { slug } }); i += 1) {
      slug = `${base}-${i}`;
    }

    const shouldPublish = parsed.status === "PUBLISHED";
    const publishedAt = parsed.publishedAt
      ? new Date(parsed.publishedAt)
      : shouldPublish
        ? new Date()
        : null;

    const video = await prisma.video.create({
      data: {
        slug,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        subscriptionLevel: parsed.subscriptionLevel,
        status: parsed.status,
        durationSeconds: parsed.durationSeconds,
        sortOrder: parsed.sortOrder,
        publishedAt,
        // Claves provisionales: se sustituyen tras subir los ficheros.
        thumbnailKey: "",
        videoStorageKey: "",
      },
    });

    const videoKey = buildStorageKey("video", video.id, videoFile.name);
    const thumbKey = buildStorageKey("thumbnail", video.id, thumbnailFile.name);

    await putObject(videoKey, Buffer.from(await videoFile.arrayBuffer()), videoFile.type);
    await putObject(thumbKey, Buffer.from(await thumbnailFile.arrayBuffer()), thumbnailFile.type);

    const saved = await prisma.video.update({
      where: { id: video.id },
      data: { videoStorageKey: videoKey, thumbnailKey: thumbKey },
    });

    // Aviso solo a quien puede verlo, y solo si se publica ya.
    if (shouldPublish && publishedAt && publishedAt <= new Date()) {
      await notifyNewVideo({
        id: saved.id,
        title: saved.title,
        subscriptionLevel: saved.subscriptionLevel,
      });
    }

    await logSecurityEvent("ADMIN_ACTION", {
      userId: user.id,
      meta: { action: "video.create", videoId: saved.id },
    });

    return ok({ success: true, id: saved.id }, 201);
  } catch (error) {
    return handleError(error);
  }
}
