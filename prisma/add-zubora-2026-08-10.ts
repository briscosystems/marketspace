/**
 * Zubora-Linie von Zeller+Gmelin aufnehmen — 2026-08-10.
 *
 * Warum: Zubora ist die Kühlschmierstoff-Marke von Zeller+Gmelin und damit
 * genau die Produktgruppe, um die sich die Plattform dreht. Im Katalog stand
 * davon ein einziger Eintrag („Zubora RF", fälschlich als Additiv) — die
 * gesamte Linie fehlte. Das erklärt auch die Lücke, die bei der Namensprüfung
 * vom 2026-08-05 entstand: Die dort entfernten „Divinol Bohröl B 35/B 50/BS"
 * gibt es nicht, weil die wassermischbaren KSS bei Zeller+Gmelin Zubora heißen.
 *
 * Datenherkunft (Recherche 2026-08-10): Zeller+Gmelin zeigt Produktseiten
 * öffentlich, legt aber JEDEN Datenblatt-Download hinter ein Login. Die
 * Zahlenwerte stammen deshalb aus dem gespiegelten Zubora-Prospekt 04/2019
 * und aus Original-PDFs, die Händler (oelluxx24.de, oelschueler.de) spiegeln —
 * teils topaktuell (08/2025). Die Quelle steht je Produkt in `sourceUrl`, der
 * Umstand in `notes`.
 *
 * Wo Prospekt (2019) und heutige Produktseite sich widersprechen (einzelne
 * Härtebereiche und Refraktometer-Faktoren), wurde der NEUERE Wert übernommen
 * und der alte in der Bemerkung behalten.
 *
 * Zur Bor-/Aminfrage: „borfrei" ist bei fast allen Reihen ausdrücklich belegt.
 * Echte Aminfreiheit nur bei der 30er-Reihe und THG — bei 65/67/35 nennen die
 * Datenblätter primäre Amine ausdrücklich (nitrosamin-inhibiert nach TRGS 611).
 * „Monoethanolaminfrei" (20er, 77er) wurde bewusst NICHT als aminfrei gewertet.
 *
 * IDEMPOTENT: Angelegt wird nur, was über (manufacturerId, slug) fehlt.
 * Bestehende Produkte werden NIE überschrieben — der vorhandene Eintrag
 * „Zubora RF" bleibt unangetastet.
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import type { ProductCategory, ChemistryBase } from "@prisma/client";
import ZUBORA_JSON from "./data/zubora-2026-08-10.json";

type Zubora = {
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
  aminhaltig: boolean | null;
  tdsUrl: string | null;
  sdsUrl: string | null;
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

export async function applyZubora2026_08_10(): Promise<string> {
  const hersteller = await prisma.manufacturer.findFirst({
    where: { name: "Zeller+Gmelin" },
    select: { id: true },
  });
  if (!hersteller) return "nichts zu tun (Hersteller Zeller+Gmelin fehlt)";

  let angelegt = 0;
  let vorhanden = 0;

  for (const z of ZUBORA_JSON as Zubora[]) {
    if (!z.quelle) continue; // ohne Beleg nichts aufnehmen
    const slug = slugify(z.name);

    const schonDa = await prisma.product.findFirst({
      where: { manufacturerId: hersteller.id, slug },
      select: { id: true },
    });
    if (schonDa) {
      vorhanden++;
      continue;
    }

    await prisma.product.create({
      data: {
        manufacturerId: hersteller.id,
        name: z.name,
        slug,
        productFamily: "Zubora",
        category: z.kategorie as ProductCategory,
        chemistry: (z.chemie as ChemistryBase | null) ?? undefined,
        description: z.beschreibung,
        applicationAreas: z.anwendungsbereiche,
        suitableMaterials: z.werkstoffe,
        refractometerFactor: z.refr ?? undefined,
        recommendedConcentrationMin: z.konzMin ?? undefined,
        recommendedConcentrationMax: z.konzMax ?? undefined,
        phConcentrate: z.phKonz ?? undefined,
        phEmulsionMin: z.phMin ?? undefined,
        phEmulsionMax: z.phMax ?? undefined,
        waterHardnessMinDh: z.dhMin ?? undefined,
        waterHardnessMaxDh: z.dhMax ?? undefined,
        waterHardnessNotes: z.dhNotiz ?? undefined,
        containsBor: z.borhaltig ?? undefined,
        dataSheetUrl: z.tdsUrl ?? undefined,
        sdsUrl: z.sdsUrl ?? undefined,
        sourceUrl: z.quelle,
        sourceConfidence: z.tdsUrl ? "hersteller-doku" : "recherchiert",
        notes: z.bemerkung ?? undefined,
        searchTokens: buildSearchTokens({ productName: z.name, manufacturer: "Zeller+Gmelin" }),
      },
    });
    angelegt++;
  }

  return angelegt
    ? `${angelegt} Zubora-Produkt(e) angelegt${vorhanden ? `, ${vorhanden} waren schon da` : ""}`
    : `nichts zu tun (alle ${vorhanden} bereits vorhanden)`;
}
