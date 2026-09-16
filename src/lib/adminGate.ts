import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env, requireSessionSecret } from "@/lib/env";

/**
 * Acceso al panel con contraseña única, sin correo.
 *
 * No sustituye a las cuentas: un usuario con rol ADMIN sigue entrando por su
 * sesión normal. Esto es una segunda puerta, pensada para que el
 * administrador entre rápido desde cualquier dispositivo.
 *
 * La sesión que abre es independiente de la de usuario, dura 12 horas y viaja
 * en una cookie HttpOnly firmada. La contraseña nunca se guarda en la cookie.
 */

export const ADMIN_GATE_COOKIE = "madrastras_admin";

const TTL_HOURS = 12;

const secret = () => new TextEncoder().encode(requireSessionSecret());

/** Comparación en tiempo constante: no filtra la longitud del acierto. */
export function passwordMatches(candidate: string): boolean {
  const expected = env.adminPassword;
  if (!expected) return false;

  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function openAdminGate(): Promise<void> {
  const token = await new SignJWT({ gate: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_HOURS}h`)
    .sign(secret());

  const store = await cookies();
  store.set(ADMIN_GATE_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_HOURS * 60 * 60,
  });
}

export async function closeAdminGate(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_GATE_COOKIE);
}

/** ¿Hay una sesión de panel abierta y vigente? */
export async function adminGateOpen(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_GATE_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.gate === "admin";
  } catch {
    return false;
  }
}
