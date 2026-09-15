"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

export function ProfileForm({
  email,
  displayName,
  emailVerified,
}: {
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<{ tone: "positive" | "danger"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  async function save(formData: FormData) {
    setStatus(null);
    setSaving(true);
    try {
      const newPassword = String(formData.get("newPassword") ?? "");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.get("displayName"),
          currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se han podido guardar los cambios.");

      setStatus({
        tone: "positive",
        text: data.passwordChanged
          ? "Perfil actualizado. Se han cerrado el resto de sesiones."
          : "Perfil actualizado.",
      });
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "danger",
        text: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function resendVerification() {
    setResending(true);
    await fetch("/api/auth/resend-verification", { method: "POST" }).catch(() => undefined);
    setStatus({ tone: "positive", text: "Te hemos enviado un nuevo enlace de verificación." });
    setResending(false);
  }

  return (
    <div className="space-y-8">
      {status && <Alert tone={status.tone}>{status.text}</Alert>}

      <section className="surface p-6 sm:p-7">
        <h2 className="font-display mb-5 text-lg font-bold text-ink">Datos de la cuenta</h2>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Correo electrónico
            </p>
            <p className="mt-1 text-[15px] font-medium text-ink">{email}</p>
          </div>
          {emailVerified ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-positive/30 bg-positive/10 px-3 py-1.5 text-[11px] font-semibold text-positive">
              Verificado
            </span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={resendVerification}
              disabled={resending}
            >
              {resending ? "Enviando…" : "Reenviar verificación"}
            </Button>
          )}
        </div>

        <form action={save} className="space-y-5">
          <Field label="Nombre para mostrar" htmlFor="displayName">
            <input
              id="displayName"
              name="displayName"
              type="text"
              maxLength={40}
              defaultValue={displayName ?? ""}
              className={inputClass}
              placeholder="Tu nombre"
            />
          </Field>

          <div className="hairline" />

          <p className="text-[13px] text-ink-faint">
            Rellena los dos campos siguientes solo si quieres cambiar tu contraseña.
          </p>

          <Field label="Contraseña actual" htmlFor="currentPassword">
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>

          <Field
            label="Nueva contraseña"
            htmlFor="newPassword"
            hint="Mínimo 10 caracteres, con mayúscula, minúscula y número."
          >
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>

          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </section>
    </div>
  );
}
