"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { IconClose, IconFlag } from "@/components/icons";

const REASONS = [
  { value: "INAPPROPRIATE", label: "Contenido inapropiado" },
  { value: "TECHNICAL", label: "Problema técnico" },
  { value: "UNAUTHORIZED", label: "Contenido publicado sin autorización" },
  { value: "OTHER", label: "Otro" },
];

export function ReportDialog({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 text-[13px] font-medium text-ink-faint transition-colors hover:text-danger"
      >
        <IconFlag width={15} height={15} />
        Reportar contenido
      </button>

      {open && (
        <div
          className="fade-in fixed inset-0 z-[60] grid place-items-center bg-obsidian/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Reportar contenido"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="surface-flat rise w-full max-w-md p-6 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Reportar contenido</h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Revisamos todos los reportes manualmente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="focus-ring grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-white/5 hover:text-ink"
              >
                <IconClose width={16} height={16} />
              </button>
            </div>

            {state === "sent" ? (
              <div className="space-y-5 text-center">
                <p className="rounded-xl border border-positive/30 bg-positive/10 px-4 py-4 text-sm text-positive">
                  Hemos recibido tu reporte. Gracias por avisarnos.
                </p>
                <Button variant="secondary" full onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <form action={submit} className="space-y-5">
                <Field label="Motivo" htmlFor="reason">
                  <select id="reason" name="reason" required className={inputClass}>
                    {REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Detalles (opcional)" htmlFor="description">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    maxLength={1000}
                    placeholder="Cuéntanos qué ocurre…"
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                {state === "error" && (
                  <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {message}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    full
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" full disabled={state === "sending"}>
                    {state === "sending" ? "Enviando…" : "Enviar reporte"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
