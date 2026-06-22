// Reichert bestehende KSS-Produkte (COOLANT_WATER_MIX / COOLANT_NEAT / GRINDING_OIL)
// mit den neuen Feldern an: productionType, concentrateForm, criticalIssuesAddressed,
// applicationAreas, suitableMaterials, certifications.
//
// Heuristik basierend auf Produkt-Name + Hersteller + chemistry. Diese Daten sind
// 'modelliert' (sourceConfidence) — sie stammen aus Hersteller-Produktdatenblättern
// und allgemeiner Branchenkenntnis. Idempotent (überschreibt nicht-leere Felder nur,
// wenn der neue Wert reicher ist).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProductionType = "CONTRACT_MANUFACTURING" | "SERIAL_PRODUCTION" | "MIXED";
type ConcentrateForm =
  | "CONVENTIONAL_EMULSION"
  | "SEMI_SYNTHETIC"
  | "FULL_SYNTHETIC"
  | "TWO_COMPONENT";

// Heuristik: chemistry → concentrateForm
function concentrateFromChemistry(
  chemistry: string | null,
  category: string,
): ConcentrateForm | null {
  if (category !== "COOLANT_WATER_MIX") return null;
  if (chemistry === "MINERAL") return "CONVENTIONAL_EMULSION";
  if (chemistry === "SEMI_SYNTHETIC") return "SEMI_SYNTHETIC";
  if (chemistry === "SYNTHETIC") return "FULL_SYNTHETIC";
  return null;
}

// Heuristik: per Hersteller/Familie Anwendungsgebiete und Materialien zuweisen
const FAMILY_PROFILES: Record<
  string,
  {
    applicationAreas?: string[];
    suitableMaterials?: string[];
    criticalIssuesAddressed?: string[];
    productionType?: ProductionType;
    certifications?: string[];
  }
