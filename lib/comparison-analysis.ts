/**
 * Vergleichs-Analyse für ausgewählte Listings.
 *
 * Liefert strukturierte Bewertung:
 *   - perItem: Stärken/Schwächen pro Listing + Wirtschaftlichkeits-Score 1-5
 *   - bestFor:  Use-Case-basierte Empfehlungen
 *   - tradeoffs: kurze Gegenüberstellung
 *
 * Bezugsquelle:
 *   - Wenn ANTHROPIC_API_KEY gesetzt: Anthropic Claude (claude-haiku-4-5)
 *   - sonst: deterministischer heuristischer Fallback
 *
 * Cache: Result wird in DB (ComparisonAnalysis) abgelegt — Schlüssel
 * ist sha256 über die sortierten Listing-IDs.
 */
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Listing } from "@prisma/client";

export type ItemScore = {
  id: string;
  productName: string;
  manufacturer: string;
  strengths: string[];
  weaknesses: string[];
  valueScore: number; // 1-5
  valueReason: string;
};

export type BestForRecommendation = {
  useCase: string;
  recommendedListingId: string;
  reason: string;
};

export type AnalysisResult = {
  perItem: ItemScore[];
  bestFor: BestForRecommendation[];
  summary: string;
  source: "anthropic-claude" | "heuristic-fallback";
  model?: string;
  generatedAt: string;
};

function cacheKey(ids: string[]): string {
  const sorted = [...ids].sort();
  return crypto.createHash("sha256").update(sorted.join("|")).digest("hex").slice(0, 32);
}

export async function getCachedAnalysis(ids: string[]): Promise<AnalysisResult | null> {
  const key = cacheKey(ids);
  const row = await prisma.comparisonAnalysis.findUnique({ where: { cacheKey: key } });
  if (!row) return null;
  return row.result as unknown as AnalysisResult;
}

export async function analyzeListings(listings: Listing[]): Promise<AnalysisResult> {
  if (listings.length < 2) {
    throw new Error("Mindestens 2 Listings nötig für einen Vergleich.");
  }

  const ids = listings.map((l) => l.id);
  const key = cacheKey(ids);

  // 1. Cache hit?
  const existing = await prisma.comparisonAnalysis.findUnique({ where: { cacheKey: key } });
  if (existing) return existing.result as unknown as AnalysisResult;

  // 2. Versuche Anthropic, sonst Fallback
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  let result: AnalysisResult;
  let source: "anthropic-claude" | "heuristic-fallback";
  try {
    if (hasKey) {
      result = await analyzeWithAnthropic(listings);
      source = "anthropic-claude";
    } else {
      result = analyzeHeuristically(listings);
      source = "heuristic-fallback";
    }
  } catch (e) {
    console.warn("Anthropic-Analyse fehlgeschlagen, fallback auf Heuristik:", e);
    result = analyzeHeuristically(listings);
    source = "heuristic-fallback";
  }

  // 3. Cache schreiben
  await prisma.comparisonAnalysis.create({
    data: {
      cacheKey: key,
      scope: "listings",
      ids,
      result: result as unknown as object,
      source,
    },
  });

  return result;
}

// ============================================================================
// Anthropic-Pfad
// ============================================================================

