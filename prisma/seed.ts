/**
 * Datos ficticios para la demo.
 *
 * Crea un administrador, usuarios de ejemplo con distintos planes y un
 * catálogo de vídeos con miniaturas generadas. Los ficheros se escriben en el
 * almacenamiento local privado (carpeta `storage/`, fuera de `public/`).
 *
 * Ejecutar:  npm run db:seed
 */

import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, type SubscriptionLevel } from "@prisma/client";

const prisma = new PrismaClient();
const STORAGE_ROOT = path.join(process.cwd(), "storage");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@noctra.example";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Noctra2026Admin";
const DEMO_PASSWORD = "Demo2026Cuenta";
/** Ruta opcional a un MP4 real para poder reproducir en la demo. */
const DEMO_VIDEO_PATH = process.env.SEED_VIDEO_PATH ?? "";

const PALETTES = [
  ["#1b1b22", "#3a3550", "#c8a063"],
  ["#141420", "#2c3344", "#aab4c4"],
  ["#1a1418", "#4a2f3a", "#e0c493"],
  ["#12181a", "#27424a", "#8fb3bd"],
  ["#1d1a14", "#4a3d24", "#c8a063"],
  ["#17141d", "#382a4d", "#b39ddb"],
];

/** Miniatura generada: degradado + numeración, sin dependencias externas. */
function thumbnailSvg(index: number, title: string): string {
  const [from, to, accent] = PALETTES[index % PALETTES.length];
  const number = String(index + 1).padStart(2, "0");
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.25" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect width="1280" height="720" fill="url(#h)"/>
  <g opacity="0.16" stroke="${accent}" stroke-width="1.2" fill="none">
    <circle cx="1040" cy="180" r="150"/>
    <circle cx="1040" cy="180" r="230"/>
    <circle cx="1040" cy="180" r="310"/>
  </g>
  <text x="72" y="600" font-family="Helvetica,Arial,sans-serif" font-size="150" font-weight="800"
        fill="${accent}" opacity="0.5" letter-spacing="-8">${number}</text>
  <text x="72" y="660" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="600"
        fill="#f5f3ef" opacity="0.88">${safeTitle}</text>
</svg>`;
}

const CATALOG: {
  title: string;
  description: string;
  category: string;
  level: SubscriptionLevel;
  duration: number;
}[] = [
  {
    title: "Primera sesión — Luz tenue",
    description:
      "Apertura del catálogo. Una sesión íntima grabada en plano fijo, con iluminación cálida y sin cortes.",
    category: "Sesiones",
    level: "BASIC",
    duration: 742,
  },
  {
    title: "Habitación 407",
    description:
      "Segunda entrega de la serie de interiores. Rodada de noche, con sonido ambiente original.",
    category: "Series",
    level: "BASIC",
    duration: 1265,
  },
  {
    title: "Contraluz",
    description:
      "Estudio de sombras y contraluces. Una pieza breve, más visual que narrativa.",
    category: "Estudios",
    level: "BASIC",
    duration: 468,
  },
  {
    title: "Sin editar — Cinta 12",
    description:
      "Material íntegro sin montaje, tal y como se grabó. Exclusivo para suscriptores Premium.",
    category: "Sin editar",
    level: "PREMIUM",
    duration: 2184,
  },
  {
    title: "Terciopelo",
    description:
      "Producción larga con dirección de arte cuidada, iluminación de estudio y dos cámaras.",
    category: "Producciones",
    level: "PREMIUM",
    duration: 1876,
  },
  {
    title: "Detrás de la cámara",
    description:
      "Cómo se prepara una sesión: montaje, luces, ensayo y conversación previa. Contenido Premium.",
    category: "Extras",
    level: "PREMIUM",
    duration: 1043,
  },
  {
    title: "Amanecer",
    description: "Pieza rodada con luz natural al amanecer. Ritmo pausado y plano secuencia.",
    category: "Sesiones",
    level: "BASIC",
    duration: 934,
  },
  {
    title: "Archivo — Selección 01",
    description:
      "Recopilación de material de archivo restaurado y remasterizado. Solo Premium.",
    category: "Archivo",
    level: "PREMIUM",
    duration: 1520,
  },
];

async function writeObject(key: string, data: Buffer) {
  const target = path.join(STORAGE_ROOT, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
}

async function main() {
  console.log("→ Sembrando datos de demostración…");

  // -------------------------------- Admin --------------------------------
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: {
      email: ADMIN_EMAIL,
      displayName: "Administración",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "ADMIN",
      ageVerified: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      subscription: { create: { plan: "PREMIUM", status: "ACTIVE", priceCents: 1999 } },
    },
  });

  // ------------------------- Usuarios de ejemplo --------------------------
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000);

  const demoUsers = [
    { email: "free@noctra.example", name: "Cuenta Free", plan: "FREE" as const, price: 0 },
    { email: "basic@noctra.example", name: "Cuenta Básico", plan: "BASIC" as const, price: 999 },
    { email: "premium@noctra.example", name: "Cuenta Premium", plan: "PREMIUM" as const, price: 1999 },
  ];

  for (const demo of demoUsers) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: {
        email: demo.email,
        displayName: demo.name,
        passwordHash: demoPasswordHash,
        ageVerified: true,
        emailVerified: true,
        emailVerifiedAt: now,
        lastLoginAt: now,
        subscription: {
          create: {
            plan: demo.plan,
            status: demo.plan === "FREE" ? "INCOMPLETE" : "ACTIVE",
            priceCents: demo.price,
            currentPeriodStart: demo.plan === "FREE" ? null : now,
            currentPeriodEnd: demo.plan === "FREE" ? null : periodEnd,
          },
        },
      },
    });
  }

  // Usuarios de relleno para las estadísticas del panel.
  for (let i = 1; i <= 24; i += 1) {
    const email = `usuario${String(i).padStart(2, "0")}@noctra.example`;
    const createdAt = new Date(now.getTime() - i * 26 * 60 * 60 * 1000);
    const plan = i % 5 === 0 ? "PREMIUM" : i % 3 === 0 ? "BASIC" : "FREE";

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        displayName: `Usuario ${i}`,
        passwordHash: demoPasswordHash,
        ageVerified: true,
        emailVerified: i % 4 !== 0,
        createdAt,
        lastLoginAt: i % 3 === 0 ? new Date(now.getTime() - i * 3600 * 1000) : null,
        subscription: {
          create: {
            plan,
            status: plan === "FREE" ? "INCOMPLETE" : "ACTIVE",
            priceCents: plan === "PREMIUM" ? 1999 : plan === "BASIC" ? 999 : 0,
            currentPeriodStart: plan === "FREE" ? null : createdAt,
            currentPeriodEnd: plan === "FREE" ? null : periodEnd,
            createdAt,
          },
        },
      },
    });
  }

  // -------------------------- Eventos de facturación ----------------------
  const paidSubscriptions = await prisma.subscription.findMany({
    where: { plan: { not: "FREE" } },
    take: 40,
  });

  for (const subscription of paidSubscriptions) {
    const existing = await prisma.subscriptionEvent.count({
      where: { subscriptionId: subscription.id },
    });
    if (existing > 0) continue;

    for (let month = 0; month < 3; month += 1) {
      const createdAt = new Date(now.getTime() - month * 9 * 24 * 60 * 60 * 1000);
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: month === 2 ? "customer.subscription.created" : "invoice.paid",
          amountCents: subscription.priceCents,
          currency: "eur",
          createdAt,
        },
      });
    }
  }

  // ------------------------------- Catálogo -------------------------------
  const demoVideoBuffer = DEMO_VIDEO_PATH
    ? await fs.readFile(DEMO_VIDEO_PATH).catch(() => null)
    : null;

  if (!demoVideoBuffer) {
    console.log(
      "  · Sin SEED_VIDEO_PATH: se crean fichas con miniatura, pero sin archivo reproducible.\n" +
        "    Sube vídeos reales desde /admin/videos, o define SEED_VIDEO_PATH=/ruta/demo.mp4.",
    );
  }

  for (const [index, item] of CATALOG.entries()) {
    const slug = item.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await prisma.video.findUnique({ where: { slug } });
    if (existing) continue;

    const publishedAt = new Date(now.getTime() - (CATALOG.length - index) * 3 * 24 * 3600 * 1000);

    const video = await prisma.video.create({
      data: {
        slug,
        title: item.title,
        description: item.description,
        category: item.category,
        subscriptionLevel: item.level,
        status: "PUBLISHED",
        durationSeconds: item.duration,
        sortOrder: index,
        viewCount: Math.floor(Math.random() * 900) + 40,
        publishedAt,
        thumbnailKey: "",
        videoStorageKey: "",
      },
    });

    const thumbnailKey = `thumbnails/${video.id}/thumbnail.svg`;
    await writeObject(thumbnailKey, Buffer.from(thumbnailSvg(index, item.title), "utf8"));

    const videoKey = `videos/${video.id}/video.mp4`;
    if (demoVideoBuffer) await writeObject(videoKey, demoVideoBuffer);

    await prisma.video.update({
      where: { id: video.id },
      data: { thumbnailKey, videoStorageKey: videoKey },
    });
  }

  // ---------------------- Notificaciones y reportes -----------------------
  const premiumUser = await prisma.user.findUnique({
    where: { email: "premium@noctra.example" },
  });

  if (premiumUser) {
    const count = await prisma.notification.count({ where: { userId: premiumUser.id } });
    if (count === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId: premiumUser.id,
            type: "WELCOME",
            title: "Bienvenido a Noctra",
            message: "Tu cuenta de demostración está lista.",
            link: "/videos",
          },
          {
            userId: premiumUser.id,
            type: "SUBSCRIPTION_ACTIVATED",
            title: "Plan Premium activado",
            message: "Ya tienes acceso a todo el catálogo.",
            link: "/subscription",
          },
          {
            userId: premiumUser.id,
            type: "NEW_PREMIUM_VIDEO",
            title: "Nuevo vídeo Premium",
            message: "Ya puedes ver «Terciopelo».",
            link: "/videos",
          },
        ],
      });
    }
  }

  const firstVideo = await prisma.video.findFirst({ orderBy: { sortOrder: "asc" } });
  const reportCount = await prisma.report.count();
  if (firstVideo && reportCount === 0 && premiumUser) {
    await prisma.report.create({
      data: {
        userId: premiumUser.id,
        videoId: firstVideo.id,
        reason: "TECHNICAL",
        description: "El vídeo se detiene alrededor del minuto 3 en móvil.",
        contactEmail: premiumUser.email,
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: {
        siteName: "Noctra",
        supportEmail: "soporte@noctra.example",
        heroHeadline: "Contenido privado que solo verá quien tenga acceso.",
        announcement: "",
        signedUrlTtlSeconds: 900,
      },
    },
  });

  console.log(`✓ Listo.
  Admin:    ${admin.email} / ${ADMIN_PASSWORD}
  Free:     free@noctra.example / ${DEMO_PASSWORD}
  Básico:   basic@noctra.example / ${DEMO_PASSWORD}
  Premium:  premium@noctra.example / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
