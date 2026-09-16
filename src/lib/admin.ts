import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { adminGateOpen } from "@/lib/adminGate";
import { fail } from "@/lib/api";
import { logSecurityEvent } from "@/lib/security";

/** Identidad que registran las acciones del panel. */
export interface AdminActor {
  id: string;
  email: string;
}

/**
 * Guardia para las rutas de API del panel.
 *
 * Acepta las dos puertas: una cuenta con rol ADMIN, o la contraseña única.
 * Devuelve el actor, o una respuesta 401/403 lista para retornar.
 */
export async function guardAdmin(): Promise<
  { user: AdminActor; response: null } | { user: null; response: Response }
> {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    return { user: { id: user.id, email: user.email }, response: null };
  }

  if (await adminGateOpen()) {
    // Sin cuenta detrás: las acciones quedan registradas como acceso por clave.
    return {
      user: { id: user?.id ?? "admin-gate", email: user?.email ?? "acceso por contraseña" },
      response: null,
    };
  }

  if (!user) return { user: null, response: fail("No autorizado.", 401) };

  await logSecurityEvent("ADMIN_ACCESS_DENIED", { userId: user.id, email: user.email });
  return { user: null, response: fail("Acceso restringido.", 403) };
}
