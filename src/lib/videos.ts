import "server-only";
import type { Plan, Video } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { planCovers, requiredPlanFor } from "@/lib/plans";
import { createSignedAsset } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security";

/** Vídeo tal y como se entrega al cliente: sin claves de almacenamiento. */
export interface PublicVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  durationSeconds: number;
  subscriptionLevel: "BASIC" | "PREMIUM";
  publishedAt: string | null;
  viewCount: number;
  thumbnailUrl: string;
  /** Resuelto en el servidor a partir del plan real del usuario. */
  unlocked: boolean;
  requiredPlan: "BASIC" | "PREMIUM";
}

/**
 * Proyecta un vídeo a su forma pública.
 * La miniatura se firma siempre (es una preview permitida); el vídeo NO.
 */
export async function toPublicVideo(video: Video, plan: Plan): Promise<PublicVideo> {
  const thumb = await createSignedAsset(video.thumbnailKey, { ttlSeconds: 3600 });
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    description: video.description,
    category: video.category,
    durationSeconds: video.durationSeconds,
    subscriptionLevel: video.subscriptionLevel,
    publishedAt: video.publishedAt?.toISOString() ?? null,
    viewCount: video.viewCount,
    thumbnailUrl: thumb.url,
    unlocked: planCovers(plan, video.subscriptionLevel),
    requiredPlan: requiredPlanFor(video.subscriptionLevel),
  };
}

export async function listPublishedVideos(options: {
  plan: Plan;
  level?: "BASIC" | "PREMIUM";
  sort?: "recent" | "curated";
  take?: number;
  search?: string;
}): Promise<PublicVideo[]> {
  const videos = await prisma.video.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      ...(options.level ? { subscriptionLevel: options.level } : {}),
      ...(options.search
        ? { title: { contains: options.search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy:
      options.sort === "recent"
        ? [{ publishedAt: "desc" }]
        : [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take: options.take ?? 60,
  });

  return Promise.all(videos.map((v) => toPublicVideo(v, options.plan)));
}

export interface PlaybackGrant {
  allowed: boolean;
  reason?: "NOT_FOUND" | "NOT_PUBLISHED" | "AUTH_REQUIRED" | "PLAN_REQUIRED";
  requiredPlan?: "BASIC" | "PREMIUM";
  sources?: { label: string; url: string }[];
  expiresAt?: Date;
}

/**
 * Autorización de reproducción. ÚNICA puerta de acceso al fichero de vídeo.
 * Se comprueba SIEMPRE en el servidor a partir del plan almacenado en base de
 * datos; el cliente no interviene en la decisión.
 */
export async function authorizePlayback(videoId: string): Promise<PlaybackGrant> {
  const user = await getCurrentUser();
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { renditions: true },
  });

  if (!video) return { allowed: false, reason: "NOT_FOUND" };
  const isAdmin = user?.role === "ADMIN";

  if (video.status !== "PUBLISHED" && !isAdmin) {
    return { allowed: false, reason: "NOT_PUBLISHED" };
  }

  if (!user) {
    return {
      allowed: false,
      reason: "AUTH_REQUIRED",
      requiredPlan: requiredPlanFor(video.subscriptionLevel),
    };
  }

  if (!isAdmin && !planCovers(user.plan, video.subscriptionLevel)) {
    await logSecurityEvent("VIDEO_ACCESS_DENIED", {
      userId: user.id,
      meta: { videoId, plan: user.plan, required: video.subscriptionLevel },
    });
    return {
      allowed: false,
      reason: "PLAN_REQUIRED",
      requiredPlan: requiredPlanFor(video.subscriptionLevel),
    };
  }

  // Enlaces temporales: uno por calidad disponible.
  const master = await createSignedAsset(video.videoStorageKey, { subject: user.id });
  const renditions = await Promise.all(
    video.renditions
      .sort((a, b) => (b.widthPx ?? 0) - (a.widthPx ?? 0))
      .map(async (r) => ({
        label: r.label,
        url: (await createSignedAsset(r.storageKey, { subject: user.id })).url,
      })),
  );

  await logSecurityEvent("VIDEO_ACCESS_GRANTED", { userId: user.id, meta: { videoId } });

  return {
    allowed: true,
    sources: [{ label: "Auto", url: master.url }, ...renditions],
    expiresAt: master.expiresAt,
  };
}

export async function recordView(
  videoId: string,
  userId: string | null,
  watchedSeconds: number,
): Promise<void> {
  await prisma.$transaction([
    prisma.videoView.create({ data: { videoId, userId, watchedSeconds } }),
    prisma.video.update({ where: { id: videoId }, data: { viewCount: { increment: 1 } } }),
  ]);
}
