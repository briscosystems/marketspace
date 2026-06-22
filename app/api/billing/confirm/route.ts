// GET /api/billing/confirm?session_id=...
// Fallback für die Entwicklung ohne konfigurierten Webhook: nach dem Erfolgs-
// Redirect ruft die Mitgliedschaftsseite diese Route auf, die die Session bei
// Stripe nachschlägt und — falls bezahlt — die Mitgliedschaft freischaltet.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/membership";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 });
  }

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id fehlt" }, { status: 400 });

  const checkout = await stripe.checkout.sessions.retrieve(sessionId);
  if (checkout.metadata?.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await fulfillCheckoutSession(checkout);
  return NextResponse.json({ paid: checkout.payment_status === "paid" });
}
