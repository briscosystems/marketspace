/**
 * Produkt-Erweiterung 2026-08-02 (zweiter Durchgang) — 136 Produkte.
 *
 * Warum: Der Marktplatz hatte in vielen gefragten Produktarten fast keine Daten
 * (Erodier-Dielektrika 3, Reiniger 4, Schleiföle 7, Korrosionsschutz 9) und für
 * die neu aufgenommenen Arten (Turbinen-, Wärmeträger-, Härte-, Ketten-, Kälte-,
 * Vakuum-, Spindelöl, Drahtzieh-Schmierstoffe, Trennmittel) noch gar keine.
 *
 * Datenherkunft: Web-Recherche auf Hersteller-Produktseiten und Datenblatt-PDFs
 * (2026-08-02). Nicht belegbare Werte stehen bewusst als `null` statt als
 * Schätzung. Produkte, deren Angaben nur über Dritt-Quellen zu belegen waren,
 * tragen `sourceConfidence = "recherchiert"` statt `"verifiziert"`.
 *
 * Die Daten liegen als JSON daneben (data/produkte-2026-08-02b.json) — so ist
 * jede Zeile prüfbar, ohne durch TypeScript zu waten.
 *
 * IDEMPOTENT: Ein Produkt wird nur angelegt, wenn (manufacturerId, slug) noch
 * nicht existiert. Bestehende Produkte werden NIE überschrieben. Fehlende
 * Hersteller werden angelegt (rein additiv, nichts wird gelöscht).
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import type { ProductCategory, ChemistryBase } from "@prisma/client";
import PRODUKTE_JSON from "./data/produkte-2026-08-02b.json";

type NeuProdukt = {
  manufacturer: string;
  name: string;
  category: string;
  chemistry: string | null;
  viscosityIso: string | null;
  viscosityKv40: number | null;
  description: string;
  applicationAreas: string[];
  certifications: string[];
  sourceUrl: string | null;
  dataSheetUrl: string | null;
  sdsUrl: string | null;
  sourceConfidence: string;
};

const PRODUKTE = PRODUKTE_JSON as NeuProdukt[];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function applyProduktErweiterung2026_08_02b(): Promise<string> {
  const manufacturers = await prisma.manufacturer.findMany({ select: { id: true, name: true } });
  // Exakter Name zuerst (verhindert Shell/AeroShell-Verwechslung), sonst startsWith.
  const byName = new Map(manufacturers.map((m) => [m.name.toLowerCase(), m.id]));
  const liste = [...manufacturers];

  async function resolveOrCreate(name: string): Promise<string> {
    const exact = byName.get(name.toLowerCase());
    if (exact) return exact;
    const hit = liste.find((m) => m.name.toLowerCase().startsWith(name.toLowerCase()));
    if (hit) return hit.id;
    // Neu: Hersteller, die wir bisher nicht führen (z. B. Condat, Bitzer, Sika).
    const created = await prisma.manufacturer.create({
      data: { name, slug: slugify(name) },
      select: { id: true, name: true },
    });
    byName.set(created.name.toLowerCase(), created.id);
    liste.push(created);
    return created.id;
  }

  let neu = 0,
    vorhanden = 0,
    neueHersteller = 0;
  const vorher = liste.length;

  for (const p of PRODUKTE) {
    const manufacturerId = await resolveOrCreate(p.manufacturer);
    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({
      where: { manufacturerId_slug: { manufacturerId, slug } },
      select: { id: true },
    });
    if (existing) {
      vorhanden++;
      continue;
    }
    await prisma.product.create({
      data: {
        manufacturerId,
        name: p.name,
        slug,
        category: p.category as ProductCategory,
        chemistry: (p.chemistry as ChemistryBase | null) ?? null,
        description: p.description,
        applicationAreas: p.applicationAreas,
        certifications: p.certifications,
        viscosityIso: p.viscosityIso,
        viscosityKv40: p.viscosityKv40,
        sourceUrl: p.sourceUrl,
        dataSheetUrl: p.dataSheetUrl,
        sdsUrl: p.sdsUrl,
        sourceConfidence: p.sourceConfidence,
        searchTokens: buildSearchTokens({ productName: p.name, manufacturer: p.manufacturer }),
      },
    });
    neu++;
  }
  neueHersteller = liste.length - vorher;

  if (neu === 0 && neueHersteller === 0) return "nichts zu tun (bereits eingespielt)";
  return `${neu} Produkte neu, ${vorhanden} schon vorhanden, ${neueHersteller} Hersteller neu angelegt`;
}

// Standalone: npx tsx prisma/add-produkte-2026-08-02b.ts
if (process.argv[1]?.includes("add-produkte-2026-08-02b")) {
  applyProduktErweiterung2026_08_02b()
    .then((r) => {
      console.log("Ergebnis:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
