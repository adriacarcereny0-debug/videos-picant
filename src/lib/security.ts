import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Hash irreversible para tokens opacos guardados en base de datos. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Comparación en tiempo constante. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function requestContext(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : h.get("x-real-ip")) ?? "unknown";
  return { ip: ip.trim(), userAgent: h.get("user-agent") ?? "unknown" };
}

type SecurityEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_BLOCKED"
  | "LOGOUT"
  | "REGISTER"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "EMAIL_VERIFIED"
  | "ADMIN_ACCESS_DENIED"
  | "ADMIN_ACTION"
  | "VIDEO_ACCESS_DENIED"
  | "VIDEO_ACCESS_GRANTED"
  | "WEBHOOK_INVALID_SIGNATURE"
  | "RATE_LIMITED";

export async function logSecurityEvent(
  event: SecurityEvent,
  data: { userId?: string | null; email?: string | null; meta?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const { ip, userAgent } = await requestContext();
    await prisma.securityLog.create({
      data: {
        event,
        userId: data.userId ?? null,
        email: data.email ?? null,
        ip,
        userAgent,
        meta: (data.meta ?? {}) as object,
      },
    });
  } catch {
    // El registro de auditoría nunca debe romper el flujo principal.
  }
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Limitador en memoria: suficiente para una instancia.
 * En producción multi-instancia, sustituir por Redis (ver README).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Limpieza perezosa para que el mapa no crezca sin control. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  },
  5 * 60 * 1000,
).unref?.();
