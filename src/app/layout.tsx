import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "700", "800"],
});

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

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
    <html lang="es" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
