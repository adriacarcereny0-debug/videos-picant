import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { createReadStream } from "node:fs";
import { readLocalObject, verifyLocalAccessToken } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Entrega de objetos privados en el driver `local` (demo).
 *
 * El token es un JWT firmado con caducidad corta emitido solo después de
 * comprobar los permisos del usuario. Sin token válido no hay acceso, y la
 * ruta real del fichero nunca se expone.
 *
 * En producción con driver `s3` esta ruta no se utiliza: las URLs las firma
 * directamente el proveedor de almacenamiento.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const payload = await verifyLocalAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Enlace caducado o no válido." }, { status: 403 });
  }

  const object = await readLocalObject(payload.key);
  if (!object) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const contentType = guessContentType(payload.key);
  const range = request.headers.get("range");

  const commonHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
  };

  // Petición parcial: necesaria para buscar posiciones en el reproductor.
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : Math.min(start + 1024 * 1024 * 4, object.size - 1);

    if (Number.isNaN(start) || start >= object.size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${object.size}` },
      });
    }

    const safeEnd = Math.min(end, object.size - 1);
    const stream = createReadStream(object.filePath, { start, end: safeEnd });

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${safeEnd}/${object.size}`,
        "Content-Length": String(safeEnd - start + 1),
      },
    });
  }

  const stream = fs.createReadStream(object.filePath);
  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: { ...commonHeaders, "Content-Length": String(object.size) },
  });
}

function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/jpeg";
  }
}
