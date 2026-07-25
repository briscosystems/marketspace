// POST /api/kss-wizard
//
// Nimmt Wizard-Antworten + (optional) currentProductId entgegen und liefert
// strukturierte KSS-Alternativ-Empfehlungen aus dem eigenen Katalog.
//
// Modell-Pfad:
//   - Wenn ANTHROPIC_API_KEY gesetzt: Claude wählt + begründet
//   - sonst: heuristischer Fallback (Filterung nach den Wizard-Kriterien)
//
// Antwort: { recommendations: [...], summary: "...", source: "..." }

import { NextResponse } from "next/server";
import { createAnthropic, clampText, AI_LIMITS, aiTemporarilyDisabled, noteAiSuccess, noteAiFailure } from "@/lib/ai-client";
import { recordAiUsage } from "@/lib/ai-usage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recommendMaterialsForProduct } from "@/lib/seal-recommendations";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";
import { sponsoredManufacturerIds } from "@/lib/storefront";

type WizardAnswers = {
  satisfied?: boolean | null;
  currentProductId?: string | null;
  problemDescription?: string;
  applicationAreas?: string[];
  materials?: string[];
  productionType?: "CONTRACT_MANUFACTURING" | "SERIAL_PRODUCTION" | "MIXED" | null;
  concentrateForm?: "CONVENTIONAL_EMULSION" | "SEMI_SYNTHETIC" | "FULL_SYNTHETIC" | "TWO_COMPONENT" | null;
  criticalIssues?: string[];
  certifications?: string[];
  waterHardness?: number | null;
  unsureDimensions?: string[];
  /** Kompakte Zusammenfassung eines hochgeladenen SDB (aus /api/sds/parse). */
  uploadedSds?: string | null;
};

type Recommendation = {
  productId: string;
  productSlug: string;
  manufacturerSlug: string;
  productName: string;
  manufacturer: string;
  reason: string;
  matchScore: number; // 0-100
  sealWarning?: string;
  // true = Hersteller mit aktiver Marke-Stufe (gesponsert). MUSS in der UI
  // klar gekennzeichnet werden (P2B-VO 2019/1150, Art. 5).
  sponsored?: boolean;
};

