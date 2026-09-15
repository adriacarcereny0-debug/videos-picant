import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { guardAdmin } from "@/lib/admin";
import { env } from "@/lib/env";
import { logSecurityEvent } from "@/lib/security";

export const runtime = "nodejs";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Emite tokens de subida directa a Vercel Blob.
 *
 * El fichero viaja del navegador al almacenamiento sin pasar por la función,
 * lo que evita el límite de 4,5 MB del cuerpo de petición en Vercel. El token
 * solo se emite a administradores autenticados y queda acotado a una ruta, un
 * tipo de contenido y un tamaño máximo concretos.
 *
 * Los objetos se crean con `access: "private"`: nunca existe una URL pública
 * permanente. La lectura sigue exigiendo una URL prefirmada de caducidad corta,
 * emitida solo tras comprobar el plan del usuario.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      token: env.blobToken || undefined,

      onBeforeGenerateToken: async (pathname) => {
        // Cada emisión de token vuelve a comprobar el rol en el servidor.
        const { user, response } = await guardAdmin();
        if (!user) throw new Error(response ? "Acceso restringido." : "No autorizado.");

        const isVideo = pathname.startsWith("videos/");
        const isThumbnail = pathname.startsWith("thumbnails/");
        if (!isVideo && !isThumbnail) {
          throw new Error("Ruta de subida no permitida.");
        }

        await logSecurityEvent("ADMIN_ACTION", {
          userId: user.id,
          meta: { action: "blob.upload-token", pathname },
        });

        return {
          access: "private" as const,
          addRandomSuffix: false,
          allowedContentTypes: isVideo ? VIDEO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },

      onUploadCompleted: async ({ blob }) => {
        // La ficha del vídeo se crea después, desde /api/admin/videos.
        console.info("[blob] subida completada", blob.pathname);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se ha podido autorizar la subida." },
      { status: 400 },
    );
  }
}
