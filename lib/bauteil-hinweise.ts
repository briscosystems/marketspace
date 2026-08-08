/**
 * Übersetzt die Werkstoff-Verträglichkeit in die Sprache der Werkstatt.
 *
 * Warum: Die Matrix arbeitet auf Werkstoffebene („besser meiden: EPDM, FKM,
 * PA6, POM, PUR"). Fachlich richtig — aber kein Instandhalter weiß, welches
 * Elastomer in seinem Abstreifer steckt. Er weiß, dass er Abstreifer hat.
 * Diese Zuordnung sagt deshalb zusätzlich, WO der Werkstoff in der Maschine
 * sitzt. Die Werkstoffangaben selbst bleiben unverändert stehen (Betreiber-
 * Entscheidung 2026-08-07) — das hier kommt obendrauf, nicht an ihre Stelle.
 *
 * Belege für die Zuordnung Werkstoff → Bauteil:
 *  - INDEX-Werke, „Hinweise zu Arbeitsstoffen" (DAA008DE, Stand 07/2025):
 *    „Kühlschmierstoffe dürfen Dichtungen oder Abstreifer aus Werkstoffen wie
 *    Nitrilkautschuk (NBR), Polyurethan (PUR) und Fluorelastomere (FKM) nicht
 *    beschädigen."
 *  - VDI 3035 Blatt 2 (2/2024): normiert die Materialauswahl zwischen Maschine
 *    und Bearbeitungsmedium.
 *  - Faltenbalg-/Abstreiferhersteller (Hennig, Arno Arnold): PUR, NBR, PVC.
 *  - igus: Schleppketten aus Polyamid-Compounds.
 *  - GMN: Spindel-Labyrinthe aus POM (Kunststoffvariante).
 *
 * Bewusst NICHT enthalten: Kupplungen, Bremsen, Reibbeläge und Späneförderer.
 * Für Schäden an diesen Bauteilen durch Kühlschmierstoffe wurde in der
 * Recherche vom 2026-08-07 KEIN belastbarer Beleg gefunden — lieber eine
 * Lücke als eine erfundene Warnung.
 */

export type BauteilHinweis = {
  /** Wo der Werkstoff in der Maschine sitzt — in Werkstattsprache. */
  bauteile: string[];
  /** Zusatz, wenn der Werkstoff eine bekannte Eigenheit hat. */
  eigenheit?: string;
};

/**
 * Werkstoff-Kurzname (wie in der Materialtabelle) → Bauteile.
 * Der Abgleich läuft über den Slug bzw. den Kurznamen, damit Umbenennungen
 * in der Anzeige nichts kaputt machen.
 */
export const BAUTEILE_JE_WERKSTOFF: Record<string, BauteilHinweis> = {
  nbr: {
    bauteile: ["Dichtungen", "Wellendichtringe", "Schläuche", "Abstreifer"],
    eigenheit: "der häufigste Dichtungswerkstoff im Maschinenbau",
  },
  hnbr: { bauteile: ["Dichtungen (höher belastet)", "Schläuche"] },
  epdm: {
    bauteile: ["Dichtungen", "Schläuche"],
    eigenheit: "quillt in Öl — sitzt deshalb selten dort, wo Öl anliegt",
  },
  fkm: { bauteile: ["Dichtungen", "Wellendichtringe (heiß laufende Stellen)"] },
  "fkm-peroxide": { bauteile: ["Dichtungen in aggressiver Umgebung"] },
  ffkm: { bauteile: ["Dichtungen in kritischen Anwendungen"] },
  "silicone-vmq": { bauteile: ["Dichtungen", "Kabeldurchführungen"] },
  fvmq: { bauteile: ["Dichtungen in Kraftstoff-/Ölkontakt"] },
  polyurethane: {
    bauteile: ["Abstreifer an Führungen", "Faltenbälge", "Schläuche"],
    eigenheit: "empfindlich gegen Hydrolyse — Standard-PUR nur bis etwa 50 °C in Wasser",
  },
  ptfe: { bauteile: ["Dichtungen", "Gleitringe", "Auskleidungen"] },
  pa6: {
    bauteile: ["Schleppketten", "Kabelbinder", "Führungsteile"],
    eigenheit: "nimmt Wasser auf und quillt dabei",
  },
  pom: {
    bauteile: ["Führungsteile", "Spindel-Labyrinthe (Kunststoffausführung)", "Rollen"],
  },
  pp: { bauteile: ["Behälter", "Leitungen", "Filtergehäuse"] },
  "pe-hd": { bauteile: ["Behälter", "Leitungen", "Auffangwannen"] },
};

/**
 * Findet die Bauteil-Zuordnung zu einem Werkstoff. Sucht über Slug und
 * Kurzname, damit auch „FKM/Viton" oder „PE-HD" greifen.
 */
export function bauteileFuer(slug: string, kurzName?: string): BauteilHinweis | null {
  const kandidaten = [slug, kurzName ?? ""]
    .map((s) => s.toLowerCase().trim())
    .flatMap((s) => [s, s.split("/")[0], s.replace(/[^a-z0-9-]/g, "")]);
  for (const k of kandidaten) {
    if (k && BAUTEILE_JE_WERKSTOFF[k]) return BAUTEILE_JE_WERKSTOFF[k];
  }
  return null;
}

/**
 * Hinweise, die für JEDEN wassermischbaren Kühlschmierstoff gelten — unabhängig
 * vom einzelnen Produkt. Sie stehen deshalb nicht in der Verträglichkeitsmatrix
 * (die vergleicht Produkt gegen Werkstoff), gehören aber genau hierher, weil
 * sie im Betrieb die teuersten Schäden verursachen.
 */
export type AllgemeinerBauteilHinweis = {
  schluessel: string;
  /** Wie schwer wiegt der Hinweis. */
  stufe: "sicherheit" | "achtung";
};

export const ALLGEMEINE_HINWEISE: AllgemeinerBauteilHinweis[] = [
  // DGUV/BGHM FBHM-040: Polycarbonat „ist empfindlich gegen Kühlschmierstoffe
  // und kann unter deren Einfluss verspröden" — die Versprödung ist unsichtbar.
  // VDW: Austausch ungeschützt nach 2, geschützt nach 12 Jahren. Zahlen zum
  // Rückhaltevermögen: −40 % nach 9 Monaten, 20 % nach 10 Jahren (ungeschützt).
  { schluessel: "bt.sichtscheibe", stufe: "sicherheit" },
  // FUCHS: verzinkte Leitungen und Behälter sind für wassermischbare
  // Konzentrate ungeeignet; Beschichtungen im Tank werden angegriffen.
  { schluessel: "bt.zink", stufe: "achtung" },
];

/**
 * Gilt der Sichtscheiben-Hinweis für dieses Produkt? Nur bei wassermischbaren
 * Kühlschmierstoffen — reine Schneidöle stehen in den Quellen nicht.
 */
export function zeigeAllgemeineHinweise(category: string | null | undefined): boolean {
  return category === "COOLANT_WATER_MIX";
}
