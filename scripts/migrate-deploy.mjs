/**
 * Aplica las migraciones en el despliegue solo si hay base de datos.
 *
 * Sin DATABASE_URL la compilación continúa: es preferible publicar el sitio
 * con un aviso de configuración que romper el build entero.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[deploy] DATABASE_URL no está definida: se omiten las migraciones.\n" +
      "         Configúrala en las variables de entorno para que la aplicación funcione.",
  );
  process.exit(0);
}

try {
  execSync("prisma migrate deploy", { stdio: "inherit" });
} catch (error) {
  console.error("[deploy] Fallo al aplicar las migraciones.", error);
  process.exit(1);
}
