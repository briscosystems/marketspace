/**
 * Phantom-Produkte entfernen und durch belegte ersetzen — 2026-08-05.
 *
 * Warum: Beim Sollwerte-Sprint fiel auf, dass sechs Einträge aus einer früheren
 * automatischen Anreicherung („Auto-generiert aus Hersteller-Produktreihen-
 * Template") Produkte beschrieben, die es gar nicht gibt:
 *
 *   - Hebro Cut HC 22 K / HC 750 / HC 850: Die Serie hebro cut existiert, ist
 *     aber eine Reihe NICHT wassermischbarer Schneid- und Ziehöle; diese drei
 *     Bezeichnungen kommen in keiner Herstellerunterlage vor. Wassermischbare
 *     KSS heißen bei hebro „hebro lub", „hebro cool" und „hebro grind".
 *   - Aquamet ECO / MD / Premium: Die Eni-Serie Aquamet existiert, führt aber
 *     ganz andere Kürzel (104 Plus, LMK-…, LMX-…, SBH …). „Premium" gibt es
 *     nicht; der Generationszusatz bei Eni heißt „Plus".
 *
 * Erfundene Produktseiten sind für eine Plattform, die Vertrauen verkauft, das
 * schlimmste Datenproblem — wer sie findet, hält sie für belegt. Deshalb weg.
 *
 * Als Ersatz kommen 23 belegte Produkte derselben Hersteller herein (11 hebro
 * aus der Baseline-Übersicht 01/2023, 12 Eni-Aquamet-Varianten aus den
 * deutschen Datenblättern des Enilive-Portals), jeweils mit Pflege-Sollwerten.
 * Daten und Belege: data/produkte-nachtrag-2026-08-05.json.
 *
 * IDEMPOTENT: Gelöscht wird nur, was noch da ist; angelegt wird nur, was über
 * (manufacturerId, slug) noch fehlt. Bestehende Produkte werden NIE
 * überschrieben. Produkte mit Angeboten, Preisen oder Erfahrungsberichten
 * werden NICHT gelöscht (Sicherheitsnetz — die sechs hatten nachweislich keine).
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import type { ProductCategory, ChemistryBase } from "@prisma/client";
import NACHTRAG_JSON from "./data/produkte-nachtrag-2026-08-05.json";

/** Die sechs erfundenen Einträge, identifiziert über (Hersteller, Slug). */
const PHANTOME: { hersteller: string; slug: string }[] = [
  { hersteller: "Hebro Chemie", slug: "hebro-cut-hc-22-k" },
  { hersteller: "Hebro Chemie", slug: "hebro-cut-hc-750" },
  { hersteller: "Hebro Chemie", slug: "hebro-cut-hc-850" },
  { hersteller: "Eni", slug: "aquamet-eco" },
  { hersteller: "Eni", slug: "aquamet-md" },
  { hersteller: "Eni", slug: "aquamet-premium" },
];

type NeuProdukt = {
  hersteller: string;
  name: string;
  kategorie: string;
  chemie: string | null;
  beschreibung: string;
  anwendungsbereiche: string[];
  werkstoffe: string[];
  refr: number | null;
  konzMin: number | null;
  konzMax: number | null;
  phKonz: number | null;
  phMin: number | null;
  phMax: number | null;
  dhMin: number | null;
  dhMax: number | null;
  dhNotiz: string | null;
  borhaltig: boolean | null;
  datenblattUrl: string | null;
  quelle: string | null;
  bemerkung: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fixPhantomprodukte2026_08_05(): Promise<string> {
  let geloescht = 0;
  let geschuetzt = 0;

  for (const p of PHANTOME) {
    const treffer = await prisma.product.findFirst({
      where: { slug: p.slug, manufacturer: { name: p.hersteller } },
      select: {
        id: true,
        _count: { select: { priceObservations: true, issues: true, experienceReports: true } },
      },
    });
    if (!treffer) continue;
    // Sicherheitsnetz: nichts löschen, woran echte Nutzerdaten hängen.
    const { priceObservations, issues, experienceReports } = treffer._count;
    if (priceObservations + issues + experienceReports > 0) {
      geschuetzt++;
      continue;
    }
    await prisma.product.delete({ where: { id: treffer.id } });
    geloescht++;
  }

  let angelegt = 0;
  for (const n of NACHTRAG_JSON as NeuProdukt[]) {
    const hersteller = await prisma.manufacturer.findFirst({
      where: { name: n.hersteller },
      select: { id: true },
    });
    if (!hersteller) continue; // Hersteller fehlt — nichts erfinden.

    const slug = slugify(n.name);
    const vorhanden = await prisma.product.findFirst({
      where: { manufacturerId: hersteller.id, slug },
      select: { id: true },
    });
    if (vorhanden) continue;

    await prisma.product.create({
      data: {
        manufacturerId: hersteller.id,
        name: n.name,
        slug,
        category: n.kategorie as ProductCategory,
        chemistry: (n.chemie as ChemistryBase | null) ?? undefined,
        description: n.beschreibung,
        applicationAreas: n.anwendungsbereiche,
        suitableMaterials: n.werkstoffe,
        refractometerFactor: n.refr ?? undefined,
        recommendedConcentrationMin: n.konzMin ?? undefined,
        recommendedConcentrationMax: n.konzMax ?? undefined,
        phConcentrate: n.phKonz ?? undefined,
        phEmulsionMin: n.phMin ?? undefined,
        phEmulsionMax: n.phMax ?? undefined,
        waterHardnessMinDh: n.dhMin ?? undefined,
        waterHardnessMaxDh: n.dhMax ?? undefined,
        waterHardnessNotes: n.dhNotiz ?? undefined,
        containsBor: n.borhaltig ?? undefined,
        dataSheetUrl: n.datenblattUrl ?? undefined,
        sourceUrl: n.quelle ?? undefined,
        sourceConfidence: "hersteller-doku",
        notes: n.bemerkung ?? undefined,
        searchTokens: buildSearchTokens({ productName: n.name, manufacturer: n.hersteller }),
      },
    });
    angelegt++;
  }

  if (!geloescht && !angelegt) {
    return `nichts zu tun (bereits erledigt)${geschuetzt ? `, ${geschuetzt} geschützt` : ""}`;
  }
  return `${geloescht} Phantom-Produkt(e) entfernt, ${angelegt} belegte Produkte angelegt${geschuetzt ? `, ${geschuetzt} geschützt (Nutzerdaten vorhanden)` : ""}`;
}
