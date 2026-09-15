import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Eyebrow, SectionHeading } from "@/components/ui";
import { VideoCard } from "@/components/VideoCard";
import { PlanGrid } from "@/components/PlanGrid";
import { HeroCover } from "@/components/HeroCover";
import { HeroShowcase } from "@/components/HeroShowcase";
import { Reveal } from "@/components/Reveal";
import {
  IconArrowRight,
  IconDevices,
  IconFilm,
  IconLock,
  IconShield,
  IconSparkle,
} from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { listFeaturedCovers, listPublishedVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Noctra — Contenido privado bajo suscripción",
  description:
    "Un catálogo privado de vídeo para mayores de 18 años. Elige tu plan, accede desde cualquier dispositivo y disfruta de una reproducción protegida.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    icon: <IconLock width={18} height={18} />,
    title: "Privado por diseño",
    text: "Cada vídeo vive en almacenamiento privado y se reproduce con enlaces firmados que caducan en minutos. No existe una URL pública permanente.",
  },
  {
    icon: <IconShield width={18} height={18} />,
    title: "Acceso verificado",
    text: "Los permisos se comprueban en el servidor antes de entregar cualquier fuente de vídeo. El navegador nunca decide qué puedes ver.",
  },
  {
    icon: <IconDevices width={18} height={18} />,
    title: "En cualquier pantalla",
    text: "Una experiencia continua en móvil, tablet y ordenador, con reproductor propio y controles completos.",
  },
  {
    icon: <IconSparkle width={18} height={18} />,
    title: "Catálogo cuidado",
    text: "Publicamos poco y bien. Cada pieza se selecciona, se clasifica por nivel y entra al catálogo con su ficha completa.",
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
      {/* ============================== HERO ============================== */}
      {/* El hero recupera el alto de la isla flotante para ir a sangre. */}
      <section className="relative -mt-[var(--header-h)] min-h-[100dvh] overflow-hidden">
        {covers.length > 0 ? <HeroCover covers={covers} /> : <div className="aurum-glow" />}

        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="max-w-2xl">
              <div className="rise">
                <Eyebrow>Acceso privado · Solo +18</Eyebrow>
              </div>

              <h1
                className="display-xl rise mt-8 text-ink"
                style={{ animationDelay: "90ms" }}
              >
                Contenido privado
                <br />
                que solo verá
                <br />
                <span className="accent-italic">quien tenga acceso.</span>
              </h1>

              <p
                className="rise mt-9 max-w-lg text-[16px] leading-[1.75] text-ink-muted sm:text-[17px]"
                style={{ animationDelay: "190ms" }}
              >
                Un catálogo cerrado de vídeo bajo suscripción mensual. Elige tu plan, entra con
                tu cuenta y reproduce desde un reproductor protegido. Sin ruido, sin anuncios,
                sin nada que no sea el contenido.
              </p>

              <div
                className="rise mt-11 flex flex-col gap-3 sm:flex-row"
                style={{ animationDelay: "280ms" }}
              >
                <ButtonLink href="/pricing" size="lg" icon>
                  Ver suscripciones
                </ButtonLink>
                {!user && (
                  <ButtonLink href="/register" variant="secondary" size="lg">
                    Crear cuenta
                  </ButtonLink>
                )}
              </div>

              <dl
                className="rise mt-16 grid max-w-md grid-cols-3 gap-8"
                style={{ animationDelay: "370ms" }}
              >
                {[
                  { value: "2", label: "planes mensuales" },
                  { value: "9,99 €", label: "desde, al mes" },
                  { value: "0", label: "permanencia" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-display text-3xl text-ink sm:text-4xl">{stat.value}</dt>
                    <dd className="mt-2 text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-faint">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Sin portada configurada, la composición sostiene el hero */}
            {covers.length === 0 && <HeroShowcase />}
          </div>
        </div>
      </section>

      {/* ============================ CATÁLOGO ============================ */}
      <section className="mx-auto max-w-[1180px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Una selección"
            title={
              <>
                Del catálogo <span className="accent-italic">privado</span>
              </>
            }
            description="Las piezas bloqueadas muestran su miniatura difuminada y el plan necesario para verlas. Nada más sale del servidor."
            action={
              <Link
                href="/videos"
                className="focus-ring group inline-flex shrink-0 items-center gap-2.5 text-[13px] text-aurum transition-colors hover:text-aurum-soft"
              >
                Ver catálogo completo
                <span className="grid h-8 w-8 place-items-center rounded-full border border-aurum/25 transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover:translate-x-1">
                  <IconArrowRight width={14} height={14} />
                </span>
              </Link>
            }
          />
        </Reveal>

        {videos.length > 0 ? (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => (
              <Reveal key={video.id} delay={index * 70}>
                <VideoCard video={video} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-16 block">
            <Card>
              <div className="grid place-items-center gap-4 px-6 py-20 text-center">
                <IconFilm width={28} height={28} className="text-ink-faint" />
                <p className="font-display text-2xl text-ink">Catálogo en preparación</p>
                <p className="max-w-sm text-[14px] leading-relaxed text-ink-muted">
                  Todavía no hay vídeos publicados. Vuelve pronto o suscríbete para recibir un
                  aviso con cada nueva publicación.
                </p>
              </div>
            </Card>
          </Reveal>
        )}
      </section>

      {/* ============================= PILARES ============================ */}
      <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#07070a]">
        <div className="mx-auto max-w-[1180px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
          <Reveal>
            <SectionHeading
              eyebrow="Por qué Noctra"
              title={
                <>
                  La privacidad como <span className="accent-italic">función</span>,
                  <br />
                  no como promesa
                </>
              }
            />
          </Reveal>

          {/* Bento asimétrico: la primera pieza ocupa el doble */}
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <Reveal
                key={pillar.title}
                delay={index * 80}
                className={index === 0 ? "lg:col-span-2" : ""}
              >
                <Card className="h-full">
                  <div className="flex h-full flex-col">
                    <span className="mb-7 grid h-12 w-12 place-items-center rounded-2xl border border-aurum/20 bg-aurum/[0.07] text-aurum">
                      {pillar.icon}
                    </span>
                    <h3 className="font-display mb-3 text-2xl text-ink">{pillar.title}</h3>
                    <p className="max-w-md text-[14.5px] leading-[1.75] text-ink-muted">
                      {pillar.text}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PLANES ============================= */}
      <section id="planes" className="mx-auto max-w-[1180px] px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Suscripciones"
            title={
              <>
                Dos planes.
                <br />
                Ninguna <span className="accent-italic">letra pequeña</span>.
              </>
            }
            description="Facturación mensual, cancelación en cualquier momento y pagos gestionados íntegramente por Stripe."
          />
        </Reveal>
        <Reveal delay={120} className="mt-16 block">
          <PlanGrid currentPlan={plan} authenticated={Boolean(user)} />
        </Reveal>
      </section>

      {/* ============================== CTA =============================== */}
      <section className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="shell relative overflow-hidden">
            <div className="shell-core relative px-6 py-24 text-center sm:px-12 sm:py-32">
              <div className="aurum-glow" aria-hidden />
              <div className="relative z-10">
                <h2 className="display-lg mx-auto max-w-2xl text-ink">
                  Crea tu cuenta y entra en el
                  <span className="accent-italic"> catálogo privado</span>
                </h2>
                <p className="mx-auto mt-7 max-w-md text-[15px] leading-[1.75] text-ink-muted">
                  Registro en menos de un minuto. Sin permanencia, sin cargos ocultos y con
                  cancelación desde tu propio panel cuando quieras.
                </p>
                <div className="mt-11 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href={user ? "/pricing" : "/register"} size="lg" icon>
                    {user ? "Elegir mi plan" : "Crear cuenta"}
                  </ButtonLink>
                  <ButtonLink href="/videos" variant="outline" size="lg">
                    Explorar el catálogo
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
