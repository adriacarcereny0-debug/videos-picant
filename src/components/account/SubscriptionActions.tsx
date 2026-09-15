"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "@/components/ui";

type Action = "portal" | "cancel" | "resume";

export function SubscriptionActions({
  canManage,
  cancelAtPeriodEnd,
  endsOn,
}: {
  canManage: boolean;
  cancelAtPeriodEnd: boolean;
  endsOn: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(action: Action) {
    setError(null);
    setBusy(action);
    try {
      const endpoint =
        action === "portal"
          ? "/api/portal"
          : action === "cancel"
            ? "/api/subscription/cancel"
            : "/api/subscription/resume";

      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido completar la acción.");

      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => run("portal")} disabled={busy !== null}>
          {busy === "portal" ? "Abriendo…" : "Gestionar método de pago"}
        </Button>

        {canManage &&
          (cancelAtPeriodEnd ? (
            <Button onClick={() => run("resume")} disabled={busy !== null}>
              {busy === "resume" ? "Reactivando…" : "Reactivar suscripción"}
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => setConfirming(true)}
              disabled={busy !== null}
            >
              Cancelar suscripción
            </Button>
          ))}
      </div>

      {confirming && (
        <div className="surface-flat space-y-4 p-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Si cancelas, tu suscripción no se renovará y mantendrás el acceso hasta el{" "}
            <strong className="text-ink">{endsOn}</strong>. Podrás reactivarla en cualquier
            momento antes de esa fecha.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => run("cancel")} disabled={busy !== null}>
              {busy === "cancel" ? "Cancelando…" : "Sí, cancelar"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy !== null}>
              Mantener mi suscripción
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
