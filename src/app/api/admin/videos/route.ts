import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { videoSchema } from "@/lib/validation";
import { fail, handleError, ok } from "@/lib/api";
import { activeDriver, buildStorageKey, putObject } from "@/lib/storage";
import { notifyNewVideo } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Claves ya subidas directamente al almacenamiento desde el navegador. */
const keysSchema = z.object({
  videoKey: z.string().min(3).startsWith("videos/"),
  thumbnailKey: z.string().min(3).startsWith("thumbnails/"),
});

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "video";
  let slug = base;
  for (let i = 2; await prisma.video.findUnique({ where: { slug } }); i += 1) {
    slug = `${base}-${i}`;
  }
  return slug;
}

/**
 * Alta de vídeo.
 *
 * Dos vías según el almacenamiento:
 *  - JSON      : el fichero ya está en el almacenamiento privado (subida
 *                directa desde el navegador). Es la vía en producción.
 *  - multipart : el fichero llega en la petición. Solo para el driver local
 *                de desarrollo; en Vercel superaría el límite de 4,5 MB.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const isJson = request.headers.get("content-type")?.includes("application/json");
    const form = isJson ? null : await request.formData();
    const payload = isJson ? await request.json() : null;

    const raw = isJson
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
        };

    const parsed = videoSchema.parse(raw);

    let videoKey: string;
    let thumbnailKey: string;

    if (isJson) {
      const keys = keysSchema.parse(payload);
      videoKey = keys.videoKey;
      thumbnailKey = keys.thumbnailKey;
    } else {
      const videoFile = form!.get("video");
      const thumbnailFile = form!.get("thumbnail");

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

      const reference = crypto.randomUUID();
      videoKey = buildStorageKey("video", reference, videoFile.name);
      thumbnailKey = buildStorageKey("thumbnail", reference, thumbnailFile.name);

      await putObject(videoKey, Buffer.from(await videoFile.arrayBuffer()), videoFile.type);
      await putObject(
        thumbnailKey,
        Buffer.from(await thumbnailFile.arrayBuffer()),
        thumbnailFile.type,
      );
    }

    const shouldPublish = parsed.status === "PUBLISHED";
    const publishedAt = parsed.publishedAt
      ? new Date(parsed.publishedAt)
      : shouldPublish
        ? new Date()
        : null;

    const video = await prisma.video.create({
      data: {
        slug: await uniqueSlug(parsed.title),
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
        videoStorageKey: videoKey,
      },
    });

    // Aviso solo a quien puede verlo, y solo si se publica ya.
    if (shouldPublish && publishedAt && publishedAt <= new Date()) {
      await notifyNewVideo({
        id: video.id,
        title: video.title,
        subscriptionLevel: video.subscriptionLevel,
      });
    }

    await logSecurityEvent("ADMIN_ACTION", {
      userId: user.id,
      meta: { action: "video.create", videoId: video.id, driver: activeDriver() },
    });

    return ok({ success: true, id: video.id }, 201);
  } catch (error) {
    return handleError(error);
  }
}
