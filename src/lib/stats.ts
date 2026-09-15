import "server-only";
import { prisma } from "@/lib/prisma";
import type { Point } from "@/components/admin/Charts";

/** Métricas agregadas del panel de administración. */
export async function adminOverview() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    activeUsers,
    basic,
    premium,
    activeSubs,
    canceledSubs,
    videos,
    basicVideos,
    premiumVideos,
    pendingReports,
    monthlyRevenue,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: activeSince } } }),
    prisma.subscription.count({ where: { plan: "BASIC", status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.subscription.count({ where: { plan: "PREMIUM", status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.video.count(),
    prisma.video.count({ where: { subscriptionLevel: "BASIC" } }),
    prisma.video.count({ where: { subscriptionLevel: "PREMIUM" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.subscriptionEvent.aggregate({
      _sum: { amountCents: true },
      where: { type: { in: ["invoice.paid", "checkout.completed"] }, createdAt: { gte: monthStart } },
    }),
    prisma.subscriptionEvent.aggregate({
      _sum: { amountCents: true },
      where: { type: { in: ["invoice.paid", "checkout.completed"] } },
    }),
  ]);

  // Ingresos recurrentes teóricos según suscripciones vivas.
  const mrrCents = basic * 999 + premium * 1999;

  return {
    users,
    activeUsers,
    basic,
    premium,
    activeSubs,
    canceledSubs,
    videos,
    basicVideos,
    premiumVideos,
    pendingReports,
    monthlyRevenueCents: monthlyRevenue._sum.amountCents ?? 0,
    totalRevenueCents: totalRevenue._sum.amountCents ?? 0,
    mrrCents,
  };
}

function lastDays(days: number): { start: Date; labels: string[]; buckets: Date[] } {
  const buckets: Date[] = [];
  const labels: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    buckets.push(day);
    labels.push(
      new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(day),
    );
  }

  return { start: buckets[0], labels, buckets };
}

function bucketize(dates: Date[], buckets: Date[], labels: string[]): Point[] {
  const counts = new Array(buckets.length).fill(0);

  for (const date of dates) {
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      if (date >= buckets[i]) {
        counts[i] += 1;
        break;
      }
    }
  }

  return labels.map((label, index) => ({ label, value: counts[index] }));
}

/** Series temporales de los últimos 30 días. */
export async function adminSeries(days = 30) {
  const { start, labels, buckets } = lastDays(days);

  const [newUsers, newSubs, cancellations, payments] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.subscriptionEvent.findMany({
      where: { createdAt: { gte: start }, type: { in: ["customer.subscription.created", "checkout.completed"] } },
      select: { createdAt: true },
    }),
    prisma.subscriptionEvent.findMany({
      where: { createdAt: { gte: start }, type: "customer.subscription.deleted" },
      select: { createdAt: true },
    }),
    prisma.subscriptionEvent.findMany({
      where: { createdAt: { gte: start }, type: "invoice.paid" },
      select: { createdAt: true, amountCents: true },
    }),
  ]);

  const revenueCounts = new Array(buckets.length).fill(0);
  for (const payment of payments) {
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      if (payment.createdAt >= buckets[i]) {
        revenueCounts[i] += (payment.amountCents ?? 0) / 100;
        break;
      }
    }
  }

  return {
    newUsers: bucketize(newUsers.map((u) => u.createdAt), buckets, labels),
    newSubscriptions: bucketize(newSubs.map((s) => s.createdAt), buckets, labels),
    cancellations: bucketize(cancellations.map((c) => c.createdAt), buckets, labels),
    revenue: labels.map((label, index) => ({
      label,
      value: Math.round(revenueCounts[index] * 100) / 100,
    })),
  };
}
