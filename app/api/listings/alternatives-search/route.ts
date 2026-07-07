import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchAlternatives, searchAlternativesWeb } from "@/lib/alternative-search";
import { chargeForAiAction, refundAiAction, AI_ACTION_COSTS } from "@/lib/credits";

const schema = z.object({
  mode: z.enum(["product", "requirements"]).default("product"),
  query: z.string().optional(),
  category: z.string().optional(),
  chemistry: z.string().optional(),
  isoViscosity: z.string().optional(),
  applicationArea: z.string().optional(),
  requiredCertifications: z.array(z.string()).optional(),
  avoidIssues: z.array(z.string()).optional(),
  useWeb: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }
  const { useWeb, ...input } = parsed.data;

  // Nichts eingegeben → leeres Ergebnis statt sinnloser Volltabelle.
  const hasInput =
    !!input.query?.trim() ||
    !!input.category ||
    !!input.chemistry ||
    !!input.isoViscosity ||
    !!input.applicationArea?.trim() ||
    (input.requiredCertifications?.length ?? 0) > 0 ||
    (input.avoidIssues?.length ?? 0) > 0;
  if (!hasInput) {
    return NextResponse.json({
      source: null,
      alternatives: [],
      candidatesConsidered: 0,
      modelUsed: "rule-based",
    });
  }

  // Web-Recherche (Sonnet + Websuche) ist die teuerste KI-Aktion → 2 Credits.
  // Ohne Credits/Zugang läuft die kostenlose regelbasierte Suche mit Hinweis.
  let allowWeb = false;
  let creditNotice: string | null = null;
  let charged = 0;
  const session = useWeb ? await getServerSession(authOptions) : null;

  if (useWeb) {
    if (session?.user?.id) {
      const charge = await chargeForAiAction(session.user.id, "alternativesWeb");
      if (charge.ok) {
        allowWeb = true;
        charged = charge.cost;
      } else if (charge.reason === "no_credits") {
        creditNotice = `Für die Web-Recherche fehlen Credits (${AI_ACTION_COSTS.alternativesWeb} nötig) — regelbasierte Suche gezeigt.`;
      } else {
        creditNotice =
          "Kennenlernphase abgelaufen und kein aktives Abo — regelbasierte Suche gezeigt.";
      }
    } else {
      creditNotice = "Für die Web-Recherche bitte anmelden — regelbasierte Suche gezeigt.";
    }
  }

  try {
    const result =
      useWeb && allowWeb ? await searchAlternativesWeb(input) : await searchAlternatives(input);

    // Abgebucht, aber Web-Recherche kam nicht zum Zug (Ausfall) → erstatten
    if (allowWeb && result.modelUsed !== "claude-web" && session?.user?.id) {
      await refundAiAction(session.user.id, "alternativesWeb");
      charged = 0;
      creditNotice = "Web-Recherche vorübergehend nicht verfügbar — Credits erstattet.";
    }

    return NextResponse.json({ ...result, creditsCharged: charged, creditNotice });
  } catch (e) {
    if (allowWeb && session?.user?.id) {
      await refundAiAction(session.user.id, "alternativesWeb");
    }
    console.error("Alternativsuche fehlgeschlagen:", e);
    return NextResponse.json({ error: "Suche fehlgeschlagen" }, { status: 500 });
  }
}
