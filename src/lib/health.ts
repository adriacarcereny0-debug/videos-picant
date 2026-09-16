import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { env, isSessionSecretConfigured } from "@/lib/env";

/**
 * Comprobación de arranque: ¿tiene la aplicación lo mínimo para funcionar?
 * Memorizada por render para no repetir la consulta en cada componente.
 */
export const checkSetup = cache(
  async (): Promise<{ ready: boolean; missing: string[] }> => {
    const missing: string[] = [];

    if (!env.databaseUrl) missing.push("DATABASE_URL (cadena de conexión de PostgreSQL)");
    if (!isSessionSecretConfigured()) {
      missing.push("SESSION_SECRET (32 caracteres aleatorios como mínimo)");
    }

    if (missing.length > 0) return { ready: false, missing };

    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ready: true, missing: [] };
    } catch {
      return {
        ready: false,
        missing: [
          "DATABASE_URL está definida, pero la base de datos no responde o el esquema no se ha aplicado",
        ],
      };
    }
  },
);
