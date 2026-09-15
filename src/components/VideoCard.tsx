import Link from "next/link";
import Image from "next/image";
import { LevelBadge } from "@/components/ui";
import { IconLock, IconPlay } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import type { PublicVideo } from "@/lib/videos";

/**
 * Tarjeta de catálogo con carcasa y núcleo concéntricos.
 * Sin acceso, la miniatura se entrega difuminada y oscurecida: el vídeo
 * nunca sale del servidor.
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
    <article className="group h-full">
      <Link
        href={`/videos/${video.id}`}
        className="focus-ring shell shell-sm lift block h-full"
      >
        <div className="shell-core flex h-full flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-elevated">
            <Image
              src={video.thumbnailUrl}
              alt=""
              fill
              unoptimized
              priority={priority}
              loading={priority ? undefined : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.32,.72,0,1)] group-hover:scale-[1.05] ${
                unlocked ? "" : "scale-[1.06] blur-[9px] brightness-[0.38] saturate-[0.55]"
              }`}
            />

            <div
              className="absolute inset-0 bg-gradient-to-t from-obsidian/95 via-obsidian/10 to-transparent"
              aria-hidden
            />

            <div className="absolute left-3.5 top-3.5">
              <LevelBadge level={video.subscriptionLevel} />
            </div>

            <div className="absolute right-3.5 top-3.5 rounded-full border border-white/10 bg-obsidian/60 px-2.5 py-1 text-[10.5px] tabular-nums text-ink backdrop-blur-md">
              {formatDuration(video.durationSeconds)}
            </div>

            {unlocked ? (
              <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-700 ease-[cubic-bezier(.32,.72,0,1)] group-hover:opacity-100">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-obsidian/55 text-ink backdrop-blur-xl transition-transform duration-700 ease-[cubic-bezier(.32,.72,0,1)] group-hover:scale-105">
                  <IconPlay width={20} height={20} />
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-aurum/30 bg-obsidian/60 text-aurum backdrop-blur-xl">
                  <IconLock width={17} height={17} />
                </span>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  Requiere {requiredPlan === "PREMIUM" ? "Premium" : "Básico"}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display line-clamp-1 text-[20px] leading-tight text-ink">
              {video.title}
            </h3>
            <p className="mt-2.5 line-clamp-2 text-[13px] leading-[1.65] text-ink-muted">
              {video.description}
            </p>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {video.category}
              </span>
              {unlocked ? (
                <span className="inline-flex items-center gap-2 text-[12px] text-aurum-soft">
                  Reproducir
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-aurum/12 transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover:translate-x-0.5">
                    <IconPlay width={10} height={10} />
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-aurum px-3.5 py-1.5 text-[11px] font-medium text-obsidian">
                  Desbloquear
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="shell shell-sm">
      <div className="shell-core">
        <div className="skeleton aspect-[16/10]" />
        <div className="space-y-3 p-5">
          <div className="skeleton h-5 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="skeleton h-3 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}
