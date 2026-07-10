// POST /api/billing/checkout-credits { packageId: "S" | "M" | "L" }
// Erzeugt eine Stripe-Checkout-Session für ein KI-Credit-Paket. Basis-Preis =
// Credits × creditPriceCt (Superadmin-Einstellung, Standard 10 Ct/Credit
// = 100 % Marge auf die teuerste KI-Aktion, siehe FDS C.9), Basis-Währung EUR.
// Abgerechnet wird in der Wunsch-/Landeswährung des Nutzers (lib/currency.ts).
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";
import { CREDIT_PACKAGES, getSettingInt, packagePriceEur } from "@/lib/credits";
import { billingCurrencyForUser, convertCurrency, toStripeAmount } from "@/lib/currency";

const bodySchema = z.object({
  packageId: z.enum(["S", "M", "L"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }
  const pkg = CREDIT_PACKAGES.find((p) => p.id === parsed.data.packageId)!;

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true, country: true, preferredCurrency: true },
  });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const priceCt = await getSettingInt("creditPriceCt");
  const priceEur = packagePriceEur(pkg.credits, priceCt);
  const currency = billingCurrencyForUser(user);
  const price = convertCurrency(priceEur, "EUR", currency);
  const base = appBaseUrl();

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: toStripeAmount(price, currency),
          product_data: {
            name: `Brisco — KI-Credits Paket ${pkg.label}`,
            description: `${pkg.credits} Credits für KI-Funktionen (Alternativsuche, KSS-Wizard, Concierge)`,
          },
        },
      },
    ],
    metadata: { userId, kind: "CREDITS", credits: String(pkg.credits) },
    success_url: `${base}/mitgliedschaft?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/mitgliedschaft?status=cancel`,
  });

  await prisma.payment.create({
    data: {
      userId,
      kind: "CREDITS",
      status: "PENDING",
      amountEur: price, // Feldname historisch — enthält den Betrag in `currency`
      currency: currency.toLowerCase(),
      stripeSessionId: checkout.id,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
