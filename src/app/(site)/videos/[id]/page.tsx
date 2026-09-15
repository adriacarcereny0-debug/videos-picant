import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoCard } from "@/components/VideoCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ButtonLink, LevelBadge } from "@/components/ui";
import { IconLock } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorizePlayback, listPublishedVideos, toPublicVideo } from "@/lib/videos";
import { formatDate, formatDuration } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vídeo",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  const plan = user?.plan ?? "FREE";

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) notFound();
  if (video.status !== "PUBLISHED" && user?.role !== "ADMIN") notFound();

  // La decisión de reproducir se toma íntegramente en el servidor.
  const grant = await authorizePlayback(video.id);
  const publicVideo = await toPublicVideo(video, plan);

  const related = (
    await listPublishedVideos({ plan, sort: "curated", take: 7 })
  )
    .filter((v) => v.id !== video.id)
    .slice(0, 3);

  const requiredPlanLabel = publicVideo.requiredPlan === "PREMIUM" ? "Premium" : "Básico";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav className="mb-6 text-[13px] text-ink-faint" aria-label="Migas de pan">
        <Link href="/videos" className="transition-colors hover:text-ink">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-muted">{video.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {grant.allowed && grant.sources ? (
            <VideoPlayer
              videoId={video.id}
              title={video.title}
              poster={publicVideo.thumbnailUrl}
              sources={grant.sources}
            />
          ) : (
            <LockedPreview
              thumbnail={publicVideo.thumbnailUrl}
              requiredPlanLabel={requiredPlanLabel}
              authenticated={Boolean(user)}
              reason={grant.reason}
            />
          )}

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-3">
              <LevelBadge level={video.subscriptionLevel} />
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink-faint">
                {video.category}
              </span>
              <span className="text-[12px] text-ink-faint">
                {formatDuration(video.durationSeconds)}
              </span>
              <span className="text-[12px] text-ink-faint">
                {formatDate(video.publishedAt ?? video.createdAt)}
              </span>
            </div>

            <h1 className="display-md mt-4 text-ink">{video.title}</h1>

            <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">
              {video.description}
            </p>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <span className="text-[13px] text-ink-faint">
                {video.viewCount.toLocaleString("es-ES")} reproducciones
              </span>
              <ReportDialog videoId={video.id} />
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <aside className="space-y-6">
          {!grant.allowed && (
            <div className="surface p-6">
              <h2 className="font-display text-base font-bold text-ink">
                Desbloquea este vídeo
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                Este contenido requiere el plan{" "}
                <strong className="text-ink">{requiredPlanLabel}</strong>.
              </p>
              <ButtonLink href={user ? "/pricing" : "/register"} full className="mt-5">
                {user ? "Ver suscripciones" : "Crear cuenta"}
              </ButtonLink>
              {!user && (
                <p className="mt-4 text-center text-[13px] text-ink-faint">
                  ¿Ya tienes cuenta?{" "}
                  <Link href={`/login?next=/videos/${video.id}`} className="text-aurum">
                    Inicia sesión
                  </Link>
                </p>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                También disponible
              </h2>
              <div className="space-y-4">
                {related.map((item) => (
                  <VideoCard key={item.id} video={item} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function LockedPreview({
  thumbnail,
  requiredPlanLabel,
  authenticated,
  reason,
}: {
  thumbnail: string;
  requiredPlanLabel: string;
  authenticated: boolean;
  reason?: string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-elevated">
      <Image
        src={thumbnail}
        alt=""
        fill
        unoptimized
        priority
        sizes="(max-width: 1024px) 100vw, 900px"
        className="scale-105 object-cover blur-[14px] brightness-[0.35] saturate-50"
      />
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-aurum/35 bg-obsidian/70 text-aurum backdrop-blur-md">
            <IconLock width={26} height={26} />
          </span>
          <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
            Contenido bloqueado
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
            {reason === "AUTH_REQUIRED"
              ? `Inicia sesión y activa el plan ${requiredPlanLabel} para reproducir este vídeo.`
              : `Tu plan actual no incluye este contenido. Necesitas el plan ${requiredPlanLabel}.`}
          </p>
          <ButtonLink
            href={authenticated ? "/pricing" : "/register"}
            size="lg"
            className="mt-6"
          >
            Desbloquear
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
