/**
 * REST-API v1 — KI-Alternativsuche.
 *
 * POST /api/v1/ki/alternativen
 *   { "produkt": "Blasocut 4000", "web": false }
 *
 * Abrechnung EXAKT wie in der Oberfläche (lib/credits.ts):
 *   - regelbasierte Suche: kostenlos
 *   - mit Web-Recherche ("web": true): 2 Credits, atomar abgebucht,
 *     bei Fehlschlag automatisch erstattet
 * Die Abbuchung läuft über dasselbe Guthaben wie im Konto — ein Buchungs-
 * journal-Eintrag entsteht pro Abbuchung/Erstattung.
 */
import { NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { chargeForAiAction, refundAiAction, AI_ACTION_COSTS } from "@/lib/credits";
import { searchAlternatives, searchAlternativesWeb } from "@/lib/alternative-search";

export async function POST(req: Request) {
  const auth = await apiAuth(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as {
    produkt?: string;
    kategorie?: string;
    chemie?: string;
    isoViskositaet?: string;
    anwendung?: string;
    web?: boolean;
  } | null;
  if (!body || (!body.produkt && !body.kategorie && !body.anwendung)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_input",
          message: "Mindestens „produkt“, „kategorie“ oder „anwendung“ angeben.",
        },
      },
      { status: 400 },
    );
  }

  const eingabe = {
    mode: body.produkt ? ("product" as const) : ("requirements" as const),
    query: body.produkt,
    category: body.kategorie,
    chemistry: body.chemie,
    isoViscosity: body.isoViskositaet,
    applicationArea: body.anwendung,
  };

  const web = body.web === true;
  let creditsBerechnet = 0;

  if (web) {
    const charge = await chargeForAiAction(auth.caller.userId, "alternativesWeb");
    if (!charge.ok) {
      return NextResponse.json(
        {
          error: {
            code: charge.reason === "no_credits" ? "insufficient_credits" : "no_access",
            message:
              charge.reason === "no_credits"
                ? `Zu wenig Guthaben: Web-Recherche kostet ${AI_ACTION_COSTS.alternativesWeb} Credits, Saldo ${charge.balance}.`
                : "Kein aktiver Zugang (Abo abgelaufen?).",
          },
        },
        { status: 402 },
      );
    }
    creditsBerechnet = charge.cost;
  }

  try {
    const ergebnis = web ? await searchAlternativesWeb(eingabe) : await searchAlternatives(eingabe);
    return NextResponse.json({ ...ergebnis, creditsBerechnet });
  } catch (e) {
    if (web) {
      // Fehlgeschlagener KI-Aufruf: Credits zurückbuchen — nie für nichts kassieren.
      await refundAiAction(auth.caller.userId, "alternativesWeb");
    }
    return NextResponse.json(
      {
        error: {
          code: "ai_failed",
          message: "Die KI-Suche ist fehlgeschlagen. Berechnete Credits wurden erstattet.",
        },
      },
      { status: 503 },
    );
  }
}
