import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { fail } from "@/lib/api";
import { logSecurityEvent } from "@/lib/security";

/**
 * Guardia para rutas de API administrativas.
 * Devuelve el admin o una respuesta 401/403 lista para retornar.
 */
export async function guardAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: fail("No autorizado.", 401) };
  }
  if (user.role !== "ADMIN") {
    await logSecurityEvent("ADMIN_ACCESS_DENIED", { userId: user.id, email: user.email });
    return { user: null, response: fail("Acceso restringido.", 403) };
  }

  return { user, response: null };
}
