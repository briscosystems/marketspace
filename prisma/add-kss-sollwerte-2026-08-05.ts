/**
 * Pflege-Sollwerte für wassermischbare Kühlschmierstoffe — Daten-Sprint 2026-08-05.
 *
 * Warum: Die Wissensbasis konnte bisher nur bei der AUSWAHL eines KSS helfen.
 * Für die PFLEGE im Betrieb (CoolantGuide-Richtung) fehlten die Sollwerte fast
 * vollständig: Refraktometer-Faktor (25 von 137), empfohlene Konzentration (3),
 * pH-Bereich (1), Wasserhärte (10), Standzeit (0). Dieser Durchgang füllt die
 * Lücken aus offiziellen Herstellerangaben.
 *
 * Datenherkunft: Web-Recherche auf Hersteller-TDS/Produktseiten (2026-08-05),
 * 8 parallele Recherche-Läufe, ein Beleg-Link je Produkt steht als "quelle" in
 * der Datendatei. Nicht belegbare Werte sind bewusst null geblieben — es wird
 * NICHTS geschätzt oder von ähnlichen Produkten übertragen.
 *
 * Die Daten liegen als JSON daneben (data/kss-sollwerte-2026-08-05.json) — so
 * ist jede Zeile prüfbar, ohne durch TypeScript zu waten.
 *
 * IDEMPOTENT: Es werden nur Felder gefüllt, die aktuell NULL sind. Bereits
 * vorhandene Werte (z. B. aus dem SDS-Import oder von Hand gepflegt) werden
 * NIE überschrieben. Ein zweiter Lauf ändert nichts mehr.
 */
import { prisma } from "../lib/prisma";
import SOLLWERTE_JSON from "./data/kss-sollwerte-2026-08-05.json";

type Sollwerte = {
  productId: string;
  hersteller: string;
  name: string;
  refr: number | null;
  konzMin: number | null;
  konzMax: number | null;
  phKonz: number | null;
  phMin: number | null;
  phMax: number | null;
  dhMin: number | null;
  dhMax: number | null;
  dhNotiz: string | null;
  standzeitWo: number | null;
  quelle: string | null;
  bemerkung: string | null;
};

export async function applyKssSollwerte2026_08_05(): Promise<string> {
  const eintraege = SOLLWERTE_JSON as Sollwerte[];
  let geaendert = 0;
  let fehlend = 0;

  for (const e of eintraege) {
    const p = await prisma.product.findUnique({
      where: { id: e.productId },
      select: {
        id: true,
        refractometerFactor: true,
        recommendedConcentrationMin: true,
        recommendedConcentrationMax: true,
        phConcentrate: true,
        phEmulsionMin: true,
        phEmulsionMax: true,
        waterHardnessMinDh: true,
        waterHardnessMaxDh: true,
        waterHardnessNotes: true,
        typicalSumpLifeWeeks: true,
      },
    });
    if (!p) {
      // Produkt existiert auf LIVE (noch) nicht — kein Fehler, nur zählen.
      fehlend++;
      continue;
    }

    const data: Record<string, number | string> = {};
    if (p.refractometerFactor == null && e.refr != null) data.refractometerFactor = e.refr;
    if (p.recommendedConcentrationMin == null && e.konzMin != null) data.recommendedConcentrationMin = e.konzMin;
    if (p.recommendedConcentrationMax == null && e.konzMax != null) data.recommendedConcentrationMax = e.konzMax;
    if (p.phConcentrate == null && e.phKonz != null) data.phConcentrate = e.phKonz;
    if (p.phEmulsionMin == null && e.phMin != null) data.phEmulsionMin = e.phMin;
    if (p.phEmulsionMax == null && e.phMax != null) data.phEmulsionMax = e.phMax;
    if (p.waterHardnessMinDh == null && e.dhMin != null) data.waterHardnessMinDh = e.dhMin;
    if (p.waterHardnessMaxDh == null && e.dhMax != null) data.waterHardnessMaxDh = e.dhMax;
    if (p.waterHardnessNotes == null && e.dhNotiz) data.waterHardnessNotes = e.dhNotiz;
    if (p.typicalSumpLifeWeeks == null && e.standzeitWo != null) data.typicalSumpLifeWeeks = e.standzeitWo;

    if (Object.keys(data).length === 0) continue;
    await prisma.product.update({ where: { id: p.id }, data });
    geaendert++;
  }

  return geaendert
    ? `${geaendert} Produkt(e) mit Sollwerten ergänzt${fehlend ? `, ${fehlend} nicht gefunden` : ""}`
    : `nichts zu tun (bereits eingespielt${fehlend ? `, ${fehlend} nicht gefunden` : ""})`;
}
