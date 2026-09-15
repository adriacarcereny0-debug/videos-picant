import { SettingsForm, type SiteSettings } from "@/components/admin/SettingsForm";
import { StatusPill } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { env, isStripeConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

const DEFAULTS: SiteSettings = {
  siteName: "Noctra",
  supportEmail: "soporte@noctra.example",
  heroHeadline: "Contenido privado que solo verá quien tenga acceso.",
  announcement: "",
  signedUrlTtlSeconds: 900,
};

export default async function AdminSettingsPage() {
  const [record, logs] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "site" } }),
    prisma.securityLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const settings = { ...DEFAULTS, ...((record?.value as Partial<SiteSettings>) ?? {}) };

  const integrations = [
    {
      name: "Stripe",
      ok: isStripeConfigured(),
      detail: isStripeConfigured()
        ? "Claves y precios configurados."
        : "Sin configurar: la plataforma opera en modo demostración.",
    },
    {
      name: "Webhook de Stripe",
      ok: Boolean(env.stripeWebhookSecret),
      detail: env.stripeWebhookSecret
        ? "Firma de webhooks verificada."
        : "Define STRIPE_WEBHOOK_SECRET para validar los eventos entrantes.",
    },
    {
      name: "Almacenamiento",
      ok: env.storageDriver === "s3" && Boolean(env.s3Bucket),
      detail:
        env.storageDriver === "s3" && env.s3Bucket
          ? `Bucket privado: ${env.s3Bucket}`
          : "Driver local (solo desarrollo). En producción usa un bucket privado S3/R2.",
    },
    {
      name: "Correo transaccional",
      ok: Boolean(env.smtpHost),
      detail: env.smtpHost
        ? `SMTP: ${env.smtpHost}`
        : "Sin SMTP: los correos se registran por consola.",
    },
  ];

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow mb-2">Configuración</p>
        <h1 className="display-lg text-ink">Ajustes</h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SettingsForm initial={settings} />

        <div className="space-y-6">
          <div className="surface p-6">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Integraciones
            </h2>
            <ul className="space-y-4">
              {integrations.map((integration) => (
                <li key={integration.name}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-medium text-ink">{integration.name}</span>
                    <StatusPill tone={integration.ok ? "positive" : "warning"}>
                      {integration.ok ? "Configurado" : "Pendiente"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                    {integration.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Claves privadas
            </h2>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Las claves de Stripe y del almacenamiento se leen exclusivamente de variables de
              entorno en el servidor. Nunca se envían al navegador ni se muestran en este panel.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="display-md mb-4 text-ink">Registro de seguridad</h2>
        <div className="surface overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  <th className="px-5 py-3.5 font-bold">Evento</th>
                  <th className="px-3 py-3.5 font-bold">Cuenta</th>
                  <th className="px-3 py-3.5 font-bold">IP</th>
                  <th className="px-5 py-3.5 font-bold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-3 font-mono text-[12px] text-ink">{log.event}</td>
                    <td className="px-3 py-3 text-[13px] text-ink-muted">
                      {log.email ?? log.userId ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink-faint">
                      {log.ip ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-ink-faint">
                      Sin eventos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
