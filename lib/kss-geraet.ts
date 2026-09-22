/**
 * Gemeinsame Auswahl und Aufbereitung der KSS-Daten für Geräte (eMix1500).
 *
 * Bewusst knapp gehalten: Ein Mischer braucht den Umrechnungsfaktor, das
 * Sollfenster und die Wasser-Vorgaben — keine Beschreibungstexte.
 */
export const GERAET_AUSWAHL = {
  id: true,
  name: true,
  slug: true,
  category: true,
  chemistry: true,
  refractometerFactor: true,
  recommendedConcentrationMin: true,
  recommendedConcentrationMax: true,
  phConcentrate: true,
  phEmulsionMin: true,
  phEmulsionMax: true,
  waterHardnessMinDh: true,
  waterHardnessMaxDh: true,
  waterHardnessNotes: true,
  containsBor: true,
  containsFormaldehydeDepot: true,
  sourceConfidence: true,
  dataSheetUrl: true,
  manufacturer: { select: { id: true, name: true, slug: true } },
} as const;

type RohProdukt = {
  id: string;
  name: string;
  slug: string;
  category: string;
  chemistry: string | null;
  refractometerFactor: number | null;
  recommendedConcentrationMin: number | null;
  recommendedConcentrationMax: number | null;
  phConcentrate: number | null;
  phEmulsionMin: number | null;
  phEmulsionMax: number | null;
  waterHardnessMinDh: number | null;
  waterHardnessMaxDh: number | null;
  waterHardnessNotes: string | null;
  containsBor: boolean | null;
  containsFormaldehydeDepot: boolean | null;
  sourceConfidence: string | null;
  dataSheetUrl: string | null;
  manufacturer: { id: string; name: string; slug: string };
};

/**
 * Antwortform für das Gerät.
 *
 * WICHTIG: Fehlt der Refraktometer-Faktor, steht dort `null` und
 * `faktorVorhanden: false` — NIEMALS ein angenommener Wert wie 1,0. Ein
 * falscher Faktor führt direkt zu einer falsch angesetzten Emulsion
 * (Korrosion bei zu mager, Hautreizungen und Kosten bei zu fett).
 */
export function fuerGeraet(p: RohProdukt) {
  return {
    id: p.id,
    name: p.name,
    hersteller: p.manufacturer.name,
    herstellerId: p.manufacturer.id,
    kategorie: p.category,
    chemie: p.chemistry,

    // Das Kernstück für den Mischer
    refraktometerFaktor: p.refractometerFactor,
    faktorVorhanden: p.refractometerFactor != null,

    sollKonzentrationMin: p.recommendedConcentrationMin,
    sollKonzentrationMax: p.recommendedConcentrationMax,

    phKonzentrat: p.phConcentrate,
    phEmulsionMin: p.phEmulsionMin,
    phEmulsionMax: p.phEmulsionMax,

    wasserhaerteMinDh: p.waterHardnessMinDh,
    wasserhaerteMaxDh: p.waterHardnessMaxDh,
    wasserhaerteHinweis: p.waterHardnessNotes,

    enthaeltBor: p.containsBor,
    enthaeltFormaldehydDepot: p.containsFormaldehydeDepot,

    datenblattUrl: p.dataSheetUrl,
    produktseite: `https://markt.brisco.ch/products/${p.manufacturer.slug}/${p.slug}`,
    datenherkunft: p.sourceConfidence,
  };
}

/** Kategorien, die für einen Mischer überhaupt in Frage kommen. */
export const MISCHBARE_KATEGORIEN = ["COOLANT_WATER_MIX"] as const;
