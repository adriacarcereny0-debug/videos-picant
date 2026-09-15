import "server-only";
import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { PLANS, type PlanKey } from "@/lib/plans";

/**
 * Cliente de Stripe. La clave secreta jamás sale del backend.
 * Si no está configurada (demo), las funciones devuelven null y la UI
 * muestra el flujo simulado.
 */

let client: Stripe | null = null;

export function stripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  if (!client) {
    client = new Stripe(env.stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
      appInfo: { name: "Noctra", version: "1.0.0" },
    });
  }
  return client;
}

export { isStripeConfigured };

export function priceIdFor(plan: PlanKey): string {
  return plan === "PREMIUM" ? env.stripePricePremium : env.stripePriceBasic;
}

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  if (priceId === env.stripePricePremium) return "PREMIUM";
  if (priceId === env.stripePriceBasic) return "BASIC";
  return null;
}

export function priceCentsFor(plan: PlanKey): number {
  return PLANS[plan].priceCents;
}

/** Mapea los estados de Stripe al enum interno. */
export function mapStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELED" as const;
    case "unpaid":
      return "UNPAID" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

/** Reutiliza el cliente de Stripe del usuario o lo crea. */
export async function ensureCustomer(
  userId: string,
  email: string,
  existingCustomerId: string | null,
): Promise<string | null> {
  const sdk = stripe();
  if (!sdk) return null;

  if (existingCustomerId) {
    try {
      const existing = await sdk.customers.retrieve(existingCustomerId);
      if (!existing.deleted) return existing.id;
    } catch {
      // El cliente ya no existe en Stripe: se crea uno nuevo.
    }
  }

  const customer = await sdk.customers.create({
    email,
    metadata: { userId },
  });
  return customer.id;
}
