"use client";

import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

const REASONS = [
  { value: "INAPPROPRIATE", label: "Contenido inapropiado" },
  { value: "TECHNICAL", label: "Problema técnico" },
  { value: "UNAUTHORIZED", label: "Contenido publicado sin autorización" },
  { value: "OTHER", label: "Otro" },
];

export function ReportForm({
  videoId,
  videoTitle,
  defaultEmail = "",
}: {
  videoId: string | null;
  videoTitle: string | null;
  defaultEmail?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("sending");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          reason: formData.get("reason"),
          description: formData.get("description"),
          contactEmail: formData.get("contactEmail"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido enviar el reporte.");
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <Alert tone="positive">
        Hemos registrado tu reporte. Nuestro equipo lo revisará lo antes posible.
      </Alert>
    );
  }

  return (
    <form action={submit} className="space-y-5">
      {state === "error" && <Alert tone="danger">{message}</Alert>}

      {videoTitle && (
        <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Vídeo reportado</p>
          <p className="mt-1 text-[15px] font-medium text-ink">{videoTitle}</p>
        </div>
      )}

      <Field label="Motivo" htmlFor="reason">
        <select id="reason" name="reason" required className={inputClass}>
          {REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Correo de contacto"
        htmlFor="contactEmail"
        hint="Para poder informarte del resultado de la revisión."
      >
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={defaultEmail}
          className={inputClass}
        />
      </Field>

      <Field label="Descripción" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={1000}
          placeholder="Explícanos con el mayor detalle posible qué ocurre."
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Enviar reporte"}
      </Button>
    </form>
  );
}
