import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { VideoCard } from "@/components/VideoCard";
import { PlanGrid } from "@/components/PlanGrid";
import { HeroShowcase } from "@/components/HeroShowcase";
import {
  IconArrowRight,
  IconDevices,
  IconFilm,
  IconLock,
  IconShield,
  IconSparkle,
} from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { listPublishedVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Noctra — Contenido privado bajo suscripción",
  description:
    "Un catálogo privado de vídeo para mayores de 18 años. Elige tu plan, accede desde cualquier dispositivo y disfruta de una reproducción protegida.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    icon: <IconLock />,
    title: "Privado por diseño",
    text: "Cada vídeo se almacena en un bucket privado y se reproduce mediante enlaces firmados que caducan. Nunca existe una URL pública permanente.",
  },
  {
    icon: <IconShield />,
    title: "Acceso verificado",
    text: "Los permisos se comprueban en el servidor antes de entregar cualquier fuente de vídeo. El navegador nunca decide qué puedes ver.",
  },
  {
    icon: <IconDevices />,
    title: "En cualquier pantalla",
    text: "Una experiencia de streaming continua en móvil, tablet y ordenador, con reproductor propio y controles completos.",
  },
  {
    icon: <IconSparkle />,
    title: "Catálogo cuidado",
    text: "Publicamos poco y bien. Cada pieza se selecciona, se clasifica por nivel y se incorpora al catálogo con su ficha completa.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const plan = user?.plan ?? "FREE";
  const videos = await listPublishedVideos({ plan, sort: "curated", take: 6 });

  return (
    <>
      {/* ---------------------------- HERO ---------------------------- */}
      <section className="grain relative overflow-hidden">
        <div className="aurum-glow" aria-hidden />

        <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:pb-28 lg:pt-32">
          <div className="max-w-3xl">
            <p className="eyebrow rise mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-aurum" aria-hidden />
              Acceso privado · Solo +18
            </p>

            <h1 className="display-xl rise text-ink" style={{ animationDelay: "60ms" }}>
              Contenido privado
              <br />
              que solo verá
              <span className="text-aurum"> quien tenga acceso</span>.
            </h1>

            <p
              className="rise mt-7 max-w-xl text-[17px] leading-relaxed text-ink-muted sm:text-[18px]"
              style={{ animationDelay: "140ms" }}
            >
              Un catálogo cerrado de vídeo bajo suscripción mensual. Elige tu plan, entra con tu
              cuenta y reproduce desde un reproductor protegido. Sin ruido, sin anuncios, sin
              nada que no sea el contenido.
            </p>

            <div
              className="rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "220ms" }}
            >
              <ButtonLink href="/pricing" size="lg" className="sm:w-auto">
                Ver suscripciones
                <IconArrowRight width={17} height={17} />
              </ButtonLink>
              {!user && (
                <ButtonLink href="/register" variant="secondary" size="lg">
                  Crear cuenta
                </ButtonLink>
              )}
            </div>

            <dl
              className="rise mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-8"
              style={{ animationDelay: "300ms" }}
            >
              {[
                { value: "2", label: "planes mensuales" },
                { value: "9,99 €", label: "desde, al mes" },
                { value: "0", label: "permanencia" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroShowcase />
        </div>
      </section>

      {/* -------------------------- CATÁLOGO -------------------------- */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Una selección"
          title="Del catálogo privado"
          description="Las piezas bloqueadas muestran su miniatura difuminada y el plan necesario para verlas. Nada más sale del servidor."
          action={
            <Link
              href="/videos"
              className="focus-ring group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-aurum transition-colors hover:text-aurum-soft"
            >
              Ver catálogo completo
              <IconArrowRight
                width={16}
                height={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          }
        />

        {videos.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => (
              <VideoCard key={video.id} video={video} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="surface mt-10 grid place-items-center gap-3 px-6 py-20 text-center">
            <IconFilm width={30} height={30} className="text-ink-faint" />
            <p className="font-display text-lg font-bold text-ink">Catálogo en preparación</p>
            <p className="max-w-sm text-sm text-ink-muted">
              Todavía no hay vídeos publicados. Vuelve pronto o suscríbete para recibir un aviso
              con cada nueva publicación.
            </p>
          </div>
        )}
      </section>

      {/* --------------------------- PILARES -------------------------- */}
      <section className="border-y border-line-soft bg-[#0a0a0c]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Por qué Noctra"
            title="Privacidad tratada como una función, no como una promesa"
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="bg-[#0d0d10] p-7 sm:p-9">
                <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-aurum/25 bg-aurum/10 text-aurum">
                  {pillar.icon}
                </span>
                <h3 className="font-display mb-2.5 text-lg font-bold tracking-[-0.02em] text-ink">
                  {pillar.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-ink-muted">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- PLANES -------------------------- */}
      <section id="planes" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Suscripciones"
          title="Dos planes. Ninguna letra pequeña."
          description="Facturación mensual, cancelación en cualquier momento y pagos gestionados íntegramente por Stripe."
        />
        <div className="mt-12">
          <PlanGrid currentPlan={plan} authenticated={Boolean(user)} />
        </div>
      </section>

      {/* ----------------------------- CTA ---------------------------- */}
      <section className="mx-auto max-w-[1280px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="surface grain relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="aurum-glow" aria-hidden />
          <div className="relative z-10">
            <h2 className="display-lg mx-auto max-w-2xl text-ink">
              Crea tu cuenta y entra en el catálogo privado
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-muted">
              Registro en menos de un minuto. Sin permanencia, sin cargos ocultos y con la
              posibilidad de cancelar desde tu propio panel cuando quieras.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={user ? "/pricing" : "/register"} size="lg">
                {user ? "Elegir mi plan" : "Crear cuenta"}
              </ButtonLink>
              <ButtonLink href="/videos" variant="outline" size="lg">
                Explorar el catálogo
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
