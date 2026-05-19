/**
 * Produkt-Katalog Seed.
 *
 * Phase 1 (dieser Seed): KSS-Spezialisten Blaser / Cimcool / Oemeta.
 * Alle Daten haben einen sourceUrl + sourceConfidence:
 *   - "verifiziert"  = direkt aus Hersteller-Doku oder Hersteller-Forum-Aussage
 *   - "hersteller-website" = Produktseite des Herstellers
 *   - "geschätzt"    = Branchenwissen, kein offizielles Datenblatt — explizit als
 *                       Schätzwert markiert, damit niemand das ungeprüft übernimmt
 *
 * Refraktometerfaktor wird NUR eingetragen wenn verifiziert. Sonst null.
 *
 * Idempotent via upsert auf (manufacturerId, slug).
 *
 * Aufruf: npx tsx prisma/seed-products.ts
 */
import { PrismaClient, ProductCategory, ChemistryBase } from "@prisma/client";

const prisma = new PrismaClient();

type Seed = {
  manufacturerSlug: string;
  name: string;
  slug: string;
  productFamily?: string;
  category: ProductCategory;
  chemistry?: ChemistryBase;
  description?: string;
  applicationAreas?: string[];
  suitableMaterials?: string[];
  unsuitableMaterials?: string[];
  refractometerFactor?: number;
  recommendedConcentrationMin?: number;
  recommendedConcentrationMax?: number;
  phConcentrate?: number;
  phEmulsionMin?: number;
  phEmulsionMax?: number;
  densityGcm3?: number;
  flashpointC?: number;
  viscosityIso?: string;
  viscosityKv40?: number;
  waterHardnessMinDh?: number;
  waterHardnessMaxDh?: number;
  waterHardnessNotes?: string;
  certifications?: string[];
  containsBor?: boolean;
  containsFormaldehydeDepot?: boolean;
  containsMineralOil?: boolean;
  containsChlorine?: boolean;
  mineralOilContentPct?: number;
  sourceUrl?: string;
  sourceConfidence: string;
  notes?: string;
};

