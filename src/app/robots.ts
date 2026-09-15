import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/faq", "/terms", "/privacy", "/cookies", "/refunds", "/contact"],
        // Zonas privadas y contenido protegido: fuera de los buscadores.
        disallow: [
          "/videos",
          "/dashboard",
          "/subscription",
          "/notifications",
          "/profile",
          "/admin",
          "/api",
          "/login",
          "/register",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
