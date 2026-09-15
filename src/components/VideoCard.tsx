import Link from "next/link";
import Image from "next/image";
import { LevelBadge } from "@/components/ui";
import { IconLock, IconPlay } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import type { PublicVideo } from "@/lib/videos";

/**
 * Tarjeta de catálogo. Cuando el usuario no tiene acceso, la miniatura se
 * muestra oscurecida y desenfocada: nunca se entrega el vídeo.
 */
export function VideoCard({
  video,
  priority = false,
}: {
  video: PublicVideo;
  priority?: boolean;
}) {
  const { unlocked, requiredPlan } = video;

  return (
    <article className="group">
      <Link
        href={`/videos/${video.id}`}
        className="focus-ring surface lift block overflow-hidden !p-0"
      >
        <div className="relative aspect-video overflow-hidden bg-elevated">
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            unoptimized
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.04] ${
              unlocked ? "" : "scale-105 blur-[7px] brightness-[0.42] saturate-50"
            }`}
          />

          {/* Degradado inferior para legibilidad */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/15 to-transparent"
            aria-hidden
          />

          <div className="absolute left-3 top-3">
            <LevelBadge level={video.subscriptionLevel} />
          </div>

          <div className="absolute right-3 top-3 rounded-md bg-obsidian/75 px-2 py-1 text-[11px] font-semibold tabular-nums text-ink backdrop-blur-sm">
            {formatDuration(video.durationSeconds)}
          </div>

          {unlocked ? (
            <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 group-hover:opacity-100">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-obsidian/65 text-ink backdrop-blur-md">
                <IconPlay width={22} height={22} />
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-aurum/35 bg-obsidian/70 text-aurum backdrop-blur-md">
                <IconLock width={20} height={20} />
              </span>
              <p className="text-[12px] font-semibold text-ink">
                Requiere plan {requiredPlan === "PREMIUM" ? "Premium" : "Básico"}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-[18px]">
          <h3 className="font-display line-clamp-1 text-[15px] font-bold tracking-[-0.02em] text-ink">
            {video.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
            {video.description}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {video.category}
            </span>
            {unlocked ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-aurum-soft">
                Reproducir
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-aurum px-3 py-1.5 text-[11px] font-bold text-obsidian">
                Desbloquear
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="surface overflow-hidden !p-0">
      <div className="skeleton aspect-video" />
      <div className="space-y-2.5 p-[18px]">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
