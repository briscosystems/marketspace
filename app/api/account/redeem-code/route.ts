// POST /api/account/redeem-code { code }
// Löst einen vom Superadmin generierten Gutschein-/Referral-Code für
// Credits ein. Ein Code ist pro Nutzer nur einmal einlösbar.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redeemReferralCode } from "@/lib/credits";

const bodySchema = z.object({ code: z.string().trim().min(3).max(60) });

const REASON_MESSAGE: Record<string, string> = {
  not_found: "Dieser Code ist ungültig.",
  expired: "Dieser Code ist abgelaufen.",
  exhausted: "Dieser Code wurde bereits vollständig eingelöst.",
  already_redeemed: "Du hast diesen Code bereits eingelöst.",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const result = await redeemReferralCode(session.user.id, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json(
      { error: REASON_MESSAGE[result.reason] ?? "Code konnte nicht eingelöst werden." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, credits: result.credits, balance: result.balance });
}
