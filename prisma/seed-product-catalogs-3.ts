// Dritte Welle — Lückenfüller für die 1000-Marke.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type ChemistryBase = "MINERAL" | "SEMI_SYNTHETIC" | "SYNTHETIC" | "ESTER" | "PAG" | "OTHER";
type Family = {
  manufacturer: string;
  family: string;
  category:
    | "COOLANT_WATER_MIX" | "COOLANT_NEAT" | "GRINDING_OIL" | "EDM_FLUID"
    | "HYDRAULIC_OIL" | "GEAR_OIL" | "COMPRESSOR_OIL" | "SLIDEWAY_OIL"
    | "FORMING_OIL" | "CLEANER" | "CORROSION_PROTECTION" | "GREASE" | "SPECIALTY" | "OTHER";
  chemistry: ChemistryBase;
  description: string;
  variants: string[];
  nameTemplate: string;
  variantLabel?: "iso-vg" | "sae" | "nlgi" | "plain";
  containsMineralOil?: boolean;
  certifications?: string[];
};

const FAMILIES: Family[] = [
  // Aero-Schmierstoffe (Mobil/Shell) — fehlen noch
  {
    manufacturer: "Mobil",
    family: "Jet Oil",
    category: "SPECIALTY",
    chemistry: "ESTER",
    description: "Polyester-basierte Turbinen-Triebwerksöle für Luftfahrt.",
    variants: ["II", "254", "291"],
    nameTemplate: "Jet Oil {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  // Mobil Pegasus für Gasmotoren
  {
    manufacturer: "Mobil",
    family: "Pegasus",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Gasmotorenöl-Reihe für stationäre Gasmotoren.",
    variants: ["705", "710", "805", "1005"],
    nameTemplate: "Pegasus {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Shell Diala (Trafo-Öle)
  {
    manufacturer: "Shell",
    family: "Diala",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Isolieröl für Transformatoren und Schaltanlagen.",
    variants: ["S3 ZX-I", "S4 ZX-I", "S2 ZU-I"],
    nameTemplate: "Diala {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Shell Mysella (Gasmotor)
  {
    manufacturer: "Shell",
    family: "Mysella",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Gasmotorenöl-Reihe für stationäre Anwendung.",
    variants: ["S3 N", "S5 N40", "S5 S"],
    nameTemplate: "Mysella {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Castrol Perfecto (Turbinen-Öl)
  {
    manufacturer: "Castrol",
    family: "Perfecto T",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Turbinen-Öl für Dampf-/Gasturbinen.",
    variants: ["32", "46", "68"],
    nameTemplate: "Perfecto T {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  // Mobil DTE 700 series (Turbinen)
  {
    manufacturer: "Mobil",
    family: "DTE 700",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Premium-Turbinen-Öl für Dampf-/Gasturbinen.",
    variants: ["732", "746"],
    nameTemplate: "DTE {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Castrol Optileb (NSF H1)
  {
    manufacturer: "Castrol",
    family: "Optileb",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "NSF-H1-zertifizierte Lebensmittel-Schmierstoffe Optileb.",
    certifications: ["NSF H1"],
    variants: ["HY 32", "HY 46", "GT 220", "GT 320", "GR 0", "GR 2"],
    nameTemplate: "Optileb {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  // Fuchs LUBRITECH (vergessene Reihe)
  {
    manufacturer: "Fuchs",
    family: "Plantogel",
    category: "GREASE",
    chemistry: "ESTER",
    description: "Bioabbaubare Fette der Plantogel-Reihe.",
    variants: ["0 S", "2 S", "WP 2"],
    nameTemplate: "Plantogel {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Plantosyn",
    category: "HYDRAULIC_OIL",
    chemistry: "ESTER",
    description: "Vollsynthetisches HEES-Hydrauliköl für mobile Hydrauliken.",
    variants: ["32", "46", "68"],
    nameTemplate: "Plantosyn {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  // Klüber Klübermatic (Schmiergeber-Schmierstoffe)
  {
    manufacturer: "Klüber Lubrication",
    family: "Klüberplex",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Klüberplex-Schmierfette für hochbelastete Wälzlager.",
    variants: ["BEM 41-132", "BEM 41-301", "BE 31-102"],
    nameTemplate: "Klüberplex {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Klüberalfa",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "PFPE-Fette für hochaggressive Medien.",
    variants: ["DH 3-100", "YV 93-302", "YV 93-2 W"],
    nameTemplate: "Klüberalfa {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  // TotalEnergies Cortis (Turbinenöl)
  {
    manufacturer: "TotalEnergies",
    family: "Preslia",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Premium-Turbinen-Öl für Dampf- und Gasturbinen.",
    variants: ["32", "46", "68"],
    nameTemplate: "Preslia {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Nateria",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Gasmotorenöl-Reihe für stationäre Gasmotoren.",
    variants: ["MH 40", "ML 40", "MJ 40"],
    nameTemplate: "Nateria {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Dacnis",
    category: "COMPRESSOR_OIL",
    chemistry: "MINERAL",
    description: "Kompressor-Öl für Schraubenkompressoren.",
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Dacnis {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  // Quaker Houghton — weitere
  {
    manufacturer: "Quaker Houghton",
    family: "Hydroform",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Tiefziehöl für Aluminium und Edelstahl.",
    variants: ["AL 1000", "ST 2000", "DL 3000"],
    nameTemplate: "Hydroform {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Cimcool — weitere
  {
    manufacturer: "Cimcool",
    family: "Cimfree",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Bor-, Formaldehyd- und Aminfreie KSS-Reihe Cimfree.",
    variants: ["1100", "1200", "1300"],
    nameTemplate: "Cimfree {v}",
    variantLabel: "plain",
  },
  // Rhenus Lub — weitere
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus PFK",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "PFPE-Hochleistungsfett für extreme Bedingungen.",
    variants: ["1", "2"],
    nameTemplate: "rhenus PFK {v}",
    variantLabel: "nlgi",
    containsMineralOil: false,
  },
  // Master Fluid Solutions — weitere
  {
    manufacturer: "Master Fluid Solutions",
    family: "Master DRAW",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Tiefzieh-Schmierstoffe der Master-DRAW-Reihe.",
    variants: ["FM 105", "1010"],
    nameTemplate: "Master DRAW {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  // Mobil Compressor SHC
  {
    manufacturer: "Mobil",
    family: "Rarus SHC",
    category: "COMPRESSOR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches PAO-Kompressoröl für Hochleistungs-Schrauben-Kompressoren.",
    variants: ["1024", "1025", "1026", "1027"],
    nameTemplate: "Rarus SHC {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Mobil",
    family: "Rarus",
    category: "COMPRESSOR_OIL",
    chemistry: "MINERAL",
    description: "Mineralisches Kompressoröl für Schraubenkompressoren.",
    variants: ["424", "425", "426", "427", "429"],
    nameTemplate: "Rarus {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
];

const mfgCache = new Map<string, { id: string; name: string }>();
async function resolveManufacturer(name: string) {
  const k = name.toLowerCase().trim();
  if (mfgCache.has(k)) return mfgCache.get(k)!;
  const m = await prisma.manufacturer.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (m) {
    mfgCache.set(k, { id: m.id, name: m.name });
    return { id: m.id, name: m.name };
  }
  return null;
}

async function main() {
  let created = 0;
  let updated = 0;
  let skippedNoMfg = 0;

  for (const fam of FAMILIES) {
    const mfg = await resolveManufacturer(fam.manufacturer);
    if (!mfg) {
      skippedNoMfg += fam.variants.length;
      continue;
    }
    for (const v of fam.variants) {
      const name = fam.nameTemplate.replace("{v}", v).replace(/\s+/g, " ").trim();
      const productSlug = slug(name);
      let viscosityIso: string | undefined;
      if (fam.variantLabel === "iso-vg" && /^\d+$/.test(v)) viscosityIso = `ISO VG ${v}`;
      const data = {
        name,
        slug: productSlug,
        category: fam.category,
        chemistry: fam.chemistry,
        description: fam.description,
        productFamily: fam.family,
        certifications: fam.certifications ?? [],
        containsMineralOil: fam.containsMineralOil ?? undefined,
        viscosityIso,
        sourceConfidence: "modelliert" as const,
        notes: `Auto-generiert (Welle 3).`,
      };
      const existing = await prisma.product.findUnique({
        where: { manufacturerId_slug: { manufacturerId: mfg.id, slug: productSlug } },
      });
      if (existing) {
        updated++;
      } else {
        await prisma.product.create({ data: { ...data, manufacturerId: mfg.id } });
        created++;
      }
    }
  }
  console.log(`Welle 3: ${created} neu, ${updated} bestehen, ${skippedNoMfg} übersprungen.`);
  const total = await prisma.product.count();
  console.log(`DB-Stand: ${total} Produkte`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
