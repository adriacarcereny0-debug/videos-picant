import type { Metadata } from "next";
import { ReportForm } from "@/components/ReportForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reportar contenido",
  description: "Comunica un contenido inapropiado, un problema técnico o una publicación sin autorización.",
  alternates: { canonical: "/report" },
};

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const video = params.video
    ? await prisma.video.findUnique({
        where: { id: params.video },
        select: { id: true, title: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow mb-4">Moderación</p>
      <h1 className="display-lg text-ink">Reportar contenido</h1>
      <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">
        Revisamos todos los reportes manualmente. Las solicitudes de retirada por publicación sin
        autorización se tramitan con carácter prioritario.
      </p>

      <div className="surface mt-10 p-6 sm:p-8">
        <ReportForm
          videoId={video?.id ?? null}
          videoTitle={video?.title ?? null}
          defaultEmail={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
