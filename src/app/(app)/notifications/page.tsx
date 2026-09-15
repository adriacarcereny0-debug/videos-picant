import type { Metadata } from "next";
import { NotificationList } from "@/components/account/NotificationList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Notificaciones",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">Avisos</p>
        <h1 className="display-lg text-ink">Notificaciones</h1>
      </header>

      <NotificationList
        items={notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          link: item.link,
          readAt: item.readAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
