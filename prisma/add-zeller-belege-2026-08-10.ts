/**
 * Belege für bestehende Zeller+Gmelin-Produkte nachtragen — 2026-08-10.
 *
 * Warum: 15 Produkte (Multicut, Multidraw, Divinol) standen ohne technisches
 * Datenblatt oder ohne Sicherheitsdatenblatt im Katalog.
 *
 * Quellenlage: Zeller+Gmelin stellt NICHTS öffentlich bereit — jede
 * Produktseite zeigt nur „Bitte melden Sie sich an, um die Downloads einsehen
 * zu können". Die Original-PDFs stammen deshalb aus zwei Händler-Spiegeln, die
 * sie unter der Zeller-Artikelnummer ablegen:
 *   - oel-engel.de: deutsche Originale (Stände 2019–2024), nur Divinol-Linie
 *   - nugentek.cafe24.com (koreanischer Distributor): englische Originale
 *     (2012–2018), einzige Quelle für Multicut und Multidraw
 * Die Artikelnummer ist der Schlüssel zu beiden Spiegeln und steht deshalb in
 * der Datendatei — damit lässt sich künftig gezielt nachschlagen.
 *
 * Eine Namenskorrektur: „Divinol Multicor LF 30" heißt beim Hersteller schlicht
 * „Multicor LF 30" (so steht es auf TDS und SDS); nur Händler setzen „Divinol"
 * davor.
 *
 * Kennwerte wurden NICHT stillschweigend umgerechnet: Wo das Datenblatt die
 * Viskosität nur bei 20 °C nennt (B Classic, Multicor LF 30) oder die Angabe
 * die Grundölviskosität eines Fetts ist (Fett EP 2), bleibt das Feld leer.
 *
 * IDEMPOTENT: Füllt nur leere Felder, überschreibt nie vorhandene Werte.
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import BELEGE_JSON from "./data/zeller-belege-2026-08-10.json";

type Beleg = {
  name: string;
  existiert: boolean;
  korrektName: string | null;
  tdsUrl: string | null;
  sdsUrl: string | null;
  beschreibung: string | null;
  viskositaetIso: string | number | null;
  viskositaetKv40: number | null;
  dichte: number | null;
  flammpunkt: number | null;
  quelle: string | null;
};

export async function applyZellerBelege2026_08_10(): Promise<string> {
  let ergaenzt = 0;
  let umbenannt = 0;
  let fehlend = 0;

  for (const b of BELEGE_JSON as Beleg[]) {
    // Der Katalog führt die Produkte teils mit, teils ohne „Divinol"-Präfix.
    const kandidaten = [b.name, b.name.replace(/^Divinol\s+/i, ""), `Divinol ${b.name}`];
    const p = await prisma.product.findFirst({
      where: {
        manufacturer: { name: "Zeller+Gmelin" },
        OR: kandidaten.map((n) => ({ name: n })),
      },
      select: {
        id: true,
        name: true,
        dataSheetUrl: true,
        sdsUrl: true,
        description: true,
        viscosityIso: true,
        viscosityKv40: true,
        densityGcm3: true,
        flashpointC: true,
        sourceUrl: true,
      },
    });
    if (!p) {
      fehlend++;
      continue;
    }

    const data: Record<string, string | number> = {};
    if (!p.dataSheetUrl && b.tdsUrl) data.dataSheetUrl = b.tdsUrl;
    if (!p.sdsUrl && b.sdsUrl) data.sdsUrl = b.sdsUrl;
    if (!p.sourceUrl && b.quelle) data.sourceUrl = b.quelle;
    if (b.beschreibung && (!p.description || p.description.length < 40)) {
      data.description = b.beschreibung;
    }
    if (p.viscosityIso == null && b.viskositaetIso != null) data.viscosityIso = String(b.viskositaetIso);
    if (p.viscosityKv40 == null && b.viskositaetKv40 != null) data.viscosityKv40 = b.viskositaetKv40;
    if (p.densityGcm3 == null && b.dichte != null) data.densityGcm3 = b.dichte;
    if (p.flashpointC == null && b.flammpunkt != null) data.flashpointC = Math.round(b.flammpunkt);
    if (data.dataSheetUrl || data.sdsUrl) data.sourceConfidence = "hersteller-doku";

    // Namenskorrektur nur, wenn der Hersteller es wirklich anders schreibt.
    if (b.korrektName && b.korrektName !== p.name) {
      const frei = await prisma.product.findFirst({
        where: { manufacturer: { name: "Zeller+Gmelin" }, name: b.korrektName, NOT: { id: p.id } },
        select: { id: true },
      });
      if (!frei) {
        data.name = b.korrektName;
        data.searchTokens = buildSearchTokens({
          productName: b.korrektName,
          manufacturer: "Zeller+Gmelin",
        });
        umbenannt++;
      }
    }

    if (Object.keys(data).length === 0) continue;
    await prisma.product.update({ where: { id: p.id }, data });
    ergaenzt++;
  }

  if (!ergaenzt) return `nichts zu tun (bereits eingespielt${fehlend ? `, ${fehlend} nicht gefunden` : ""})`;
  return `${ergaenzt} Produkt(e) belegt${umbenannt ? `, ${umbenannt} umbenannt` : ""}${fehlend ? `, ${fehlend} nicht gefunden` : ""}`;
}
