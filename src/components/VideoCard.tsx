import Link from "next/link";
import Image from "next/image";
import { LevelBadge } from "@/components/ui";
import { IconLock, IconPlay } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import type { PublicVideo } from "@/lib/videos";

/**
 * Ficha del catálogo.
 *
 * No es una tarjeta con borde y sombra: es una imagen con su pie, como en una
 * página impresa. Sin acceso, la miniatura llega difuminada y el candado
 * ocupa el centro; el vídeo nunca sale del servidor.
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
      <Link href={`/videos/${video.id}`} className="focus-ring lift block">
        <div className="relative aspect-[3/2] overflow-hidden bg-surface">
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            unoptimized
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03] ${
              unlocked ? "" : "scale-[1.04] blur-[10px] brightness-[0.45] saturate-[0.6]"
            }`}
          />

          <div className="absolute left-0 top-0">
            <LevelBadge level={video.subscriptionLevel} />
          </div>

          <div className="absolute bottom-0 right-0 bg-noir/85 px-2 py-1 text-[11px] tabular text-ink">
            {formatDuration(video.durationSeconds)}
          </div>

          {unlocked ? (
            <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 group-hover:opacity-100">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-lip text-ink">
                <IconPlay width={18} height={18} />
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <IconLock width={20} height={20} className="text-lip" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">
                Requiere {requiredPlan === "PREMIUM" ? "Premium" : "Básico"}
              </p>
            </div>
          )}
        </div>

        <div className="pt-3.5">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display line-clamp-1 text-[19px] leading-tight text-ink transition-colors duration-300 group-hover:text-lip-soft">
              {video.title}
            </h3>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {video.category}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.6] text-ink-muted">
            {video.description}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function VideoCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[3/2]" />
      <div className="space-y-2.5 pt-3.5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
      </div>
    </div>
  );
}
