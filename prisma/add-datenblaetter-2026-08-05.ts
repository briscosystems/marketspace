/**
 * Datenblatt-Nachtrag 2026-08-05 — technische Datenblätter (TDS) und
 * Sicherheitsdatenblätter (SDS) für Produkte AUSSERHALB der Kühlschmierstoffe.
 *
 * Warum: 227 Produkte hatten weder ein Datenblatt noch ein Sicherheitsdatenblatt
 * hinterlegt — vor allem Hydraulik-, Getriebe-, Umform-, Ketten- und Kälteöle,
 * Fette, Reiniger und Additive. Für Einkäufer ist das Datenblatt die Grundlage
 * jeder Entscheidung; ohne Beleg ist ein Katalogeintrag wenig wert.
 *
 * Datenherkunft: Web-Recherche auf Hersteller-Produktseiten und Datenblatt-PDFs
 * (2026-08-05, sieben parallele Läufe). **Jeder Link wurde vor der Aufnahme
 * aufgerufen** — tote und nicht erreichbare Links sind verworfen worden, denn
 * ein Link ins Leere sieht nach Beleg aus und ist keiner.
 *
 * Nicht gefundene Angaben bleiben null. Es wird NICHTS geschätzt.
 *
 * IDEMPOTENT: Es werden nur Felder gefüllt, die aktuell leer sind. Vorhandene
 * Links, Beschreibungen und Kennwerte werden NIE überschrieben.
 */
import { prisma } from "../lib/prisma";
import DATENBLAETTER_JSON from "./data/datenblaetter-2026-08-05.json";

type Fund = {
  id: string;
  hersteller: string;
  name: string;
  existiert: boolean;
  korrektName: string | null;
  tdsUrl: string | null;
  sdsUrl: string | null;
  beschreibung: string | null;
  viskositaetIso: string | number | null;
  viskositaetKv40: number | null;
  viskositaetKv100: number | null;
  dichte: number | null;
  flammpunkt: number | null;
  quelle: string | null;
};

export async function applyDatenblaetter2026_08_05(): Promise<string> {
  const eintraege = DATENBLAETTER_JSON as Fund[];
  let ergaenzt = 0;
  let fehlend = 0;

  for (const e of eintraege) {
    const p = await prisma.product.findUnique({
      where: { id: e.id },
      select: {
        id: true,
        dataSheetUrl: true,
        sdsUrl: true,
        description: true,
        viscosityIso: true,
        viscosityKv40: true,
        viscosityKv100: true,
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
    if (!p.dataSheetUrl && e.tdsUrl) data.dataSheetUrl = e.tdsUrl;
    if (!p.sdsUrl && e.sdsUrl) data.sdsUrl = e.sdsUrl;
    if (!p.sourceUrl && e.quelle) data.sourceUrl = e.quelle;
    // Beschreibung nur setzen, wenn gar keine da ist oder die alte offenkundig
    // aus dem automatischen Aufbau stammt (dort steht oft ein Ein-Satz-Platzhalter).
    if (e.beschreibung && (!p.description || p.description.length < 40)) {
      data.description = e.beschreibung;
    }
    if (p.viscosityIso == null && e.viskositaetIso != null) {
      data.viscosityIso = String(e.viskositaetIso);
    }
    if (p.viscosityKv40 == null && e.viskositaetKv40 != null) data.viscosityKv40 = e.viskositaetKv40;
    if (p.viscosityKv100 == null && e.viskositaetKv100 != null) data.viscosityKv100 = e.viskositaetKv100;
    if (p.densityGcm3 == null && e.dichte != null) data.densityGcm3 = e.dichte;
    if (p.flashpointC == null && e.flammpunkt != null) data.flashpointC = Math.round(e.flammpunkt);

    if (Object.keys(data).length === 0) continue;
    // Ein Produkt mit belegtem Herstellerdatenblatt ist nicht mehr „modelliert".
    if (data.dataSheetUrl || data.sdsUrl) data.sourceConfidence = "hersteller-doku";

    await prisma.product.update({ where: { id: p.id }, data });
    ergaenzt++;
  }

  return ergaenzt
    ? `${ergaenzt} Produkt(e) mit Datenblatt-Angaben ergänzt${fehlend ? `, ${fehlend} nicht gefunden` : ""}`
    : `nichts zu tun (bereits eingespielt${fehlend ? `, ${fehlend} nicht gefunden` : ""})`;
}