export async function POST(req: Request) {
  const body = (await req.json()) as WizardAnswers;

  // 1) Aktuellen Referenz-KSS laden (falls gewählt)
  const currentProduct = body.currentProductId
    ? await prisma.product.findUnique({
        where: { id: body.currentProductId },
        select: {
          id: true,
          name: true,
          manufacturer: { select: { name: true } },
          chemistry: true,
          concentrateForm: true,
          criticalIssuesAddressed: true,
        },
      })
    : null;

  // 2) Kandidaten-Pool: alle KSS-Produkte, optional vorgefiltert
  const candidatePool = await prisma.product.findMany({
    where: {
      category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
      ...(body.currentProductId && { NOT: { id: body.currentProductId } }),
    },
    include: { manufacturer: { select: { name: true, slug: true } } },
  });

  // Gesponserte Hersteller (aktive Marke-Stufe) — leichte Höhergewichtung,
  // in der Ausgabe klar gekennzeichnet (P2B-VO).
  const sponsoredIds = await sponsoredManufacturerIds();

  // 3) Heuristisches Pre-Scoring (verkleinert Pool für Anthropic-Pfad)
  const scored = candidatePool.map((p) => {
    let score = 50;
    const reasons: string[] = [];
    const isSponsored = sponsoredIds.has(p.manufacturerId);
    if (isSponsored) score += 8; // moderater, gekennzeichneter Sponsoring-Boost

    if (body.applicationAreas?.length) {
      const overlap = p.applicationAreas.filter((a) => body.applicationAreas!.includes(a));
      if (overlap.length > 0) {
        score += overlap.length * 5;
        reasons.push(`Deckt Bearbeitungsverfahren ab: ${overlap.join(", ")}`);
      } else {
        score -= 10;
      }
    }
    if (body.materials?.length) {
      const overlap = p.suitableMaterials.filter((m) => body.materials!.includes(m));
      if (overlap.length > 0) {
        score += overlap.length * 5;
        reasons.push(`Geeignet für ${overlap.join(", ")}`);
      } else {
        score -= 15;
      }
    }
    if (body.productionType && p.productionType === body.productionType) {
      score += 10;
      reasons.push(`Passt zur Produktionsart`);
    }
    if (body.concentrateForm && p.concentrateForm === body.concentrateForm) {
      score += 15;
      reasons.push(`Form entspricht Vorgabe`);
    }
    if (body.criticalIssues?.length) {
      const addressed = p.criticalIssuesAddressed.filter((c) => body.criticalIssues!.includes(c));
      if (addressed.length > 0) {
        score += addressed.length * 7;
        reasons.push(`Adressiert ${addressed.length} kritische Punkte: ${addressed.join(", ")}`);
      }
    }
    if (body.certifications?.length) {
      const overlap = p.certifications.filter((c) =>
        body.certifications!.some((bc) => c.includes(bc) || bc.includes(c)),
      );
      if (overlap.length > 0) {
        score += overlap.length * 8;
        reasons.push(`Hat geforderte Zertifizierungen`);
      }
    }
    return { product: p, score, reasons, sponsored: isSponsored };
  });

  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, 12); // begrenzte Auswahl

  // 4) Mit oder ohne Anthropic strukturieren.
  // KI-Analyse kostet 1 Credit — ohne Credits/Zugang läuft die Heuristik.
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  let recommendations: Recommendation[];
  let summary: string;
  let source: "anthropic-claude" | "heuristic-fallback";
  let creditNotice: string | null = null;
  let aiAllowed = false;
  const session = await getServerSession(authOptions);

  // Der Nutzer soll IMMER den echten Grund sehen, warum die Heuristik lief
  // (creditNotice wird in beiden UIs angezeigt) — keine irreführende Key-Meldung.
  if (topCandidates.length > 0) {
    if (!hasKey) {
      creditNotice =
        "KI-Begründung nicht verfügbar: Auf dem Server ist kein ANTHROPIC_API_KEY hinterlegt — heuristische Auswahl gezeigt.";
    } else if (aiTemporarilyDisabled()) {
      creditNotice =
        "KI kurz pausiert (mehrere Fehler in Folge) — heuristische Auswahl gezeigt. Gleich erneut versuchen.";
    } else if (session?.user?.id) {
      const charge = await chargeForAiAction(session.user.id, "kssWizard");
      if (charge.ok) {
        aiAllowed = true;
      } else if (charge.reason === "no_credits") {
        creditNotice =
          "Credit-Guthaben aufgebraucht — heuristische Auswahl gezeigt. Credits gibt es unter „Mitgliedschaft“.";
      } else {
        creditNotice =
          "Kennenlernphase abgelaufen und kein aktives Abo — heuristische Auswahl gezeigt.";
      }
    } else {
      creditNotice = "Für die KI-Begründung bitte anmelden — heuristische Auswahl gezeigt.";
    }
  }

  if (hasKey && topCandidates.length > 0 && aiAllowed) {
    try {
      const claude = await callAnthropic({
        wizardAnswers: body,
        currentProduct,
        candidates: topCandidates.map((c) => ({
          id: c.product.id,
          name: c.product.name,
          manufacturer: c.product.manufacturer.name,
          chemistry: c.product.chemistry,
          concentrateForm: c.product.concentrateForm,
          applicationAreas: c.product.applicationAreas,
          suitableMaterials: c.product.suitableMaterials,
          criticalIssuesAddressed: c.product.criticalIssuesAddressed,
          certifications: c.product.certifications,
          containsBor: c.product.containsBor,
          containsFormaldehydeDepot: c.product.containsFormaldehydeDepot,
          containsMineralOil: c.product.containsMineralOil,
          preScore: c.score,
          heuristicReasons: c.reasons,
        })),
      });
      // Map zurück auf vollständige Produkt-Daten
      recommendations = await Promise.all(
        claude.recommendations.slice(0, 3).map(async (r) => {
          const cand = topCandidates.find((c) => c.product.id === r.productId);
          const prod = cand?.product;
          if (!prod) return null;
          const sealRec = await computeSealWarning(prod);
          return {
            productId: prod.id,
            productSlug: prod.slug,
            manufacturerSlug: prod.manufacturer.slug,
            productName: prod.name,
            manufacturer: prod.manufacturer.name,
            reason: r.reason,
            matchScore: r.matchScore ?? 0,
            sealWarning: sealRec ?? undefined,
            sponsored: cand?.sponsored ?? false,
          };
        }),
      ).then((arr) => arr.filter(Boolean) as Recommendation[]);
      summary = claude.summary;
      source = "anthropic-claude";
      noteAiSuccess();
    } catch (e) {
      noteAiFailure();
      console.warn("Anthropic-Call failed, fallback:", e);
      if (session?.user?.id) {
        await refundAiAction(session.user.id, "kssWizard");
        creditNotice = "KI vorübergehend nicht verfügbar — dein Credit wurde erstattet.";
      }
      ({ recommendations, summary } = await heuristicFallback(topCandidates));
      source = "heuristic-fallback";
    }
  } else {
    ({ recommendations, summary } = await heuristicFallback(topCandidates));
    source = "heuristic-fallback";
  }

  return NextResponse.json({
    recommendations,
    summary,
    source,
    creditNotice,
    candidatePoolSize: candidatePool.length,
    consideredTop: topCandidates.length,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
async function computeSealWarning(product: {
  category: string;
  chemistry: string | null;
  containsBor: boolean | null;
  containsFormaldehydeDepot: boolean | null;
  containsMineralOil: boolean | null;
  containsChlorine: boolean | null;
}): Promise<string | null> {
  try {
    const { recommendations } = await recommendMaterialsForProduct({
      category: product.category as Parameters<typeof recommendMaterialsForProduct>[0]["category"],
      chemistry: product.chemistry as Parameters<typeof recommendMaterialsForProduct>[0]["chemistry"],
      containsBor: product.containsBor,
      containsFormaldehydeDepot: product.containsFormaldehydeDepot,
      containsMineralOil: product.containsMineralOil,
      containsChlorine: product.containsChlorine,
    });
    // Positiv formulierte Auswahlhilfe: das Produkt wird ja EMPFOHLEN — der
    // Hinweis sagt, welche Dichtungswerkstoffe beim Umstieg passen und welche
    // nicht. Die Matrix ist eine Worst-Case-Abschätzung aus typischen
    // Inhaltsstoff-Klassen, keine Aussage über die konkrete Rezeptur.
    const suitable = recommendations
      .filter((r) => r.worstRating === "RECOMMENDED" || r.worstRating === "COMPATIBLE")
      .map((r) => r.materialShortName);
    const unsuitable = recommendations.filter((r) => r.worstRating === "UNSUITABLE").map((r) => r.materialShortName);
    const caution = recommendations.filter((r) => r.worstRating === "CAUTION").map((r) => r.materialShortName);
    const parts: string[] = [];
    if (suitable.length > 0) parts.push(`Geeignete Dichtungswerkstoffe: ${suitable.slice(0, 5).join(", ")}`);
    if (caution.length > 0) parts.push(`mit Vorsicht: ${caution.join(", ")}`);
    if (unsuitable.length > 0) parts.push(`besser meiden: ${unsuitable.join(", ")}`);
    if (parts.length === 0) return null;
    return `${parts.join(" · ")} (Worst-Case-Abschätzung nach typischen Inhaltsstoffen — Herstellerfreigabe maßgeblich)`;
  } catch (e) {
    console.warn("Seal warning failed:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function heuristicFallback(
  topCandidates: { product: { id: string; name: string; slug: string; manufacturer: { name: string; slug: string }; category: string; chemistry: string | null; containsBor: boolean | null; containsFormaldehydeDepot: boolean | null; containsMineralOil: boolean | null; containsChlorine: boolean | null }; score: number; reasons: string[]; sponsored?: boolean }[],
): Promise<{ recommendations: Recommendation[]; summary: string }> {
  const top3 = topCandidates.slice(0, 3);
  const recs: Recommendation[] = await Promise.all(
    top3.map(async (c) => ({
      productId: c.product.id,
      productSlug: c.product.slug,
      manufacturerSlug: c.product.manufacturer.slug,
      productName: c.product.name,
      manufacturer: c.product.manufacturer.name,
      reason: c.reasons.length > 0 ? c.reasons.join(" · ") : "Allgemeine Eignung — bitte Datenblatt prüfen",
      matchScore: Math.min(100, c.score),
      sealWarning: (await computeSealWarning(c.product)) ?? undefined,
      sponsored: c.sponsored ?? false,
    })),
  );
  return {
    recommendations: recs,
    summary: `${top3.length} Vorschläge aus heuristischer Filterung.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
async function callAnthropic(args: {
  wizardAnswers: WizardAnswers;
  currentProduct: { name: string; manufacturer: { name: string }; chemistry: string | null; concentrateForm: string | null; criticalIssuesAddressed: string[] } | null;
  candidates: {
    id: string;
    name: string;
    manufacturer: string;
    chemistry: string | null;
    concentrateForm: string | null;
    applicationAreas: string[];
    suitableMaterials: string[];
    criticalIssuesAddressed: string[];
    certifications: string[];
    containsBor: boolean | null;
    containsFormaldehydeDepot: boolean | null;
    containsMineralOil: boolean | null;
    preScore: number;
    heuristicReasons: string[];
  }[];
}): Promise<{
  recommendations: { productId: string; reason: string; matchScore: number }[];
  summary: string;
}> {
  const client = createAnthropic();

  const candidateBlock = args.candidates
    .map(
      (c, i) =>
        `[${i + 1}] id=${c.id}
Produkt: ${c.manufacturer} · ${c.name}
Chemie: ${c.chemistry ?? "?"} | Form: ${c.concentrateForm ?? "?"}
Anwendung: ${c.applicationAreas.join(", ") || "?"}
Werkstoffe: ${c.suitableMaterials.join(", ") || "?"}
Adressierte Probleme: ${c.criticalIssuesAddressed.join(", ") || "—"}
Zertifizierungen: ${c.certifications.join(", ") || "—"}
Inhaltsstoffe: ${[
          c.containsBor === true ? "Bor" : "",
          c.containsFormaldehydeDepot === true ? "Formaldehyd-Donor" : "",
          c.containsMineralOil === true ? "Mineralöl" : "",
          c.containsBor === false ? "borfrei" : "",
        ].filter(Boolean).join(", ") || "?"}
Heuristik-Score: ${c.preScore} (${c.heuristicReasons.join("; ")})`,
    )
    .join("\n\n---\n\n");

  const wizardBlock = JSON.stringify(
    {
      zufriedenMitAktuell: args.wizardAnswers.satisfied,
      aktuelleProduktBeschreibung: args.currentProduct
        ? `${args.currentProduct.manufacturer.name} · ${args.currentProduct.name} (Chemie: ${args.currentProduct.chemistry}, Form: ${args.currentProduct.concentrateForm}, adressiert: ${args.currentProduct.criticalIssuesAddressed.join(", ")})`
        : null,
      problembeschreibung: clampText(args.wizardAnswers.problemDescription, AI_LIMITS.freetext) || null,
      sicherheitsdatenblattAktuellesProdukt:
        clampText(args.wizardAnswers.uploadedSds, AI_LIMITS.sdsText) || null,
      bearbeitungsverfahren: args.wizardAnswers.applicationAreas,
      werkstoffe: args.wizardAnswers.materials,
      produktionsart: args.wizardAnswers.productionType,
      kssForm: args.wizardAnswers.concentrateForm,
      kritischePunkte: args.wizardAnswers.criticalIssues,
      zertifizierungen: args.wizardAnswers.certifications,
      wasserhärteDH: args.wizardAnswers.waterHardness,
      unsichereAngaben: args.wizardAnswers.unsureDimensions,
    },
    null,
    2,
  );

  const systemPrompt = `Du bist ein erfahrener KSS-Berater (Kühlschmierstoffe für Metallbearbeitung).
Der Anwender hat einen Wizard ausgefüllt und sucht eine KSS-Alternative.

Wähle aus den ${args.candidates.length} Kandidaten die TOP 3 aus, die am besten zur Anforderung passen.
Berücksichtige dabei:
- Bearbeitungsverfahren und Werkstoffe (Material-Kompatibilität entscheidend)
- KSS-Form (Emulsion/Semi/Full-Synth/2K)
- Kritische Praxis-Probleme (Verkeimung, Schaum, Hautirritation, Werkzeugstandzeit)
- Erforderliche Zertifizierungen
- Wenn aktueller KSS bekannt: schlage NICHT denselben vor, sondern echte Alternativen
- Wenn Problembeschreibung Hinweise enthält (z.B. "stinkt schon nach 2 Wochen"), priorisiere Produkte mit passenden adressierten Problemen

WICHTIG — Freitext "problembeschreibung" KRITISCH analysieren:
- Zerlege die Schilderung in die wahrscheinlichen technischen Ursachen (z.B. "kippt nach 3 Wochen" → Bakterien-/Pilzbefall, zu niedrige Konzentration, Tramp-Oil-Eintrag).
- Sei ehrlich: wenn die Beschreibung NICHT eindeutig auf ein KSS-Problem zeigt (z.B. eigentlich ein Anlagen- oder Pflegeproblem), sag das im summary klar — kein Schönreden, die Plattform bleibt neutral.
- Stehen Dimensionen in "unsichereAngaben" (der Anwender weiß es nicht), gewichte sie schwächer und wähle eher universell einsetzbare Produkte; weise im summary darauf hin, was zu klären wäre.

WENN das Feld "sicherheitsdatenblattAktuellesProdukt" gefüllt ist:
- Berücksichtige dessen Einstufung (H-Sätze) und Inhaltsstoffe (z. B. Borsäure, Formaldehyd-Abspalter, sekundäre Amine, Chlorparaffine, SVHC).
- Bevorzuge Alternativen, die die kritischen Stoffe des aktuellen Produkts VERMEIDEN, und weise im summary konkret darauf hin (z. B. „Ihr aktuelles Produkt enthält freie Borsäure — die Vorschläge sind borfrei.").

Antworte AUSSCHLIESSLICH mit gültigem JSON:
{
  "recommendations": [
    { "productId": "string aus Kandidaten-IDs", "reason": "2-3 Sätze klare Begründung in Deutsch", "matchScore": 0..100 }
  ],
  "summary": "2-4 Sätze: zuerst kritische Einschätzung der geschilderten Probleme, dann Fazit der Auswahl"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Wizard-Antworten:\n\`\`\`json\n${wizardBlock}\n\`\`\`\n\nKandidaten:\n\n${candidateBlock}\n\nGib die Top 3 als JSON zurück.`,
      },
    ],
  });

  recordAiUsage("kss_wizard", response.model, response.usage);

  // JSON aus der Antwort extrahieren
  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  // Versuche, das erste valide JSON zu extrahieren
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned no JSON");
  return JSON.parse(jsonMatch[0]);
}
