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
      <div className="grid gap-6 lg:grid-cols-2">
        {PLAN_LIST.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isPremium = plan.accent === "aurum";

          return (
            <div
              key={plan.key}
              className={`surface relative flex flex-col overflow-hidden p-7 sm:p-9 ${
                isPremium ? "border-aurum/35" : ""
              }`}
            >
              {isPremium && (
                <>
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurum to-transparent"
                    aria-hidden
                  />
                  <span className="absolute right-6 top-7 rounded-full border border-aurum/40 bg-aurum/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-aurum-soft">
                    Acceso total
                  </span>
                </>
              )}

              <h3
                className={`font-display text-xl font-bold tracking-[-0.03em] ${
                  isPremium ? "text-aurum-soft" : "text-silver"
                }`}
              >
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{plan.tagline}</p>

              <div className="mt-7 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold tracking-[-0.045em] text-ink">
                  {plan.priceLabel}
                </span>
                <span className="text-sm text-ink-faint">/ mes</span>
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">IVA incluido · Facturación mensual</p>

              <div className="hairline my-7" />

              <ul className="flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[14.5px] leading-snug text-ink-muted">
                    <span
                      className={`mt-0.5 shrink-0 ${isPremium ? "text-aurum" : "text-silver"}`}
                    >
                      <IconCheck width={17} height={17} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrent ? (
                  <Button variant="secondary" full size="lg" disabled>
                    Tu plan actual
                  </Button>
                ) : (
                  <Button
                    full
                    size="lg"
                    variant={isPremium ? "primary" : "secondary"}
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
        <p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
        Los pagos se procesan a través de Stripe. Noctra no almacena en ningún momento los datos
        de tu tarjeta.
      </p>
    </div>
  );
}
