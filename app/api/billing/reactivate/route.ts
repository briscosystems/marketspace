// POST /api/billing/reactivate
// Widerruft eine Kündigung, solange die bezahlte Periode noch läuft — das
// Abo verlängert sich dann wieder automatisch wie gewohnt.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reactivateMembership } from "@/lib/membership";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await reactivateMembership(session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
