import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy de borde (antes `middleware`). Hace DOS cosas y nada más:
 *  1. Verificación de edad: sin la confirmación no se muestra la plataforma.
 *  2. Redirección temprana de rutas privadas cuando no hay cookie de sesión.
 *
 * La autorización real (rol, plan, estado de la suscripción) se comprueba
 * SIEMPRE en el servidor con acceso a base de datos. Esto es solo una capa
 * de conveniencia, nunca la fuente de verdad.
 */

const AGE_COOKIE = "madrastras_age_ok";
const SESSION_COOKIE = "madrastras_session";

/** Rutas accesibles sin confirmar la edad. */
const AGE_EXEMPT = [
  "/age-verification",
  "/terms",
  "/privacy",
  "/cookies",
  "/refunds",
  "/contact",
  "/api",
];

/** Rutas que exigen sesión. */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/subscription",
  "/notifications",
  "/profile",
  "/admin",
];

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const ageConfirmed = request.cookies.get(AGE_COOKIE)?.value === "1";
  const isExempt = AGE_EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!ageConfirmed && !isExempt) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-verification";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPrivate && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico)$).*)"],
};
