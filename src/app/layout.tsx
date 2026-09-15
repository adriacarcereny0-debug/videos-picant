import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

/** Grotesk de interfaz: neutra, moderna, excelente en tamaños pequeños. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/** Serif editorial de alto contraste para los titulares. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

// Resuelta en un solo sitio: APP_URL, dominio de Vercel o localhost.
const appUrl = env.appUrl;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Noctra — Contenido privado bajo suscripción",
    template: "%s · Noctra",
  },
  description:
    "Catálogo privado de vídeo para mayores de 18 años. Suscripción mensual, reproducción protegida y acceso exclusivo según tu plan.",
  applicationName: "Noctra",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: appUrl,
    siteName: "Noctra",
    title: "Noctra — Contenido privado bajo suscripción",
    description:
      "Catálogo privado de vídeo para mayores de 18 años. Suscripción mensual y acceso exclusivo según tu plan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noctra — Contenido privado bajo suscripción",
    description: "Catálogo privado de vídeo bajo suscripción mensual.",
  },
  other: { rating: "adult", "RTA-5042-1996-1400-1577-RTA": "RTA-5042-1996-1400-1577-RTA" },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${instrument.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
