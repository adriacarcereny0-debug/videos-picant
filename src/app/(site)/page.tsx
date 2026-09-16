import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { VideoCard } from "@/components/VideoCard";
import { PlanGrid } from "@/components/PlanGrid";
import { HeroCover } from "@/components/HeroCover";
import { Reveal } from "@/components/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { listFeaturedCovers, listPublishedVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Madrastras, contenido privado bajo suscripción",
  description:
    "Catálogo privado de vídeo para mayores de 18 años. Dos planes mensuales, reproducción protegida y acceso según tu suscripción.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

/**
 * Tres hechos, no tres tarjetas. La rejilla de iconos con titular y párrafo
 * repetida cuatro veces era el patrón más reconocible de plantilla.
 */
const CLAIMS = [
  {
    lead: "Almacenamiento privado",
    text: "Los vídeos viven fuera de la web y se sirven con enlaces que caducan en minutos. No existe una dirección pública permanente.",
  },
  {
    lead: "Permisos en el servidor",
    text: "Tu plan se comprueba antes de entregar la fuente del vídeo. El navegador no decide nada.",
  },
  {
    lead: "Sin permanencia",
    text: "Cancelas cuando quieras desde tu cuenta y conservas el acceso hasta el final del mes pagado.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const plan = user?.plan ?? "FREE";

  const [videos, covers] = await Promise.all([
    listPublishedVideos({ plan, sort: "curated", take: 6 }),
    listFeaturedCovers(5),
  ]);

  return (
    <>
      {/* ============================== PORTADA ============================ */}
      <section className="relative -mt-[var(--header-h)] flex min-h-[100dvh] flex-col justify-end overflow-hidden">
        {covers.length > 0 ? <HeroCover covers={covers} /> : <div className="lip-glow" />}

        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-16 pt-32 sm:px-8 sm:pb-24">
          <div className="rise">
            <Eyebrow>Solo mayores de 18</Eyebrow>
          </div>

          {/* Sin saltos forzados: el equilibrado evita la palabra huérfana al
              reflujo en móvil, donde el corte manual dejaba «dentro» sola. */}
          <h1
            className="display-xl rise mt-6 max-w-[13ch] text-balance text-ink"
            style={{ animationDelay: "80ms" }}
          >
            Lo que aquí dentro se queda <span className="text-lip">dentro</span>
          </h1>

          <div
            className="rise mt-9 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
            style={{ animationDelay: "170ms" }}
          >
            <p className="max-w-[46ch] text-[15px] leading-[1.75] text-ink-muted">
              Catálogo cerrado de vídeo por suscripción mensual. Eliges plan, entras con tu
              cuenta y reproduces desde un reproductor protegido. Nada más.
            </p>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink href="/pricing" size="lg">
                Ver suscripciones
              </ButtonLink>
              {!user && (
                <ButtonLink href="/register" variant="outline" size="lg">
                  Crear cuenta
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================= CATÁLOGO ============================ */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>El catálogo</Eyebrow>
              <h2 className="display-lg mt-5 text-ink">Una selección</h2>
            </div>
            <Link
              href="/videos"
              className="focus-ring shrink-0 border-b-2 border-lip pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:text-lip-soft"
            >
              Ver todo el catálogo
            </Link>
          </div>
        </Reveal>

        {videos.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => (
              <Reveal key={video.id} delay={index * 60}>
                <VideoCard video={video} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-12 block">
            <p className="max-w-[48ch] text-[15px] leading-[1.75] text-ink-muted">
              Todavía no hay vídeos publicados. Suscríbete y te avisamos con cada nueva
              publicación.
            </p>
          </Reveal>
        )}
      </section>

      {/* ========================== BANDA CARMÍN =========================== */}
      <section className="bg-lip text-noir">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-24">
          <Reveal>
            <p className="font-display max-w-[16ch] text-[clamp(2rem,5vw,3.6rem)] leading-[0.92] text-noir">
              Privado de verdad, no de eslogan
            </p>
          </Reveal>

          <dl className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {CLAIMS.map((claim, index) => (
              <Reveal key={claim.lead} delay={index * 70}>
                <div className="border-t-2 border-noir pt-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-noir">
                    {claim.lead}
                  </dt>
                  <dd className="mt-3 max-w-[38ch] text-[14px] leading-[1.7] text-noir/75">
                    {claim.text}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================== PLANES ============================= */}
      <section id="planes" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <div className="border-b border-line pb-8">
            <Eyebrow>Suscripciones</Eyebrow>
            <h2 className="display-lg mt-5 max-w-[12ch] text-ink">Dos planes, sin letra pequeña</h2>
          </div>
        </Reveal>
        <Reveal delay={100} className="mt-12 block">
          <PlanGrid currentPlan={plan} authenticated={Boolean(user)} />
        </Reveal>
      </section>

      {/* =============================== CIERRE ============================ */}
      <section className="mx-auto max-w-[1180px] px-5 pb-8 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-start gap-8 border-t border-line pt-16 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="display-md max-w-[16ch] text-ink">
              Crea tu cuenta y entra al catálogo
            </h2>
            <ButtonLink href={user ? "/pricing" : "/register"} size="lg" className="shrink-0">
              {user ? "Elegir mi plan" : "Crear cuenta"}
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