const PRODUCTS: Seed[] = [
  // ============================================================
  // BLASER SWISSLUBE
  // ============================================================
  {
    manufacturerSlug: "blaser-swisslube",
    name: "Blasocut 2000 CF",
    slug: "blasocut-2000-cf",
    productFamily: "Blasocut",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description:
      "Wassermischbarer, chlorfreier, bor-freier, biozid-freier KSS auf Mineralölbasis. " +
      "Komposition: 40–70 % hochraffiniertes Mineralöl, 15–40 % Emulgatoren, 2–7 % polare " +
      "Additive, 0.5–1 % Korrosions-/Pilzhemmer.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Schleifen"],
    suitableMaterials: ["Stahl", "Guss", "Aluminium", "Buntmetall"],
    containsBor: false,
    containsChlorine: false,
    containsMineralOil: true,
    mineralOilContentPct: 55,
    sourceUrl: "https://www.lastuamisnesteet.fi/wp-content/uploads/2017/02/Blasocut2000-esite-eng.pdf",
    sourceConfidence: "hersteller-doku",
    notes: "Blasocut-Reihe: biozide-/bor-freie Bestseller-Familie von Blaser.",
  },
  {
    manufacturerSlug: "blaser-swisslube",
    name: "Synergy 735",
    slug: "synergy-735",
    productFamily: "Synergy",
    category: "COOLANT_WATER_MIX",
    chemistry: "SYNTHETIC",
    description:
      "Wassermischbarer, vollsynthetischer, ölfreier KSS. Transparent. Benötigt " +
      "demineralisiertes Wasser (DI, <50 µS).",
    applicationAreas: ["Drehen", "Fräsen", "Schleifen", "CNC-Bearbeitung"],
    suitableMaterials: ["Stahl", "Guss", "Aluminium", "Edelstahl"],
    refractometerFactor: 1.4,
    recommendedConcentrationMin: 6,
    recommendedConcentrationMax: 10,
    containsBor: false,
    containsFormaldehydeDepot: false,
    containsMineralOil: false,
    waterHardnessNotes:
      "Nur mit demineralisiertem Wasser ansetzen (<50 µS). Keine alkalischen Systemreiniger / pH-Booster zugeben — pH-Anhebung reduziert die Schmierfähigkeit.",
    sourceUrl: "https://www.lastuamisnesteet.fi/wp-content/uploads/2019/12/Synergy-735-Esite.pdf",
    sourceConfidence: "verifiziert",
    notes: "Verifizierter Refraktometerfaktor 1.4 (6–10 % Konz = 4.3–7.1 Brix).",
  },
  {
    manufacturerSlug: "blaser-swisslube",
    name: "B-Cool 755",
    slug: "b-cool-755",
    productFamily: "B-Cool",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbarer, semi-synthetischer KSS.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Schleifen"],
    suitableMaterials: ["Stahl", "Guss", "Aluminium"],
    refractometerFactor: 1.0,
    sourceUrl: "https://blaser.com/measuring-the-coolant-concentration/",
    sourceConfidence: "verifiziert",
    notes: "Refraktometerfaktor 1.0 (Brix = Konzentration).",
  },
  {
    manufacturerSlug: "blaser-swisslube",
    name: "Blasocut BC 25 MD",
    slug: "blasocut-bc-25-md",
    productFamily: "Blasocut",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Wassermischbarer KSS auf Mineralölbasis, bor-frei.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl", "Guss"],
    containsBor: false,
    containsMineralOil: true,
    sourceUrl: "https://blaser.com/our-metalworking-solutions/water-miscible-fluids/",
    sourceConfidence: "hersteller-website",
  },
  {
    manufacturerSlug: "blaser-swisslube",
    name: "Vasco 5000",
    slug: "vasco-5000",
    productFamily: "Vasco",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht wassermischbares Schneidöl auf Mineralöl-Basis.",
    applicationAreas: ["Drehen", "Bohren", "Gewinden", "Räumen"],
    suitableMaterials: ["Stahl", "Edelstahl", "Titan", "Inconel"],
    containsChlorine: false,
    sourceUrl: "https://blaser.com",
    sourceConfidence: "hersteller-website",
  },

  // ============================================================
  // CIMCOOL
  // ============================================================
  {
    manufacturerSlug: "cimcool",
    name: "Cimstar 585",
    slug: "cimstar-585",
    productFamily: "Cimstar",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbarer semi-synthetischer KSS, breit einsetzbar.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl", "Guss", "Aluminium"],
    refractometerFactor: 1.6,
    recommendedConcentrationMin: 5,
    recommendedConcentrationMax: 10,
    sourceUrl: "https://cimcool.com.au/PIFs/Cimstar/CIMSTAR_585_AUSPIF.pdf",
    sourceConfidence: "verifiziert",
    notes: "Faktor 1.6: Refraktometerablesung × 1.6 = % Konzentration.",
  },
  {
    manufacturerSlug: "cimcool",
    name: "Cimstar 60C-HFP",
    slug: "cimstar-60c-hfp",
    productFamily: "Cimstar",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description:
      "Wassermischbarer semi-synthetischer KSS. Bor-frei, formaldehyd-frei (HFP = Health-First Performance).",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Schleifen"],
    suitableMaterials: ["Stahl", "Guss", "Aluminium"],
    refractometerFactor: 1.6,
    recommendedConcentrationMin: 5,
    recommendedConcentrationMax: 10,
    phEmulsionMin: 8.7,
    phEmulsionMax: 8.7,
    containsBor: false,
    containsFormaldehydeDepot: false,
    sourceUrl: "https://products.duboischemicals.com/signature-collection/metalworking-fluids/cimstar-60c-hfp",
    sourceConfidence: "verifiziert",
    notes: "Faktor 1.6, pH bei 5 % Konzentration ≈ 8.7.",
  },
  {
    manufacturerSlug: "cimcool",
    name: "Cimstar 66",
    slug: "cimstar-66",
    productFamily: "Cimstar",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Wassermischbarer löslicher Ölkonzentrat-KSS.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl", "Guss"],
    containsMineralOil: true,
    sourceUrl: "https://dtsindustrial.com/cimstar-66.html",
    sourceConfidence: "hersteller-website",
  },
  {
    manufacturerSlug: "cimcool",
    name: "Cimperial 1010",
    slug: "cimperial-1010",
    productFamily: "Cimperial",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Wassermischbarer löslicher Öl-KSS für allgemeine Zerspanung.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl", "Guss"],
    containsMineralOil: true,
    sourceUrl: "https://cimcool.com",
    sourceConfidence: "hersteller-website",
  },
  {
    manufacturerSlug: "cimcool",
    name: "Cimtech 320",
    slug: "cimtech-320",
    productFamily: "Cimtech",
    category: "COOLANT_WATER_MIX",
    chemistry: "SYNTHETIC",
    description: "Wassermischbarer, synthetischer KSS — transparent, ölfrei.",
    applicationAreas: ["Schleifen", "Drehen", "Fräsen"],
    suitableMaterials: ["Stahl", "Hartmetall"],
    containsMineralOil: false,
    sourceUrl: "https://cimcool.com",
    sourceConfidence: "hersteller-website",
  },

  // ============================================================
  // OEMETA
  // ============================================================
  {
    manufacturerSlug: "oemeta",
    name: "HYCUT CF 21 + ADDITIV AE",
    slug: "hycut-cf-21-additiv-ae",
    productFamily: "HYCUT",
    category: "COOLANT_WATER_MIX",
    chemistry: "ESTER",
    description:
      "Zweikomponenten-KSS auf synthetischer Ester-Öl-Basis, mineralölfrei. EP-additiviert. " +
      "Bor- und formaldehyd-frei.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Gewinden", "Honen", "Reiben", "Schleifen", "Tiefbohren"],
    suitableMaterials: ["Aluminium", "Stahl", "Edelstahl", "Grauguss"],
    containsBor: false,
    containsFormaldehydeDepot: false,
    containsMineralOil: false,
    containsChlorine: false,
    sourceUrl: "https://www.oemeta.com/us/products-services/two-component-metalworking-fluid",
    sourceConfidence: "hersteller-website",
    notes: "Zweikomponenten-System: Basis CF 21 + Additiv AE (multifunktional).",
  },
  {
    manufacturerSlug: "oemeta",
    name: "HYCUT CF 21 + ADDITIV BF",
    slug: "hycut-cf-21-additiv-bf",
    productFamily: "HYCUT",
    category: "COOLANT_WATER_MIX",
    chemistry: "ESTER",
    description: "Zweikomponenten-KSS, Ester-Basis, bor-frei. Optimiert für Aluminium-Legierungen.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Schleifen"],
    suitableMaterials: ["Aluminium", "Stahl", "Edelstahl", "Grauguss"],
    containsBor: false,
    containsFormaldehydeDepot: false,
    containsMineralOil: false,
    sourceUrl: "https://www.oemeta.com/us/products-services/two-component-metalworking-fluid",
    sourceConfidence: "hersteller-website",
  },
  {
    manufacturerSlug: "oemeta",
    name: "HYCUT CF 21 + ADDITIV MG",
    slug: "hycut-cf-21-additiv-mg",
    productFamily: "HYCUT",
    category: "COOLANT_WATER_MIX",
    chemistry: "ESTER",
    description: "Zweikomponenten-KSS auf Ester-Basis, speziell für Magnesium-Bearbeitung.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Magnesium"],
    containsBor: false,
    containsFormaldehydeDepot: false,
    containsMineralOil: false,
    sourceUrl: "https://www.oemeta.com/us/products-services/two-component-metalworking-fluid",
    sourceConfidence: "hersteller-website",
    notes: "Spezialprodukt für Magnesium-Zerspanung (Brandschutz-relevant).",
  },
  {
    manufacturerSlug: "oemeta",
    name: "HYCUT ET 46 + ADDITIV ET",
    slug: "hycut-et-46-additiv-et",
    productFamily: "HYCUT",
    category: "COOLANT_WATER_MIX",
    chemistry: "ESTER",
    description:
      "Zweikomponenten-KSS, Ester-Basis ISO VG 46, mineralölfrei, EP-additiviert. " +
      "Frei von Schwermetallen, Zink, Chlor-Verbindungen, Biozide (inkl. Formaldehyd) und Silizium. " +
      "Nicht-zytotoxisch nach EN ISO 10993-5:2009.",
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Gewinden", "Honen", "Reiben", "Schleifen", "Tiefbohren"],
    suitableMaterials: ["Grauguss", "Edelstahl", "Stahl"],
    viscosityIso: "ISO VG 46",
    containsBor: false,
    containsFormaldehydeDepot: false,
    containsMineralOil: false,
    containsChlorine: false,
    certifications: ["EN ISO 10993-5:2009 (Zytotoxizität)"],
    sourceUrl: "https://www.oemeta.com/us/products-services/product?tx_lfmproducts_productdetail%5Bproduct%5D=180",
    sourceConfidence: "hersteller-website",
    notes: "Premium-Spezialprodukt — Medizintechnik-Tauglich (Biocompat).",
  },
  {
    manufacturerSlug: "oemeta",
    name: "HYCUT SE 12",
    slug: "hycut-se-12",
    productFamily: "HYCUT",
    category: "GRINDING_OIL",
    chemistry: "ESTER",
    description:
      "Schleiföl auf Ester-Basis. 30 % geringere Verdampfungsverluste gegenüber " +
      "konventionellem Mineralöl bei 150 °C.",
    applicationAreas: ["Schleifen"],
    suitableMaterials: ["Stahl", "Hartmetall"],
    containsMineralOil: false,
    sourceUrl: "https://www.oemeta.com/us/products-services/two-component-metalworking-fluid",
    sourceConfidence: "hersteller-website",
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const p of PRODUCTS) {
    const manuf = await prisma.manufacturer.findUnique({
      where: { slug: p.manufacturerSlug },
      select: { id: true },
    });
    if (!manuf) {
      console.warn(`Skip "${p.name}" — Hersteller-Slug "${p.manufacturerSlug}" nicht gefunden`);
      skipped++;
      continue;
    }
    const { manufacturerSlug, sourceConfidence, ...rest } = p;
    const data = { ...rest, sourceConfidence };
    const existing = await prisma.product.findUnique({
      where: { manufacturerId_slug: { manufacturerId: manuf.id, slug: p.slug } },
    });
    await prisma.product.upsert({
      where: { manufacturerId_slug: { manufacturerId: manuf.id, slug: p.slug } },
      update: data,
      create: { ...data, manufacturerId: manuf.id },
    });
    existing ? updated++ : inserted++;
  }
  const total = await prisma.product.count();
  console.log(
    `Produkt-Seed: ${inserted} angelegt, ${updated} aktualisiert, ${skipped} übersprungen. DB-Gesamt: ${total}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
