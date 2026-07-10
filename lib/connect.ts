import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Gleicht den Connect-Onboarding-Status eines Verkäufers mit Stripe ab.
 * Wird beim Laden von /mitgliedschaft aufgerufen, solange das Onboarding
 * noch nicht abgeschlossen ist (kein Webhook nötig im Prototyp).
 * Liefert den aktuellen onboarded-Stand.
 */
export async function syncConnectStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });
  if (!user?.stripeConnectAccountId) return false;
  if (user.stripeConnectOnboarded) return true;
  if (!stripe) return false;

  try {
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const onboarded = !!account.charges_enabled && !!account.payouts_enabled;
    if (onboarded) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectOnboarded: true },
      });
    }
    return onboarded;
  } catch {
    return false;
  }
}
