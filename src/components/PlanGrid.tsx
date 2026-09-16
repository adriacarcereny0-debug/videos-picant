"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { PLAN_LIST, type PlanKey } from "@/lib/plans";

/**
 * Comparativa de planes. El botón abre Stripe Checkout; si el backend no
 * tiene Stripe configurado responde con el flujo de demostración.
 */
export function PlanGrid({
  currentPlan,
  authenticated,
}: {
  currentPlan: "FREE" | "BASIC" | "PREMIUM";
  authenticated: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: PlanKey) {
    setError(null);

    if (!authenticated) {
      router.push(`/register?next=/pricing&plan=${plan.toLowerCase()}`);
      return;
    }

    setLoading(plan);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "No se ha podido iniciar el pago.");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="grid items-stretch gap-px bg-line lg:grid-cols-2">
        {PLAN_LIST.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isPremium = plan.accent === "lip";

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col p-8 sm:p-10 ${
                isPremium ? "bg-lip text-noir" : "border border-line bg-surface"
              }`}
            >
              {isPremium && (
                <span className="absolute right-8 top-10 text-[10px] font-semibold uppercase tracking-[0.16em] text-noir/70">
                  Acceso total
                </span>
              )}

              <h3
                className={`font-display text-[28px] leading-none ${
                  isPremium ? "text-noir" : "text-ink"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`mt-3 text-[14px] leading-relaxed ${
                  isPremium ? "text-noir/70" : "text-ink-muted"
                }`}
              >
                {plan.tagline}
              </p>

              <div className="mt-8 flex items-baseline gap-2">
                <span
                  className={`font-display text-[56px] leading-none tabular ${
                    isPremium ? "text-noir" : "text-ink"
                  }`}
                >
                  {plan.priceLabel}
                </span>
                <span className={isPremium ? "text-[13px] text-noir/60" : "text-[13px] text-ink-faint"}>
                  / mes
                </span>
              </div>
              <p
                className={`mt-2 text-[12px] ${isPremium ? "text-noir/55" : "text-ink-faint"}`}
              >
                IVA incluido, facturación mensual
              </p>

              <div
                className={`my-8 h-px ${isPremium ? "bg-noir/20" : "bg-line"}`}
                aria-hidden
              />

              {/* Alto fijo para que las listas arranquen a la misma altura */}
              <ul className="flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex gap-3 text-[14px] leading-snug ${
                      isPremium ? "text-noir/85" : "text-ink-muted"
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${isPremium ? "text-noir" : "text-lip"}`}>
                      <IconCheck width={16} height={16} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* La llamada a la acción queda anclada abajo en ambas columnas */}
              <div className="mt-10">
                {isCurrent ? (
                  <Button variant="secondary" full size="lg" disabled>
                    Tu plan actual
                  </Button>
                ) : (
                  <Button
                    full
                    size="lg"
                    variant={isPremium ? "secondary" : "primary"}
                    className={isPremium ? "border-noir bg-noir text-ink hover:bg-noir/90" : ""}
                    onClick={() => subscribe(plan.key)}
                    disabled={loading !== null}
                  >
                    {loading === plan.key
                      ? "Redirigiendo…"
                      : currentPlan === "FREE"
                        ? "Suscribirme"
                        : "Cambiar a este plan"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-8 text-[12px] leading-relaxed text-ink-faint">
        Los pagos se procesan con Stripe. Madrastras no almacena en ningún momento los datos de
        tu tarjeta.
      </p>
    </div>
  );
}
