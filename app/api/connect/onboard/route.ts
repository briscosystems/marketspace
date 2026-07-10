// POST /api/connect/onboard — Verkäufer schaltet den Käuferschutz frei:
// legt (einmalig) ein Stripe-Connect-Express-Konto an und liefert den Link
// zum Stripe-Onboarding (Identitäts- und Bankdaten-Prüfung durch Stripe).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, country: true, stripeConnectAccountId: true },
  });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  try {
    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        ...(user.country ? { country: user.country } : {}),
        metadata: { userId: session.user.id },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const base = appBaseUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${base}/mitgliedschaft?connect=refresh`,
      return_url: `${base}/mitgliedschaft?connect=return`,
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    // Häufigster Fall: Connect ist im Stripe-Dashboard noch nicht aktiviert
    // ("You can only create new accounts if you've signed up for Connect").
    const message = e instanceof Error ? e.message : "Stripe-Fehler";
    console.warn("[Connect-Onboarding]", message);
    return NextResponse.json(
      {
        error: message.includes("signed up for Connect")
          ? "Stripe Connect ist für dieses Stripe-Konto noch nicht aktiviert. Einmalig im Stripe-Dashboard unter dashboard.stripe.com/connect freischalten (im Testmodus sofort möglich), dann hier erneut versuchen."
          : `Stripe meldet: ${message}`,
      },
      { status: 502 },
    );
  }
}
