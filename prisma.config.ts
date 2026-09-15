import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Con un fichero de configuración, Prisma deja de cargar el .env por su
 * cuenta: lo cargamos aquí para que `db push`, `migrate` y el seed vean
 * DATABASE_URL en local. En producción las variables ya vienen del entorno.
 */
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // Sin .env (CI, Vercel): las variables ya están en el entorno.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx --env-file-if-exists=.env prisma/seed.ts",
  },
});