async function analyzeWithAnthropic(listings: Listing[]): Promise<AnalysisResult> {
  // Lazy import — vermeidet Bundle-Bloat wenn key fehlt
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const dataBlock = listings
    .map((l, i) => {
      const fields: string[] = [
        `[${i + 1}] id=${l.id}`,
        `Hersteller: ${l.manufacturer}`,
        `Produkt: ${l.productName}`,
        `Typ: ${l.productType}`,
        l.isoViscosity ? `ISO VG: ${l.isoViscosity}` : "",
        `Chemie: ${l.chemistry}`,
        l.applicationArea ? `Anwendung: ${l.applicationArea}` : "",
        `Menge: ${l.quantity} ${l.quantityUnit}`,
        l.priceEur != null ? `Preis: ${l.priceEur} EUR` : "Preis: auf Anfrage",
        l.minOrderQty ? `Min. Abnahme: ${l.minOrderQty}` : "",
        l.certificates.length ? `Zertifikate: ${l.certificates.join(", ")}` : "",
        l.machiningOperations.length ? `Bearbeitungsverfahren: ${l.machiningOperations.join(", ")}` : "",
        l.mineralOilContent != null ? `Mineralöl-Anteil: ${l.mineralOilContent}%` : "",
        l.containsGlycol != null ? `Glykol: ${l.containsGlycol ? "ja" : "nein"}` : "",
        `Standort: ${l.locationRegion}`,
        `Versand: ${l.shippingTerms ?? "—"}`,
      ].filter(Boolean);
      return fields.join("\n");
    })
    .join("\n\n---\n\n");

  const systemPrompt = `Du bist ein erfahrener KSS-/Schmierstoff-Berater für einen B2B-Marketplace.
Analysiere die folgenden Marketplace-Listings und gib eine strukturierte Bewertung als JSON zurück.

Wichtig:
- Bewerte ehrlich und konkret. Keine Marketing-Floskeln.
- Wenn Daten fehlen, sage das.
- Wirtschaftlichkeits-Score 1-5: 1 = teuer/wenig sinnvoll, 5 = top Preis-Leistung.
- Use-Cases sind realistische Anwendungs-Szenarien (z.B. "CNC-Drehen Aluminium", "Industrielle Hydraulik mit Servoventilen").
- "recommendedListingId" muss exakt eine der gelieferten IDs sein.

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Schema:
{
  "perItem": [
    { "id": "string", "productName": "string", "manufacturer": "string",
      "strengths": ["max 3 Bullets"], "weaknesses": ["max 3 Bullets"],
      "valueScore": 1..5, "valueReason": "kurzer Satz" }
  ],
  "bestFor": [
    { "useCase": "string", "recommendedListingId": "string", "reason": "string" }
  ],
  "summary": "1-2 Sätze Gesamtfazit"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Hier sind ${listings.length} Listings, die ein Käufer vergleichen will:\n\n${dataBlock}\n\nLiefere die strukturierte Bewertung als JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Keine Text-Antwort von Claude.");
  }
  // Manche Modelle wickeln JSON in ```json ... ```
  const raw = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(raw) as {
    perItem: ItemScore[];
    bestFor: BestForRecommendation[];
    summary: string;
  };

  return {
    ...parsed,
    source: "anthropic-claude",
    model: response.model,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Heuristischer Fallback — ohne API-Call
// ============================================================================

function analyzeHeuristically(listings: Listing[]): AnalysisResult {
  const perItem: ItemScore[] = listings.map((l) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (l.certificates.length >= 3) strengths.push(`${l.certificates.length} Zertifikate/Freigaben hinterlegt`);
    else if (l.certificates.length === 0) weaknesses.push("Keine Zertifikate gelistet");

    if (l.priceEur != null) strengths.push(`Preis transparent: ${l.priceEur.toFixed(2)} €`);
    else weaknesses.push("Preis nur auf Anfrage");

    if (l.machiningOperations.length >= 3)
      strengths.push(`Breit einsetzbar (${l.machiningOperations.length} Verfahren)`);

    if (l.quantity >= 1000) strengths.push(`Große verfügbare Menge: ${l.quantity} ${l.quantityUnit}`);
    else if (l.quantity < 200) weaknesses.push(`Kleine Menge: nur ${l.quantity} ${l.quantityUnit}`);

    if (l.shippingTerms?.toLowerCase().includes("lieferung")) strengths.push("Lieferung möglich");
    else if (l.shippingTerms?.toLowerCase().includes("selbstabholung")) weaknesses.push("Nur Selbstabholung");

    if (l.minOrderQty && l.minOrderQty > l.quantity * 0.5)
      weaknesses.push(`Hohe Mindestabnahme: ${l.minOrderQty} ${l.quantityUnit}`);

    // Wirtschaftlichkeits-Score: einfacher Heuristik-Score
    let score = 3;
    if (l.priceEur != null) score += 1;
    if (l.certificates.length >= 2) score += 0.5;
    if (l.machiningOperations.length >= 3) score += 0.5;
    if (l.shippingTerms?.toLowerCase().includes("lieferung")) score += 0.5;
    if (l.priceEur == null) score -= 1;
    if (l.minOrderQty && l.minOrderQty > l.quantity * 0.5) score -= 0.5;
    const valueScore = Math.max(1, Math.min(5, Math.round(score)));

    let valueReason = "Bewertung anhand Datenvollständigkeit + Verfügbarkeit";
    if (l.priceEur == null) valueReason = "Preis auf Anfrage — Bewertung nur eingeschränkt möglich";
    else if (l.certificates.length >= 3 && l.priceEur != null)
      valueReason = "Vollständige Datenlage + Preis transparent";

    return {
      id: l.id,
      productName: l.productName,
      manufacturer: l.manufacturer,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      valueScore,
      valueReason,
    };
  });

  // Best-For: Heuristische Use-Cases aus den vorhandenen Daten
  const bestFor: BestForRecommendation[] = [];

  // Beste Wahl bei „Preis-Sensitivität"
  const cheapest = listings
    .filter((l) => l.priceEur != null)
    .sort((a, b) => (a.priceEur ?? 0) - (b.priceEur ?? 0))[0];
  if (cheapest) {
    bestFor.push({
      useCase: "Preis-sensitiver Einkauf",
      recommendedListingId: cheapest.id,
      reason: `Niedrigster transparenter Preis (${cheapest.priceEur?.toFixed(2)} €).`,
    });
  }

  // Beste Wahl bei „Höchste Zertifizierungs-Tiefe"
  const mostCerts = listings.reduce(
    (acc, l) => (l.certificates.length > (acc?.certificates.length ?? 0) ? l : acc),
    null as Listing | null,
  );
  if (mostCerts && mostCerts.certificates.length > 0) {
    bestFor.push({
      useCase: "Anwendung mit Norm-/OEM-Pflicht",
      recommendedListingId: mostCerts.id,
      reason: `${mostCerts.certificates.length} dokumentierte Zertifikate/Freigaben (${mostCerts.certificates.slice(0, 3).join(", ")}).`,
    });
  }

  // Beste Wahl bei „Große Abnahmemenge"
  const largest = listings.reduce(
    (acc, l) => (l.quantity > (acc?.quantity ?? 0) ? l : acc),
    null as Listing | null,
  );
  if (largest && listings.length > 1) {
    bestFor.push({
      useCase: "Großbedarf / Produktionsversorgung",
      recommendedListingId: largest.id,
      reason: `Größtes verfügbares Volumen: ${largest.quantity} ${largest.quantityUnit}.`,
    });
  }

  const summary =
    listings.length === 2
      ? "Direktvergleich von 2 Listings. Refraktometerfaktor, Wasserhärte und Datenblatt-Details bitte direkt beim Hersteller verifizieren."
      : `Querschnitt aus ${listings.length} Listings. Die Bewertung ist heuristisch und ersetzt keine technische Freigabe.`;

  return {
    perItem,
    bestFor,
    summary,
    source: "heuristic-fallback",
    generatedAt: new Date().toISOString(),
  };
}
