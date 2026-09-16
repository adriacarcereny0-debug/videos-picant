import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handleError, ok, tooManyRequests } from "@/lib/api";
import { openAdminGate, passwordMatches } from "@/lib/adminGate";
import { logSecurityEvent, rateLimit, requestContext } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1, "Introduce la contraseña.") });

/**
 * Entrada al panel con contraseña única.
 *
 * Una clave corta y compartida es fácil de probar por fuerza bruta, así que
 * el límite por IP es deliberadamente estrecho y cada intento queda
 * registrado en el histórico de seguridad.
 */
export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();

    const limit = rateLimit(`admin-gate:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      await logSecurityEvent("LOGIN_BLOCKED", { meta: { route: "admin-gate" } });
      return tooManyRequests(limit.retryAfterSeconds);
    }

    const { password } = schema.parse(await request.json());

    if (!passwordMatches(password)) {
      await logSecurityEvent("ADMIN_ACCESS_DENIED", { meta: { route: "admin-gate" } });
      return fail("Contraseña incorrecta.", 401);
    }

    await openAdminGate();
    await logSecurityEvent("ADMIN_ACTION", { meta: { action: "admin-gate.open" } });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
