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
  ["#3a2b3d", "#8a5f6e", "#f0cfa8", "#0f0a11"],
  ["#22303f", "#4f7590", "#cfe2f0", "#0a1017"],
  ["#3b2422", "#945143", "#f7cfae", "#130b0a"],
  ["#1b312c", "#3f8272", "#b8e6d2", "#08110f"],
  ["#372c1a", "#94793c", "#f7e2ad", "#120e06"],
  ["#2a2140", "#5f4795", "#d5c2f5", "#0d0916"],
];

/**
 * Fotograma sintético para la demo.
 *
 * Geometría nítida —luz de contra, haz diagonal, horizonte y viñeta— en vez
 * de desenfoques: se lee como un plano cinematográfico y aguanta bien de
 * portada a pantalla completa. En producción lo sustituyen las miniaturas
 * reales que suba el administrador.
 */
function thumbnailSvg(index: number, title: string): string {
  const [deep, mid, light, shadow] = PALETTES[index % PALETTES.length];
  const number = String(index + 1).padStart(2, "0");
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const beamX = 340 + (index % 4) * 190;
  const horizon = 560 + (index % 3) * 70;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${mid}"/>
      <stop offset="60%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="${shadow}"/>
    </linearGradient>
    <radialGradient id="key" cx="0.62" cy="0.26" r="0.55">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.72"/>
      <stop offset="40%" stop-color="${light}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.34"/>
      <stop offset="70%" stop-color="${light}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${shadow}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${shadow}" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.8">
      <stop offset="52%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#sky)"/>
  <rect width="1600" height="900" fill="url(#key)"/>

  <!-- Haces de luz entrando en diagonal -->
  <polygon points="${beamX},0 ${beamX + 150},0 ${beamX - 190},900 ${beamX - 430},900" fill="url(#shaft)"/>
  <polygon points="${beamX + 250},0 ${beamX + 305},0 ${beamX + 70},900 ${beamX - 45},900" fill="url(#shaft)" opacity="0.55"/>

  <!-- Horizonte: separa el plano y da profundidad -->
  <rect x="0" y="${horizon}" width="1600" height="${900 - horizon}" fill="url(#floor)"/>
  <line x1="0" y1="${horizon}" x2="1600" y2="${horizon}" stroke="${light}" stroke-width="1" opacity="0.22"/>

  <!-- Reflejo tenue del haz sobre el suelo -->
  <polygon points="${beamX - 190},${horizon} ${beamX - 60},${horizon} ${beamX - 250},900 ${beamX - 460},900"
           fill="${light}" opacity="0.07"/>

  <rect width="1600" height="900" fill="url(#vignette)"/>
  <rect width="1600" height="900" filter="url(#grain)" opacity="0.06"/>

  <text x="86" y="768" font-family="Georgia,'Times New Roman',serif" font-size="150" font-style="italic"
        fill="${light}" opacity="0.34" letter-spacing="-5">${number}</text>
  <text x="92" y="826" font-family="Helvetica,Arial,sans-serif" font-size="25"
        fill="#ffffff" opacity="0.7" letter-spacing="0.5">${safeTitle}</text>
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
        featured: index < 3,
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