> = {
  // Blaser
  "B-Cool": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen", "Gusseisen (GG, GGG)"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung", "Hautirritation / Ekzeme"],
    productionType: "CONTRACT_MANUFACTURING",
    certifications: ["TRGS 611 (DE-Vorschrift, bor-/aminbasiert)", "VKIS/VSI/IGM/BGHM-Stoffliste (DIN 51385)"],
  },
  "Vasco": {
    applicationAreas: ["Drehen", "Fräsen", "Schleifen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Lack-/Beschichtungs-Rückstände", "Fleckenbildung Buntmetall", "Hautirritation / Ekzeme"],
    productionType: "MIXED",
    certifications: ["TRGS 611 (DE-Vorschrift, bor-/aminbasiert)"],
  },
  "Synergy": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Titan / Titanlegierungen", "Nickelbasislegierungen (Inconel, Hastelloy)"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  "Blasocut": {
    applicationAreas: ["Drehen", "Fräsen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung", "Geruchsbildung (H₂S)"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  // Castrol
  "Hysol": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Sägen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Gusseisen (GG, GGG)"],
    criticalIssuesAddressed: ["Fleckenbildung Buntmetall"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "Variocut": {
    applicationAreas: ["Drehen", "Fräsen", "Tieflochbohren", "Gewindeschneiden"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Titan / Titanlegierungen"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Fuchs
  "Ecocool": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Schleifen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen", "Buntmetall (Messing, Bronze, Kupfer)"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung", "Schaumbildung"],
    productionType: "CONTRACT_MANUFACTURING",
    certifications: ["TRGS 611 (DE-Vorschrift, bor-/aminbasiert)", "VKIS/VSI/IGM/BGHM-Stoffliste (DIN 51385)"],
  },
  "Plantocut": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Aluminium-Knetlegierungen", "Aluminium-Gusslegierungen"],
    criticalIssuesAddressed: ["Hautirritation / Ekzeme", "Aluminium-Anlauf / Verfärbung"],
    productionType: "SERIAL_PRODUCTION",
    certifications: ["Blauer Engel (DE-UZ 178)"],
  },
  // Quaker Houghton
  "Hocut": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Gusseisen (GG, GGG)"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit", "Bakterienbefall / Verkeimung"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Rhenus
  "rhenus FU": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen", "Buntmetall (Messing, Bronze, Kupfer)"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung", "Geruchsbildung (H₂S)"],
    productionType: "CONTRACT_MANUFACTURING",
    certifications: ["TRGS 611 (DE-Vorschrift, bor-/aminbasiert)"],
  },
  "rhenus TF": {
    applicationAreas: ["Schleifen", "Honen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Hartmetall / Sinterwerkstoffe"],
    criticalIssuesAddressed: ["Schaumbildung", "Filtrierbarkeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Cimcool
  "Cimstar": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Hautirritation / Ekzeme"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "Cimperial": {
    applicationAreas: ["Drehen", "Fräsen", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Gusseisen (GG, GGG)"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  "Cimtech": {
    applicationAreas: ["Schleifen", "Honen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Hartmetall / Sinterwerkstoffe"],
    criticalIssuesAddressed: ["Schaumbildung"],
    productionType: "SERIAL_PRODUCTION",
  },
  "Cimfree": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Hautirritation / Ekzeme", "Bakterienbefall / Verkeimung"],
    productionType: "MIXED",
    certifications: ["TRGS 611 (DE-Vorschrift, bor-/aminbasiert)"],
  },
  // Oemeta
  "Hycut": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "Hytap": {
    applicationAreas: ["Gewindeschneiden", "Räumen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  "Novamet": {
    applicationAreas: ["Drehen", "Fräsen"],
    suitableMaterials: ["Aluminium-Knetlegierungen", "Buntmetall (Messing, Bronze, Kupfer)"],
    criticalIssuesAddressed: ["Aluminium-Anlauf / Verfärbung", "Fleckenbildung Buntmetall"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  // Master Fluid Solutions
  "TRIM": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Aluminium-Knetlegierungen"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung", "Hautirritation / Ekzeme"],
    productionType: "MIXED",
  },
  // Petrofer
  "Emulcut": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    criticalIssuesAddressed: ["Bakterienbefall / Verkeimung"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "Isocut": {
    applicationAreas: ["Drehen", "Fräsen", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Titan / Titanlegierungen"],
    criticalIssuesAddressed: ["Niedrige Werkzeugstandzeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  // oelheld
  "SintoGrind": {
    applicationAreas: ["Schleifen", "Honen"],
    suitableMaterials: ["Hartmetall / Sinterwerkstoffe", "Stahl (Baustahl, Vergütungsstahl)"],
    criticalIssuesAddressed: ["Schaumbildung", "Filtrierbarkeit"],
    productionType: "SERIAL_PRODUCTION",
  },
  "IonoGrind": {
    applicationAreas: ["Schleifen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    criticalIssuesAddressed: ["Schaumbildung"],
    productionType: "SERIAL_PRODUCTION",
  },
  "SintoCut": {
    applicationAreas: ["Drehen", "Fräsen", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Mobil
  "Mobilcut": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "Mobilmet": {
    applicationAreas: ["Drehen", "Fräsen", "Räumen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Shell
  "Adrana": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox", "Aluminium-Knetlegierungen"],
    productionType: "MIXED",
  },
  "Macron": {
    applicationAreas: ["Stanzen", "Tiefziehen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Carl Bechem
  "Berucut": {
    applicationAreas: ["Drehen", "Fräsen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  // Hebro
  "Hebro Cut": {
    applicationAreas: ["Drehen", "Fräsen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  // Jokisch
  "Jokisol": {
    applicationAreas: ["Drehen", "Fräsen", "Tieflochbohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Edelstahl / Inox"],
    productionType: "SERIAL_PRODUCTION",
  },
  // Avia Bantleon
  "AVILUB Metacool": {
    applicationAreas: ["Drehen", "Fräsen", "Bohren"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)", "Aluminium-Knetlegierungen"],
    productionType: "CONTRACT_MANUFACTURING",
  },
  "AVILUB Metacorin": {
    applicationAreas: ["Drehen", "Fräsen"],
    suitableMaterials: ["Stahl (Baustahl, Vergütungsstahl)"],
    productionType: "SERIAL_PRODUCTION",
  },
};

async function main() {
  const products = await prisma.product.findMany({
    where: {
      category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
    },
    select: {
      id: true,
      name: true,
      category: true,
      chemistry: true,
      productFamily: true,
      applicationAreas: true,
      suitableMaterials: true,
      certifications: true,
      productionType: true,
      concentrateForm: true,
      criticalIssuesAddressed: true,
    },
  });

  console.log(`KSS-Produkte gefunden: ${products.length}`);

  let updated = 0;
  for (const p of products) {
    const patch: Record<string, unknown> = {};

    // 1) Concentrate form aus chemistry für wassermischbare
    const cf = concentrateFromChemistry(p.chemistry, p.category);
    if (cf && !p.concentrateForm) patch.concentrateForm = cf;

    // 2) Familien-Profil suchen — exakt oder startsWith
    let profile: (typeof FAMILY_PROFILES)[string] | undefined;
    if (p.productFamily && FAMILY_PROFILES[p.productFamily]) {
      profile = FAMILY_PROFILES[p.productFamily];
    } else {
      for (const [key, prof] of Object.entries(FAMILY_PROFILES)) {
        if (p.name.startsWith(key) || (p.productFamily && p.productFamily.startsWith(key))) {
          profile = prof;
          break;
        }
      }
    }
    if (profile) {
      if (profile.applicationAreas && p.applicationAreas.length === 0)
        patch.applicationAreas = profile.applicationAreas;
      if (profile.suitableMaterials && p.suitableMaterials.length === 0)
        patch.suitableMaterials = profile.suitableMaterials;
      if (profile.criticalIssuesAddressed && p.criticalIssuesAddressed.length === 0)
        patch.criticalIssuesAddressed = profile.criticalIssuesAddressed;
      if (profile.productionType && !p.productionType) patch.productionType = profile.productionType;
      if (profile.certifications && p.certifications.length === 0)
        patch.certifications = profile.certifications;
    }

    if (Object.keys(patch).length > 0) {
      await prisma.product.update({ where: { id: p.id }, data: patch });
      updated++;
    }
  }

  console.log(`\nAngereichert: ${updated} Produkte`);

  // Stats
  const withForm = await prisma.product.count({ where: { concentrateForm: { not: null } } });
  const withProdType = await prisma.product.count({ where: { productionType: { not: null } } });
  const withCriticalIssues = await prisma.product.count({
    where: { criticalIssuesAddressed: { isEmpty: false } },
  });
  console.log(`  concentrateForm gesetzt: ${withForm}`);
  console.log(`  productionType gesetzt: ${withProdType}`);
  console.log(`  criticalIssuesAddressed gesetzt: ${withCriticalIssues}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
