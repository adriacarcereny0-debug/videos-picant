import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { ensureCustomer, stripe } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Portal de cliente de Stripe: método de pago, facturas y gestión de la
 * suscripción sin que la plataforma maneje datos bancarios.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    const sdk = stripe();
    if (!sdk) {
      return fail(
        "El portal de facturación no está disponible en modo demostración.",
        503,
      );
    }

    const customerId = await ensureCustomer(
      user.id,
      user.email,
      user.subscription?.stripeCustomerId ?? null,
    );
    if (!customerId) return fail("No se ha encontrado tu cliente de facturación.", 404);

    if (user.subscription?.stripeCustomerId !== customerId) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }

    const session = await sdk.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.appUrl}/subscription`,
    });

    return ok({ url: session.url });
  } catch (error) {
    return handleError(error);
  }
}
