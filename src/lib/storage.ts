import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";
import { env, requireSessionSecret } from "@/lib/env";

/**
 * Almacenamiento de objetos PRIVADO.
 *
 * Tres drivers intercambiables, todos con el mismo contrato: el objeto nunca
 * es público y el acceso se entrega como URL firmada de caducidad corta.
 *
 * - `blob`  : Vercel Blob con `access: "private"` + URL prefirmada (producción
 *             en Vercel). El navegador descarga directamente del CDN.
 * - `s3`    : bucket privado S3/R2/B2 con URL prefirmada.
 * - `local` : solo desarrollo. Ficheros fuera de /public, servidos por
 *             /api/stream/[token] con un JWT firmado y caducado.
 *
 * En los tres casos la ruta real del objeto nunca se expone al cliente.
 */

const LOCAL_ROOT = path.join(process.cwd(), "storage");
const encodedSecret = () => new TextEncoder().encode(requireSessionSecret());

export type StorageKind = "video" | "thumbnail" | "preview";

export interface SignedAsset {
  url: string;
  expiresAt: Date;
}

/* ------------------------------ Vercel Blob ------------------------------ */

async function presignBlob(key: string, ttlSeconds: number): Promise<string> {
  const { issueSignedToken, presignUrl } = await import("@vercel/blob");
  const validUntil = Date.now() + ttlSeconds * 1000;

  const token = await issueSignedToken({
    pathname: key,
    operations: ["get"],
    validUntil,
    ...(env.blobToken ? { token: env.blobToken } : {}),
  });

  const { presignedUrl } = await presignUrl(token, {
    operation: "get",
    pathname: key,
    validUntil,
    access: "private",
  });

  return presignedUrl;
}

/* ---------------------------------- S3 ---------------------------------- */

async function s3Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: env.s3Region,
    endpoint: env.s3Endpoint || undefined,
    forcePathStyle: Boolean(env.s3Endpoint),
    credentials: {
      accessKeyId: env.s3AccessKeyId,
      secretAccessKey: env.s3SecretAccessKey,
    },
  });
}

async function presignS3(key: string, ttlSeconds: number): Promise<string> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = await s3Client();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }), {
    expiresIn: ttlSeconds,
  });
}

/* --------------------------- Tokens del driver local --------------------- */

export async function signLocalAccessToken(
  key: string,
  ttlSeconds: number,
  subject: string,
): Promise<string> {
  return new SignJWT({ key })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(encodedSecret());
}

export async function verifyLocalAccessToken(
  token: string,
): Promise<{ key: string; sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret());
    if (typeof payload.key !== "string") return null;
    return { key: payload.key, sub: String(payload.sub ?? "anonymous") };
  } catch {
    return null;
  }
}

/* ------------------------------ API pública ------------------------------ */

/** Driver efectivo, resuelto a partir de la configuración disponible. */
export function activeDriver(): "blob" | "s3" | "local" {
  if (env.storageDriver === "blob") return "blob";
  if (env.storageDriver === "s3" && env.s3Bucket) return "s3";
  return "local";
}

/**
 * Genera un acceso temporal a un objeto privado.
 * Quien llama DEBE haber comprobado antes los permisos del usuario.
 */
export async function createSignedAsset(
  key: string,
  options: { ttlSeconds?: number; subject?: string } = {},
): Promise<SignedAsset> {
  const ttl = options.ttlSeconds ?? env.signedUrlTtlSeconds;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  if (!key) return { url: "", expiresAt };

  switch (activeDriver()) {
    case "blob":
      return { url: await presignBlob(key, ttl), expiresAt };
    case "s3":
      return { url: await presignS3(key, ttl), expiresAt };
    default: {
      const token = await signLocalAccessToken(key, ttl, options.subject ?? "anonymous");
      return { url: `/api/stream/${token}`, expiresAt };
    }
  }
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  switch (activeDriver()) {
    case "blob": {
      const { put } = await import("@vercel/blob");
      await put(key, body, {
        access: "private",
        contentType,
        addRandomSuffix: false,
        ...(env.blobToken ? { token: env.blobToken } : {}),
      });
      return;
    }
    case "s3": {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await s3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // El objeto nunca es público: sin ACL public-read.
        }),
      );
      return;
    }
    default: {
      const target = path.join(LOCAL_ROOT, key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body);
    }
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!key) return;

  switch (activeDriver()) {
    case "blob": {
      const { del } = await import("@vercel/blob");
      await del(key, env.blobToken ? { token: env.blobToken } : undefined).catch(() => undefined);
      return;
    }
    case "s3": {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await s3Client();
      await client
        .send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }))
        .catch(() => undefined);
      return;
    }
    default:
      await fs.rm(path.join(LOCAL_ROOT, key), { force: true }).catch(() => undefined);
  }
}

/** Lectura local con soporte de rangos para el reproductor. */
export async function readLocalObject(
  key: string,
): Promise<{ size: number; filePath: string } | null> {
  const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
  const filePath = path.join(LOCAL_ROOT, safeKey);
  if (!filePath.startsWith(LOCAL_ROOT)) return null;
  try {
    const stat = await fs.stat(filePath);
    return { size: stat.size, filePath };
  } catch {
    return null;
  }
}

export function buildStorageKey(kind: StorageKind, videoId: string, filename: string): string {
  const ext = path.extname(filename).toLowerCase() || (kind === "video" ? ".mp4" : ".jpg");
  const folder = kind === "video" ? "videos" : kind === "preview" ? "previews" : "thumbnails";
  return `${folder}/${videoId}/${kind}-${Date.now()}${ext}`;
}
