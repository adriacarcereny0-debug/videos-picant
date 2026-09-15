import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { notify } from "@/lib/notifications";
import { mailer } from "@/lib/mail";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

/** Cancela al final del periodo: el acceso se mantiene hasta la fecha pagada. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("No autorizado.", 401);

    const subscription = user.subscription;
    if (!subscription || subscription.plan === "FREE") {
      return fail("No tienes ninguna suscripción activa.", 400);
    }

    const sdk = stripe();
    if (sdk && subscription.stripeSubscriptionId) {
      await sdk.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
    });

    const endsOn = formatDate(updated.currentPeriodEnd);
    await notify(
      user.id,
      "SUBSCRIPTION_CANCELED",
      "Suscripción cancelada",
      `Tu suscripción no se renovará. Mantendrás el acceso hasta el ${endsOn}.`,
      "/subscription",
    );
    await mailer.subscriptionCanceled(user.email, endsOn);

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
