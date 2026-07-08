// POST /api/billing/cancel
// "Kündigungsbutton" (sinngemäß § 312k BGB) — kündigt das Abo mit sofortiger
// Wirkung zum Ende der bereits bezahlten Periode. Keine Vorlaufzeit
// erforderlich, keine weitere Abbuchung danach. Immer erreichbar unter
// /mitgliedschaft, kein Support-Kontakt nötig.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelMembership } from "@/lib/membership";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await cancelMembership(session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
