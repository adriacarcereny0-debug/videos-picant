import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

/**
 * Emails transaccionales.
 * Sin SMTP configurado (demo) se registran por consola en lugar de enviarse.
 */

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtpHost) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
    });
  }
  return transporter;
}

interface Layout {
  title: string;
  preheader: string;
  heading: string;
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}

/** Plantilla base responsive, compatible con clientes de correo. */
function render(layout: Layout): string {
  const paragraphs = layout.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#b9b6c2;">${p}</p>`,
    )
    .join("");

  const cta =
    layout.ctaUrl && layout.ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
           <tr><td style="border-radius:999px;background:#c8a063;">
             <a href="${layout.ctaUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#0b0b0d;text-decoration:none;border-radius:999px;font-family:Helvetica,Arial,sans-serif;">${layout.ctaLabel}</a>
           </td></tr>
         </table>`
      : "";

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${layout.title}</title></head>
<body style="margin:0;padding:0;background:#08080a;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${layout.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08080a;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101014;border:1px solid #232329;border-radius:18px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
    <tr><td style="padding:28px 32px 0;">
      <span style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:#c8a063;font-weight:700;">${env.appName}</span>
    </td></tr>
    <tr><td style="padding:20px 32px 32px;">
      <h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#f5f3ef;letter-spacing:-.02em;">${layout.heading}</h1>
      ${paragraphs}${cta}
      ${layout.footnote ? `<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6d6a78;">${layout.footnote}</p>` : ""}
    </td></tr>
    <tr><td style="padding:18px 32px;border-top:1px solid #232329;">
      <p style="margin:0;font-size:11px;line-height:1.7;color:#6d6a78;">
        Contenido exclusivo para mayores de 18 años.<br>
        <a href="${env.appUrl}/terms" style="color:#8e8b98;">Términos</a> ·
        <a href="${env.appUrl}/privacy" style="color:#8e8b98;">Privacidad</a> ·
        <a href="${env.appUrl}/contact" style="color:#8e8b98;">Contacto</a>
      </p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

async function send(to: string, subject: string, layout: Layout): Promise<void> {
  const html = render(layout);
  const tx = getTransporter();
  if (!tx) {
    console.info(`[mail:demo] → ${to} · ${subject}`);
    return;
  }
  try {
    await tx.sendMail({ from: env.mailFrom, to, subject, html });
  } catch (error) {
    console.error("[mail] envío fallido", error);
  }
}

export const mailer = {
  verification: (to: string, url: string) =>
    send(to, "Verifica tu correo electrónico", {
      title: "Verifica tu correo",
      preheader: "Confirma tu dirección para activar tu cuenta.",
      heading: "Confirma tu correo",
      body: [
        "Gracias por crear una cuenta. Confirma tu dirección para activar el acceso completo a la plataforma.",
        "Este enlace caduca en 24 horas.",
      ],
      ctaLabel: "Verificar correo",
      ctaUrl: url,
      footnote: "Si no has creado ninguna cuenta, ignora este mensaje.",
    }),

  welcome: (to: string) =>
    send(to, `Bienvenido a ${env.appName}`, {
      title: "Bienvenido",
      preheader: "Tu cuenta ya está activa.",
      heading: "Bienvenido",
      body: [
        "Tu cuenta ya está activa. Elige una suscripción para desbloquear el catálogo privado.",
      ],
      ctaLabel: "Ver suscripciones",
      ctaUrl: `${env.appUrl}/pricing`,
    }),

  passwordReset: (to: string, url: string) =>
    send(to, "Recupera tu contraseña", {
      title: "Recupera tu contraseña",
      preheader: "Enlace para restablecer tu contraseña.",
      heading: "Restablecer contraseña",
      body: [
        "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.",
        "El enlace caduca en 60 minutos y solo puede utilizarse una vez.",
      ],
      ctaLabel: "Crear nueva contraseña",
      ctaUrl: url,
      footnote: "Si no has solicitado el cambio, no es necesario que hagas nada.",
    }),

  subscriptionActivated: (to: string, planName: string) =>
    send(to, "Tu suscripción está activa", {
      title: "Suscripción activa",
      preheader: `Plan ${planName} activado.`,
      heading: `Plan ${planName} activado`,
      body: ["Ya tienes acceso al contenido incluido en tu plan."],
      ctaLabel: "Entrar en mi cuenta",
      ctaUrl: `${env.appUrl}/dashboard`,
    }),

  paymentSucceeded: (to: string, amount: string, periodEnd: string) =>
    send(to, "Pago confirmado", {
      title: "Pago confirmado",
      preheader: `Hemos recibido tu pago de ${amount}.`,
      heading: "Pago confirmado",
      body: [
        `Hemos recibido correctamente tu pago de <strong style="color:#f5f3ef;">${amount}</strong>.`,
        `Tu suscripción se renueva el ${periodEnd}.`,
      ],
      ctaLabel: "Ver mi suscripción",
      ctaUrl: `${env.appUrl}/subscription`,
    }),

  paymentFailed: (to: string) =>
    send(to, "No hemos podido procesar tu pago", {
      title: "Pago fallido",
      preheader: "Actualiza tu método de pago.",
      heading: "No hemos podido procesar tu pago",
      body: [
        "El último cobro de tu suscripción no se ha completado. Actualiza tu método de pago para no perder el acceso.",
      ],
      ctaLabel: "Actualizar método de pago",
      ctaUrl: `${env.appUrl}/subscription`,
    }),

  subscriptionCanceled: (to: string, endsOn: string) =>
    send(to, "Suscripción cancelada", {
      title: "Suscripción cancelada",
      preheader: "Tu suscripción no se renovará.",
      heading: "Suscripción cancelada",
      body: [
        `Tu suscripción no se renovará. Mantendrás el acceso hasta el ${endsOn}.`,
        "Puedes reactivarla cuando quieras desde tu cuenta.",
      ],
      ctaLabel: "Reactivar suscripción",
      ctaUrl: `${env.appUrl}/pricing`,
    }),

  renewalReminder: (to: string, planName: string, renewsOn: string, amount: string) =>
    send(to, "Tu suscripción se renueva pronto", {
      title: "Renovación próxima",
      preheader: `Tu plan ${planName} se renueva el ${renewsOn}.`,
      heading: "Renovación próxima",
      body: [`Tu plan ${planName} se renovará el ${renewsOn} por ${amount}.`],
      ctaLabel: "Gestionar suscripción",
      ctaUrl: `${env.appUrl}/subscription`,
    }),

  newVideo: (to: string, title: string, url: string) =>
    send(to, `Nuevo vídeo disponible: ${title}`, {
      title: "Nuevo vídeo",
      preheader: `Ya puedes ver ${title}.`,
      heading: "Nuevo vídeo disponible",
      body: [`Acabamos de publicar <strong style="color:#f5f3ef;">${title}</strong>.`],
      ctaLabel: "Ver ahora",
      ctaUrl: url,
    }),
};
