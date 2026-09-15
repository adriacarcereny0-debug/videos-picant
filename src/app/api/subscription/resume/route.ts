import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Deshace una cancelación programada antes de que termine el periodo. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    const subscription = user.subscription;
    if (!subscription || !subscription.cancelAtPeriodEnd) {
      return fail("No hay ninguna cancelación programada.", 400);
    }

    const sdk = stripe();
    if (sdk && subscription.stripeSubscriptionId) {
      await sdk.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false, canceledAt: null },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
