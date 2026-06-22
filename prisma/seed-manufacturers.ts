/**
 * Seed der Hersteller/Lieferanten-Stammdaten.
 *
 * Quelle der Stammdaten:
 *   - logoPath: Dateien in public/brand-logos/
 *   - name, businessFocus, country: redaktionell (Branchenkenntnis)
 *   - website: offizielle Hersteller-Domains
 *   - productFamilies, knownForApplications: vorläufig leer,
 *     wird in Etappe 2 (Web-Anreicherung) via WebFetch nachgezogen
 *
 * Idempotent: läuft via upsert auf slug.
 *
 * Aufruf:
 *   npx tsx prisma/seed-manufacturers.ts
 */
import { PrismaClient, BusinessFocus } from "@prisma/client";

const prisma = new PrismaClient();

type Seed = {
  name: string;
  slug: string;
  logoFile: string;
  website?: string;
  headquartersCountry?: string;
  headquartersCity?: string;
  businessFocus: BusinessFocus[];
  productFamilies?: string[];
  knownForApplications?: string[];
  description?: string;
};

const MANUFACTURERS: Seed[] = [
  {
    name: "Avia Bantleon",
    slug: "avia-bantleon",
    logoFile: "AviaBantleonLogo.png",
    website: "https://www.bantleon.de",
    headquartersCountry: "DE",
    headquartersCity: "Ulm",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE"],
  },
  {
    name: "BASF",
    slug: "basf",
    logoFile: "BASFLogo.png",
    website: "https://www.basf.com",
    headquartersCountry: "DE",
    headquartersCity: "Ludwigshafen",
    businessFocus: ["CHEMICAL_SUPPLIER", "ADDITIVE"],
  },
  {
    name: "BayWa",
    slug: "baywa",
    logoFile: "BayWaLogo.png",
    website: "https://www.baywa.de",
    headquartersCountry: "DE",
    headquartersCity: "München",
    businessFocus: ["CHEMICAL_SUPPLIER", "LUBRICANT"],
  },
  {
    name: "Carl Bechem",
    slug: "bechem",
    logoFile: "BechemLogo.png",
    website: "https://www.bechem.com",
    headquartersCountry: "DE",
    headquartersCity: "Hagen",
    businessFocus: ["LUBRICANT", "GREASE", "COOLANT", "NEAT_OIL"],
  },
  {
    name: "Blaser Swisslube",
    slug: "blaser-swisslube",
    logoFile: "BlaserSwisslubeLogo.png",
    website: "https://www.blaser.com",
    headquartersCountry: "CH",
    headquartersCity: "Hasle-Rüegsau",
    businessFocus: ["COOLANT", "NEAT_OIL"],
    productFamilies: ["Blasocut", "Vasco", "Synergy", "B-Cool", "Vegolub"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Tiefbohren"],
  },
  {
    name: "Boss Lubricants",
    slug: "boss-lubricants",
    logoFile: "BossLunricantsLogo.png",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "Brenntag",
    slug: "brenntag",
    logoFile: "BrenntagLogo.png",
    website: "https://www.brenntag.com",
    headquartersCountry: "DE",
    headquartersCity: "Essen",
    businessFocus: ["CHEMICAL_SUPPLIER"],
    description: "Globaler Chemie-Distributor (auch Schmierstoffe und KSS).",
  },
  {
    name: "Castrol",
    slug: "castrol",
    logoFile: "CastrolLogo.png",
    website: "https://www.castrol.com",
    headquartersCountry: "GB",
    headquartersCity: "Pangbourne",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE"],
    productFamilies: ["Hyspin", "Variocut", "Honilo", "Syntilo", "Hysol"],
  },
  {
    name: "Cimcool",
    slug: "cimcool",
    logoFile: "CimcoolLogo.png",
    website: "https://www.cimcool.com",
    headquartersCountry: "NL",
    headquartersCity: "Vlaardingen",
    businessFocus: ["COOLANT", "CLEANER", "CORROSION_PROTECTION"],
    productFamilies: ["Cimstar", "Cimperial", "Cimtech", "Cimguard", "Cimfree"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen"],
  },
  {
    name: "Curtis",
    slug: "curtis",
    logoFile: "CurtisLogo.png",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "Divinol",
    slug: "divinol",
    logoFile: "Divinol.png",
    website: "https://www.divinol.de",
    headquartersCountry: "DE",
    headquartersCity: "Eislingen",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE"],
    description: "Marke der Zeller+Gmelin GmbH.",
  },
  {
    name: "Esgemo",
    slug: "esgemo",
    logoFile: "EsgemoLogo.png",
    businessFocus: ["COOLANT", "CLEANER"],
  },
  {
    name: "Esso",
    slug: "esso",
    logoFile: "EssoLogo.png",
    website: "https://www.esso.com",
    headquartersCountry: "US",
    businessFocus: ["LUBRICANT"],
    description: "Marke der ExxonMobil.",
  },
  {
    name: "Finke Mineralölwerk",
    slug: "finke",
    logoFile: "FinkeLogo.png",
    website: "https://www.finke-mineraloel.de",
    headquartersCountry: "DE",
    headquartersCity: "Visselhövede",
    businessFocus: ["LUBRICANT", "COOLANT"],
    productFamilies: ["Aviaticon", "Finke", "Aviatic"],
  },
  {
    name: "Fuchs",
    slug: "fuchs",
    logoFile: "FuchsLogo.png",
    website: "https://www.fuchs.com",
    headquartersCountry: "DE",
    headquartersCity: "Mannheim",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE", "NEAT_OIL", "CORROSION_PROTECTION"],
    productFamilies: ["Ecocool", "Renoform", "Renolin", "Plantocut", "Anticorit", "Renofluid"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Umformen", "Stanzen"],
  },
  {
    name: "Hebro Chemie",
    slug: "hebro-chemie",
    logoFile: "HebroLogo.png",
    website: "https://www.hebro-chemie.de",
    headquartersCountry: "DE",
    headquartersCity: "Mönchengladbach",
    businessFocus: ["COOLANT", "CLEANER", "CORROSION_PROTECTION"],
  },
  {
    name: "Henkel",
    slug: "henkel",
    logoFile: "HenkelLogo.png",
    website: "https://www.henkel.com",
    headquartersCountry: "DE",
    headquartersCity: "Düsseldorf",
    businessFocus: ["ADDITIVE", "CLEANER", "CORROSION_PROTECTION"],
    productFamilies: ["Loctite", "Bonderite", "Multan", "P3"],
  },
  {
    name: "Jokisch",
    slug: "jokisch",
    logoFile: "JokischLogo.png",
    website: "https://www.jokisch-fluids.de",
    headquartersCountry: "DE",
    headquartersCity: "Herford",
    businessFocus: ["COOLANT", "NEAT_OIL", "CORROSION_PROTECTION"],
    productFamilies: ["AGNI", "Eco-Cool", "JokiSint", "JokiCut"],
  },
  {
    name: "Chemische Werke Kluthe",
    slug: "kluthe",
    logoFile: "KlutheLogo.png",
    website: "https://www.kluthe.com",
    headquartersCountry: "DE",
    headquartersCity: "Heidelberg",
    businessFocus: ["CLEANER", "COOLANT", "CORROSION_PROTECTION"],
    productFamilies: ["Hakuform", "Hakuwerk", "Hakupur"],
  },
  {
    name: "Klüber Lubrication",
    slug: "klueber",
    logoFile: "KlüberLogo.png",
    website: "https://www.klueber.com",
    headquartersCountry: "DE",
    headquartersCity: "München",
    businessFocus: ["LUBRICANT", "GREASE"],
    productFamilies: ["Klüberoil", "Klübersynth", "Klüberplus", "Polylub", "Wolfracoat"],
    description: "Spezialschmierstoffe, Freudenberg-Tochter.",
  },
  {
    name: "Lämmle Chemie",
    slug: "laemmle",
    logoFile: "LaemmleLogo.png",
    website: "https://www.laemmle-chemie.de",
    headquartersCountry: "DE",
    businessFocus: ["LUBRICANT", "COOLANT", "CLEANER"],
    productFamilies: ["Panolin"],
  },
  {
    name: "Lubrizol",
    slug: "lubrizol",
    logoFile: "LubrizolLogo.png",
    website: "https://www.lubrizol.com",
    headquartersCountry: "US",
    headquartersCity: "Wickliffe, Ohio",
    businessFocus: ["ADDITIVE"],
    description: "Additiv-Hersteller — keine fertigen Schmierstoffe.",
  },
  {
    name: "ML Lubrication",
    slug: "ml-lubrication",
    logoFile: "MLLubricationLogo.png",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "Master Fluid Solutions",
    slug: "master-fluid-solutions",
    logoFile: "MasterFluidLogo.png",
    website: "https://www.masterfluidsolutions.com",
    headquartersCountry: "US",
    headquartersCity: "Perrysburg, Ohio",
    businessFocus: ["COOLANT", "CLEANER", "CORROSION_PROTECTION"],
    productFamilies: ["TRIM", "MasterCool", "MasterChem", "WEDOLiT"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Tiefbohren", "Honen"],
  },
  {
    name: "Motul",
    slug: "motul",
    logoFile: "MotulLogo.png",
    website: "https://www.motul.com",
    headquartersCountry: "FR",
    headquartersCity: "Aubervilliers",
    businessFocus: ["LUBRICANT"],
    productFamilies: ["Motul Tech", "Supracool", "Safcool", "Safcut"],
  },
  {
    name: "OKS Spezialschmierstoffe",
    slug: "oks",
    logoFile: "OKSLogo.png",
    website: "https://www.oks-germany.com",
    headquartersCountry: "DE",
    headquartersCity: "Maisach",
    businessFocus: ["LUBRICANT", "GREASE"],
    description: "Spezialschmierstoffe — Hochtemperatur, Lebensmittel (H1), Vakuum.",
  },
  {
    name: "oelheld",
    slug: "oelheld",
    logoFile: "OelheldLogo.png",
    website: "https://www.oelheld.de",
    headquartersCountry: "DE",
    headquartersCity: "Stuttgart",
    businessFocus: ["NEAT_OIL", "COOLANT"],
    productFamilies: ["IonoPlus", "SintoGrind", "SintoCool", "SintoForm"],
    knownForApplications: ["Schleifen", "Honen", "Senkerodieren", "Drahterodieren"],
    description: "Spezialist für Schleif- und Erodieröle.",
  },
  {
    name: "Oemeta",
    slug: "oemeta",
    logoFile: "OemetaLogo.png",
    website: "https://www.oemeta.com",
    headquartersCountry: "DE",
    headquartersCity: "Uetersen",
    businessFocus: ["COOLANT", "CLEANER", "CORROSION_PROTECTION"],
    productFamilies: ["Hycut", "Estracool", "Novamet", "Oemetan"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Tiefbohren"],
  },
  {
    name: "Oest",
    slug: "oest",
    logoFile: "OestLogo.png",
    website: "https://www.oest.de",
    headquartersCountry: "DE",
    headquartersCity: "Freudenstadt",
    businessFocus: ["LUBRICANT", "CHEMICAL_SUPPLIER"],
  },
  {
    name: "Petrofer",
    slug: "petrofer",
    logoFile: "PetroferLogo.png",
    website: "https://www.petrofer.com",
    headquartersCountry: "DE",
    headquartersCity: "Hildesheim",
    businessFocus: ["COOLANT", "NEAT_OIL", "CORROSION_PROTECTION", "LUBRICANT"],
    productFamilies: ["Isocut", "Isogrind", "Isodraw", "Feroform", "Petrocool"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Umformen", "Wärmebehandlung"],
  },
  {
    name: "Petronas",
    slug: "petronas",
    logoFile: "PetronasLogo.png",
    website: "https://www.pli-petronas.com",
    headquartersCountry: "MY",
    headquartersCity: "Kuala Lumpur",
    businessFocus: ["LUBRICANT", "COOLANT"],
    productFamilies: ["Syntium", "Hydro", "Mecafluid", "Compressor"],
  },
  {
    name: "Rheinol",
    slug: "rheinol",
    logoFile: "RheinolLogo.png",
    website: "https://www.rheinol.de",
    headquartersCountry: "DE",
    headquartersCity: "Aachen",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "Rhenus Lub",
    slug: "rhenus-lub",
    logoFile: "RhenusLogo.png",
    website: "https://www.rhenuslub.de",
    headquartersCountry: "DE",
    headquartersCity: "Mönchengladbach",
    businessFocus: ["COOLANT", "NEAT_OIL", "GREASE", "CORROSION_PROTECTION"],
    productFamilies: ["Rhenus", "norma", "Pluscut", "rhenusol"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Stanzen"],
  },
  {
    name: "ROWE",
    slug: "rowe",
    logoFile: "RoweLogo.png",
    website: "https://www.rowe-oil.com",
    headquartersCountry: "DE",
    headquartersCity: "Worms",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "SRS",
    slug: "srs",
    logoFile: "SRSLogo.png",
    website: "https://www.srs-oel.de",
    headquartersCountry: "DE",
    headquartersCity: "Salzbergen",
    businessFocus: ["LUBRICANT"],
    description: "Schmierstoff Raffinerie Salzbergen, H&R-Gruppe.",
  },
  {
    name: "Shell",
    slug: "shell",
    logoFile: "ShellLogo.png",
    website: "https://www.shell.com/business-customers/lubricants",
    headquartersCountry: "GB",
    headquartersCity: "London",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE"],
    productFamilies: ["Tellus", "Omala", "Gadus", "Rimula", "Dromus", "Garia", "Adrana"],
  },
  {
    name: "TotalEnergies",
    slug: "totalenergies",
    logoFile: "TotalEnergiesLogo.png",
    website: "https://lubricants.totalenergies.com",
    headquartersCountry: "FR",
    headquartersCity: "Paris",
    businessFocus: ["LUBRICANT", "COOLANT", "GREASE"],
    productFamilies: ["Azolla", "Carter", "Multis", "Spirit", "Vulsol", "Lactuca", "Spiragri"],
  },
  {
    name: "Unitech",
    slug: "unitech",
    logoFile: "UnitechLogo.png",
    businessFocus: ["LUBRICANT"],
  },
  {
    name: "Zeller+Gmelin",
    slug: "zeller-gmelin",
    logoFile: "ZellerGmelinLogo.png",
    website: "https://www.zeller-gmelin.de",
    headquartersCountry: "DE",
    headquartersCity: "Eislingen",
    businessFocus: ["LUBRICANT", "COOLANT", "NEAT_OIL", "GREASE"],
    productFamilies: ["Divinol", "Multipress", "Synergy", "Zubora"],
    knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Umformen"],
  },
  {
    name: "Zett-Chemie",
    slug: "zett-chemie",
    logoFile: "ZettChemieLogo.png",
    website: "https://www.zett-chemie.com",
    headquartersCountry: "DE",
    businessFocus: ["COOLANT", "CLEANER", "CORROSION_PROTECTION"],
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;
  for (const m of MANUFACTURERS) {
    const logoPath = `/brand-logos/${m.logoFile}`;
    const existing = await prisma.manufacturer.findUnique({ where: { slug: m.slug } });
    await prisma.manufacturer.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        logoPath,
        website: m.website ?? null,
        headquartersCountry: m.headquartersCountry ?? null,
        headquartersCity: m.headquartersCity ?? null,
        businessFocus: m.businessFocus,
        productFamilies: m.productFamilies ?? [],
        knownForApplications: m.knownForApplications ?? [],
        description: m.description ?? null,
      },
      create: {
        name: m.name,
        slug: m.slug,
        logoPath,
        website: m.website ?? null,
        headquartersCountry: m.headquartersCountry ?? null,
        headquartersCity: m.headquartersCity ?? null,
        businessFocus: m.businessFocus,
        productFamilies: m.productFamilies ?? [],
        knownForApplications: m.knownForApplications ?? [],
        description: m.description ?? null,
      },
    });
    existing ? updated++ : inserted++;
  }
  const total = await prisma.manufacturer.count();
  console.log(`Manufacturer-Seed: ${inserted} angelegt, ${updated} aktualisiert. DB-Gesamtbestand: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
