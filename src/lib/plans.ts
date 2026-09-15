import type { Plan, SubscriptionLevel } from "@prisma/client";

export type PlanKey = "BASIC" | "PREMIUM";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceCents: number;
  priceLabel: string;
  tagline: string;
  features: string[];
  accent: "silver" | "aurum";
  highlighted: boolean;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  BASIC: {
    key: "BASIC",
    name: "Básico",
    priceCents: 999,
    priceLabel: "9,99 €",
    tagline: "El acceso esencial al catálogo privado.",
    features: [
      "Acceso a todo el contenido marcado como Básico",
      "Acceso desde móvil, tablet y ordenador",
      "Reproductor de vídeo privado con enlaces firmados",
      "Cancelación en cualquier momento",
    ],
    accent: "silver",
    highlighted: false,
  },
  PREMIUM: {
    key: "PREMIUM",
    name: "Premium",
    priceCents: 1999,
    priceLabel: "19,99 €",
    tagline: "El catálogo completo, sin restricciones.",
    features: [
      "Todo el contenido Básico incluido",
      "Todo el contenido Premium en exclusiva",
      "Acceso prioritario a los nuevos vídeos",
      "Reproductor de vídeo privado con enlaces firmados",
      "Cancelación en cualquier momento",
    ],
    accent: "aurum",
    highlighted: true,
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.BASIC, PLANS.PREMIUM];

/** Jerarquía de acceso: Premium incluye Básico. */
const RANK: Record<Plan, number> = { FREE: 0, BASIC: 1, PREMIUM: 2 };
const LEVEL_RANK: Record<SubscriptionLevel, number> = { BASIC: 1, PREMIUM: 2 };

export function planCovers(plan: Plan, level: SubscriptionLevel): boolean {
  return RANK[plan] >= LEVEL_RANK[level];
}

export function requiredPlanFor(level: SubscriptionLevel): PlanKey {
  return level === "PREMIUM" ? "PREMIUM" : "BASIC";
}
