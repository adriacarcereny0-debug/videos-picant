import "server-only";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  await prisma.notification
    .create({ data: { userId, type, title, message, link } })
    .catch((error) => console.error("[notifications]", error));
}

/** Aviso masivo al publicar un vídeo, solo a quien puede verlo. */
export async function notifyNewVideo(video: {
  id: string;
  title: string;
  subscriptionLevel: "BASIC" | "PREMIUM";
}): Promise<number> {
  const plans = video.subscriptionLevel === "PREMIUM" ? ["PREMIUM"] : ["BASIC", "PREMIUM"];

  const users = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      subscription: {
        plan: { in: plans as ("BASIC" | "PREMIUM")[] },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    },
    select: { id: true },
  });

  if (users.length === 0) return 0;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: (video.subscriptionLevel === "PREMIUM"
        ? "NEW_PREMIUM_VIDEO"
        : "NEW_VIDEO") as NotificationType,
      title: video.subscriptionLevel === "PREMIUM" ? "Nuevo vídeo Premium" : "Nuevo vídeo disponible",
      message: `Ya puedes ver «${video.title}».`,
      link: `/videos/${video.id}`,
    })),
  });

  return users.length;
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
