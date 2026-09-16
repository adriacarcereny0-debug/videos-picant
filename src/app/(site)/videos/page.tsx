import type { Metadata } from "next";
import Link from "next/link";
import { VideoCard } from "@/components/VideoCard";
import { ButtonLink, EmptyState, LevelBadge } from "@/components/ui";
import { IconFilm, IconSearch } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { listPublishedVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora el catálogo privado de Madrastras por nivel de suscripción.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "basic", label: "Básico" },
  { key: "premium", label: "Premium" },
  { key: "recent", label: "Más recientes" },
];

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "";
  const search = params.q?.trim() || undefined;

  const user = await getCurrentUser();
  const plan = user?.plan ?? "FREE";

  const videos = await listPublishedVideos({
    plan,
    level: filter === "basic" ? "BASIC" : filter === "premium" ? "PREMIUM" : undefined,
    sort: filter === "recent" ? "recent" : "curated",
    search,
  });

  const locked = videos.filter((v) => !v.unlocked).length;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-3">Catálogo privado</p>
          <h1 className="display-lg text-ink">Vídeos</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
            {plan === "FREE"
              ? "Estás navegando sin suscripción: puedes explorar el catálogo, pero la reproducción requiere un plan activo."
              : plan === "BASIC"
                ? "Tu plan Básico desbloquea todo el contenido Básico. El contenido Premium permanece bloqueado."
                : "Tu plan Premium desbloquea todo el catálogo."}
          </p>
        </div>

        <form action="/videos" className="relative w-full lg:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <IconSearch width={17} height={17} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Buscar en el catálogo"
            aria-label="Buscar vídeos"
            className="w-full rounded-[3px] border border-line bg-noir py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors duration-300 focus:border-lip focus:outline-none"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
        </form>
      </header>

      {/* Filtros */}
      <nav className="mt-10 flex gap-7 overflow-x-auto border-b border-line" aria-label="Filtros de catálogo">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const href = item.key
            ? `/videos?filter=${item.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`
            : `/videos${search ? `?q=${encodeURIComponent(search)}` : ""}`;
          return (
            <Link
              key={item.label}
              href={href}
              className={`focus-ring shrink-0 border-b-2 px-1 pb-2 text-[12px] font-semibold uppercase tracking-[0.13em] transition-colors duration-300 ${
                active ? "border-lip text-ink" : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan !== "PREMIUM" && locked > 0 && (
        <div className="mt-8 flex flex-col gap-4 border-l-0 bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LevelBadge level="PREMIUM" />
            <p className="text-[14px] text-ink-muted">
              <strong className="font-semibold text-ink">{locked}</strong>{" "}
              {locked === 1 ? "vídeo bloqueado" : "vídeos bloqueados"} con tu plan actual.
            </p>
          </div>
          <ButtonLink href="/pricing" size="sm" className="shrink-0">
            {plan === "FREE" ? "Ver suscripciones" : "Mejorar a Premium"}
          </ButtonLink>
        </div>
      )}

      {videos.length > 0 ? (
        <div className="mt-12 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video, index) => (
            <VideoCard key={video.id} video={video} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={<IconFilm width={30} height={30} />}
            title={search ? "Sin resultados" : "Catálogo en preparación"}
            description={
              search
                ? `No hemos encontrado vídeos que coincidan con «${search}».`
                : "Todavía no hay vídeos publicados en esta sección."
            }
            action={
              search ? (
                <ButtonLink href="/videos" variant="secondary" size="sm">
                  Ver todo el catálogo
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
