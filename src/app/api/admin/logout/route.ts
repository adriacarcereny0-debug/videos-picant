import { NextResponse } from "next/server";
import { closeAdminGate } from "@/lib/adminGate";
import { destroySession } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Salir del panel.
 *
 * Cierra las dos puertas: la sesión abierta con contraseña y, si la hubiera,
 * la sesión de cuenta. Salir debe significar lo mismo se haya entrado como se
 * haya entrado.
 */
export async function POST() {
  await closeAdminGate();
  await destroySession();
  await logSecurityEvent("LOGOUT", { meta: { route: "admin-gate" } });
  return NextResponse.redirect(new URL("/admin/login", env.appUrl), { status: 303 });
}
