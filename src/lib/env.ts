/**
 * Acceso centralizado a variables de entorno.
 * Nada de este módulo debe importarse desde componentes cliente:
 * las claves privadas viven exclusivamente en el servidor.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
    }
    return "";
  }
  return value;
}

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  appName: process.env.APP_NAME ?? "Noctra",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",

  // Sesiones
  sessionSecret: required("SESSION_SECRET", "dev-only-insecure-secret-change-me-32chars"),
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 7),
  sessionRememberTtlDays: Number(process.env.SESSION_REMEMBER_TTL_DAYS ?? 30),

  // Stripe (solo backend)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceBasic: process.env.STRIPE_PRICE_BASIC ?? "",
  stripePricePremium: process.env.STRIPE_PRICE_PREMIUM ?? "",

  // Almacenamiento de objetos privado
  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "s3" | "local",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  signedUrlTtlSeconds: Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900),

  // Email transaccional
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  mailFrom: process.env.MAIL_FROM ?? "Noctra <no-reply@noctra.example>",

  // Demo
  demoMode: process.env.DEMO_MODE !== "false",
};

export const isStripeConfigured = () =>
  Boolean(env.stripeSecretKey && env.stripePriceBasic && env.stripePricePremium);
