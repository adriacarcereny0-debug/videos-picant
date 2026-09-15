"use client";

import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

export interface SiteSettings {
  siteName: string;
  supportEmail: string;
  heroHeadline: string;
  announcement: string;
  signedUrlTtlSeconds: number;
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [status, setStatus] = useState<{ tone: "positive" | "danger"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(formData: FormData) {
    setStatus(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: formData.get("siteName"),
          supportEmail: formData.get("supportEmail"),
          heroHeadline: formData.get("heroHeadline"),
          announcement: formData.get("announcement"),
          signedUrlTtlSeconds: formData.get("signedUrlTtlSeconds"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se han podido guardar los ajustes.");
      setStatus({ tone: "positive", text: "Ajustes guardados." });
    } catch (error) {
      setStatus({
        tone: "danger",
        text: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={save} className="surface space-y-5 p-6 sm:p-7">
      {status && <Alert tone={status.tone}>{status.text}</Alert>}

      <Field label="Nombre de la plataforma" htmlFor="siteName">
        <input
          id="siteName"
          name="siteName"
          required
          defaultValue={initial.siteName}
          className={inputClass}
        />
      </Field>

      <Field label="Correo de soporte" htmlFor="supportEmail">
        <input
          id="supportEmail"
          name="supportEmail"
          type="email"
          required
          defaultValue={initial.supportEmail}
          className={inputClass}
        />
      </Field>

      <Field label="Titular del hero" htmlFor="heroHeadline">
        <input
          id="heroHeadline"
          name="heroHeadline"
          maxLength={160}
          defaultValue={initial.heroHeadline}
          className={inputClass}
        />
      </Field>

      <Field
        label="Aviso destacado"
        htmlFor="announcement"
        hint="Texto breve para comunicar mantenimientos o novedades. Vacío = sin aviso."
      >
        <input
          id="announcement"
          name="announcement"
          maxLength={300}
          defaultValue={initial.announcement}
          className={inputClass}
        />
      </Field>

      <Field
        label="Caducidad de los enlaces de vídeo (segundos)"
        htmlFor="signedUrlTtlSeconds"
        hint="Entre 60 y 86400. Cuanto menor, más seguro; demasiado bajo puede cortar reproducciones largas."
      >
        <input
          id="signedUrlTtlSeconds"
          name="signedUrlTtlSeconds"
          type="number"
          min={60}
          max={86400}
          defaultValue={initial.signedUrlTtlSeconds}
          className={inputClass}
        />
      </Field>

      <Button type="submit" disabled={saving}>
        {saving ? "Guardando…" : "Guardar ajustes"}
      </Button>
    </form>
  );
}
