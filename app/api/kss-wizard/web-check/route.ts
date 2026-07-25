import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chargeForAiAction, refundAiAction, AI_ACTION_COSTS } from "@/lib/credits";
import { webVerifyRecommendations } from "@/lib/web-research";

const schema = z.object({
  /** Problembeschreibung/Kontext des Anwenders (optional). */
  context: z.string().max(4000).optional(),
  /** Die zu prüfenden Empfehlungen, in Anzeige-Reihenfolge. */
  items: z
    .array(z.object({ manufacturer: z.string().min(1), name: z.string().min(1) }))
    .min(1)
    .max(5),
});

/**
 * Web-Prüfung der Wizard-Empfehlungen auf Knopfdruck: prüft die Produkte per
 * Websuche gegen Foren/Herstellerseiten und liefert Fazit, Anmerkungen je
 * Produkt und Quellen MIT Glaubwürdigkeits-Einstufung. Kostet Credits
 * (Sonnet + Websuche) — daher separat und nicht automatisch.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Für die Web-Prüfung bitte anmelden." },
      { status: 401 },
    );
  }

  const charge = await chargeForAiAction(session.user.id, "kssWizardWeb");
  if (!charge.ok) {
    const msg =
      charge.reason === "no_credits"
        ? `Für die Web-Prüfung fehlen Credits (${AI_ACTION_COSTS.kssWizardWeb} nötig). Credits gibt es unter „Mitgliedschaft".`
        : "Kennenlernphase abgelaufen und kein aktives Abo — Web-Prüfung nicht verfügbar.";
    return NextResponse.json({ error: msg }, { status: 402 });
  }

  const web = await webVerifyRecommendations({
    context: parsed.data.context ?? "",
    items: parsed.data.items,
    usageFeature: "kss_wizard_web",
  });

  if (!web) {
    // Kein Ergebnis (Key fehlt / Ausfall / Not-Aus) → Credits zurück.
    await refundAiAction(session.user.id, "kssWizardWeb");
    return NextResponse.json(
      { error: "Web-Prüfung vorübergehend nicht verfügbar — Credits erstattet." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    summary: web.summary,
    sources: web.sources,
    // Map → Objekt fürs JSON ("1"-basierte Indizes als Schlüssel)
    notes: Object.fromEntries(web.notesByIndex),
    creditsCharged: charge.cost,
  });
}
