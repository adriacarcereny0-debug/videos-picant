/**
 * Acceso centralizado a variables de entorno.
 * Nada de este módulo debe importarse desde componentes cliente:
 * las claves privadas viven exclusivamente en el servidor.
 */

const DEV_SESSION_SECRET = "dev-only-insecure-secret-change-me-32chars";

/**
 * Secreto de sesión.
 *
 * No se lanza el error al importar el módulo: eso rompería la compilación en
 * un despliegue todavía sin configurar. El error salta cuando realmente se
 * va a firmar o verificar algo (ver `requireSessionSecret`), de modo que
 * producción nunca llega a usar el secreto de desarrollo.
 */
function sessionSecretValue(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length > 0) return value;
  return process.env.NODE_ENV === "production" ? "" : DEV_SESSION_SECRET;
}

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  appName: process.env.APP_NAME ?? "Noctra",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",

  // Sesiones
  sessionSecret: sessionSecretValue(),
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 7),
  sessionRememberTtlDays: Number(process.env.SESSION_REMEMBER_TTL_DAYS ?? 30),

  // Stripe (solo backend)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceBasic: process.env.STRIPE_PRICE_BASIC ?? "",
  stripePricePremium: process.env.STRIPE_PRICE_PREMIUM ?? "",

  // Almacenamiento de objetos privado
  storageDriver: (process.env.STORAGE_DRIVER ??
    (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local")) as "s3" | "blob" | "local",
  blobToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
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

/**
 * Devuelve el secreto de sesión o falla de forma explícita.
 * Se llama desde los puntos donde se firma/verifica, nunca al importar.
 */
export function requireSessionSecret(): string {
  if (!env.sessionSecret) {
    throw new Error(
      "Falta SESSION_SECRET. Defínela en las variables de entorno antes de usar sesiones o enlaces firmados.",
    );
  }
  return env.sessionSecret;
}

/** Comprobación no destructiva para pantallas de diagnóstico. */
export const isSessionSecretConfigured = () => Boolean(env.sessionSecret);

export const isStripeConfigured = () =>
  Boolean(env.stripeSecretKey && env.stripePriceBasic && env.stripePricePremium);
