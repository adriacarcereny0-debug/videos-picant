import { VideoManager, type AdminVideo } from "@/components/admin/VideoManager";
import { prisma } from "@/lib/prisma";
import { activeDriver, createSignedAsset } from "@/lib/storage";

export const metadata = { title: "Vídeos" };
export const dynamic = "force-dynamic";

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string }>;
}) {
  const params = await searchParams;

  const videos = await prisma.video.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  const rows: AdminVideo[] = await Promise.all(
    videos.map(async (video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      category: video.category,
      thumbnailUrl: video.thumbnailKey
        ? (await createSignedAsset(video.thumbnailKey, { ttlSeconds: 3600 })).url
        : "",
      durationSeconds: video.durationSeconds,
      subscriptionLevel: video.subscriptionLevel,
      status: video.status,
      sortOrder: video.sortOrder,
      featured: video.featured,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      createdAt: video.createdAt.toISOString(),
    })),
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow mb-2">Contenido</p>
        <h1 className="display-lg text-ink">Gestión de vídeos</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          Sube nuevos vídeos, decide si pertenecen al nivel Básico o Premium y controla su
          publicación. Los archivos nunca se exponen mediante una URL pública permanente.
        </p>
      </header>

      <VideoManager
        videos={rows}
        openUpload={params.upload === "1"}
        uploadMode={activeDriver() === "blob" ? "direct" : "inline"}
      />
    </div>
  );
}
