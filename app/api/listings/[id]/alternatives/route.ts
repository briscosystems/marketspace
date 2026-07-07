import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findAlternatives, type MustHave } from "@/lib/alternatives";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";

export const maxDuration = 60;

/** Credit-Info für die UI — welcher Betrag wurde abgebucht, was ist der Stand. */
export type CreditInfo = {
  charged: number;
  balance: number | null;
  notice: string | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Partial<MustHave>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const mustHave: MustHave = {
    sameProductType: body.sameProductType ?? true,
    sameChemistry: body.sameChemistry ?? true,
    sameViscosity: body.sameViscosity ?? false,
    sameApplicationArea: body.sameApplicationArea ?? false,
    samePackaging: body.samePackaging ?? false,
    requiredCertifications: Array.isArray(body.requiredCertifications)
      ? body.requiredCertifications.filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        )
      : [],
    avoidIssues: Array.isArray(body.avoidIssues)
      ? (body.avoidIssues.filter((x) => typeof x === "string") as MustHave["avoidIssues"])
      : [],
    workpieceMaterial:
      typeof body.workpieceMaterial === "string" && body.workpieceMaterial.trim()
        ? body.workpieceMaterial.trim()
        : undefined,
    minAutomationScore:
      typeof body.minAutomationScore === "number" && body.minAutomationScore > 0
        ? Math.min(5, Math.max(1, Math.round(body.minAutomationScore)))
        : undefined,
    requireGlycolFree: body.requireGlycolFree === true,
  };

  // KI-Bewertung kostet 1 Credit — ohne Credits/Zugang läuft die
  // regelbasierte Bewertung (kostenlos) mit Hinweis.
  const session = await getServerSession(authOptions);
  let allowAi = false;
  const credits: CreditInfo = { charged: 0, balance: null, notice: null };

  if (session?.user?.id) {
    const charge = await chargeForAiAction(session.user.id, "alternatives");
    credits.balance = charge.balance;
    if (charge.ok) {
      allowAi = true;
      credits.charged = charge.cost;
    } else if (charge.reason === "no_credits") {
      credits.notice =
        "Dein Credit-Guthaben ist aufgebraucht — es wird die regelbasierte Bewertung gezeigt. Credits kannst du unter „Mitgliedschaft“ kaufen.";
    } else {
      credits.notice =
        "Deine Kennenlernphase ist abgelaufen und es ist kein Abo aktiv — es wird die regelbasierte Bewertung gezeigt.";
    }
  } else {
    credits.notice =
      "Melde dich an, um die KI-Bewertung zu nutzen — es wird die regelbasierte Bewertung gezeigt.";
  }

  try {
    const result = await findAlternatives(id, mustHave, { allowAi });

    // Abgebucht, aber KI kam nicht zum Zug (Ausfall) → erstatten
    if (allowAi && result.modelUsed !== "claude" && session?.user?.id) {
      await refundAiAction(session.user.id, "alternatives");
      credits.balance = (credits.balance ?? 0) + credits.charged;
      credits.charged = 0;
      credits.notice = "KI vorübergehend nicht verfügbar — dein Credit wurde erstattet.";
    }

    return NextResponse.json({ ...result, credits });
  } catch (e) {
    if (allowAi && session?.user?.id) {
      await refundAiAction(session.user.id, "alternatives");
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
