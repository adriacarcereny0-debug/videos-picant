import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** Solo páginas públicas: el catálogo y las zonas privadas no se indexan. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/faq", "/contact", "/terms", "/privacy", "/cookies", "/refunds"];

  return routes.map((route) => ({
    url: `${env.appUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
