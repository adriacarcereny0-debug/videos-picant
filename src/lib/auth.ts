import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Plan, Role, User, Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { hashToken, randomToken, requestContext } from "@/lib/security";

export const SESSION_COOKIE = "madrastras_session";
export const AGE_COOKIE = "madrastras_age_ok";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  plan: Plan;
  emailVerified: boolean;
  accountStatus: User["accountStatus"];
  subscription: Subscription | null;
}

/** Crea una sesión persistente y escribe la cookie HttpOnly. */
export async function createSession(userId: string, remember: boolean): Promise<void> {
  const token = randomToken(48);
  const ttlDays = remember ? env.sessionRememberTtlDays : env.sessionTtlDays;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const { ip, userAgent } = await requestContext();

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt, ip, userAgent },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .updateMany({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Usuario de la petición actual. Memorizado por render para no repetir consultas.
 * Devuelve null si no hay sesión válida o la cuenta está suspendida.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { subscription: true } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.accountStatus === "SUSPENDED") return null;

  const sub = session.user.subscription;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
    plan: effectivePlan(sub),
    emailVerified: session.user.emailVerified,
    accountStatus: session.user.accountStatus,
    subscription: sub ?? null,
  };
});

/**
 * El plan efectivo se deriva SIEMPRE del estado de la suscripción en base de
 * datos, nunca de lo que envíe el frontend.
 */
export function effectivePlan(subscription: Subscription | null | undefined): Plan {
  if (!subscription) return "FREE";
  const active = subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  if (!active) return "FREE";
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) return "FREE";
  return subscription.plan === "FREE" ? "FREE" : subscription.plan;
}

export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Acceso al panel. Vale cualquiera de las dos puertas:
 * el rol ADMIN de una cuenta, o la contraseña única del panel.
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") return user;

  const { adminGateOpen } = await import("@/lib/adminGate");
  if (await adminGateOpen()) return user;

  if (user) redirect("/dashboard?error=forbidden");
  redirect("/admin/login");
}

export async function hasConfirmedAge(): Promise<boolean> {
  const store = await cookies();
  return store.get(AGE_COOKIE)?.value === "1";
}
