// Ergänzende Hersteller, die durch die SDS-Massenimporte aufgekommen sind
// aber noch keinen Eintrag in der Manufacturer-Tabelle haben.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EXTRA = [
  {
    name: "BP",
    website: "https://www.bp.com",
    headquartersCountry: "GB",
    headquartersCity: "London",
    description: "Globaler Energiekonzern, Schmierstoffsparte über Castrol-Marke.",
    businessFocus: ["LUBRICANT", "CHEMICAL_SUPPLIER"] as const,
  },
  {
    name: "Cepsa",
    website: "https://www.cepsa.com",
    headquartersCountry: "ES",
    headquartersCity: "Madrid",
    description: "Spanischer Mineralöl- und Chemiekonzern, Schmierstoff-Sparte für Industrie und Automotive.",
    businessFocus: ["LUBRICANT", "CHEMICAL_SUPPLIER"] as const,
  },
  {
    name: "Eni",
    website: "https://www.eni.com",
    headquartersCountry: "IT",
    headquartersCity: "Rom",
    description: "Italienischer Mineralölkonzern. Schmierstoffe unter den Marken Eni und Agip.",
    businessFocus: ["LUBRICANT", "CHEMICAL_SUPPLIER"] as const,
    productFamilies: ["Blasia", "OSO", "Agip"],
  },
  {
    name: "LE",
    website: "https://www.le-international.com",
    headquartersCountry: "US",
    headquartersCity: "Wichita",
    description: "Lubrication Engineers — Hochleistungs-Schmierstoffe für Industrie.",
    businessFocus: ["LUBRICANT", "GREASE"] as const,
    productFamilies: ["Almagard", "Quinplex"],
  },
  {
    name: "Laemmle/Panolin",
    website: "https://www.panolin.com",
    headquartersCountry: "CH",
    headquartersCity: "Madetswil",
    description: "Schweizer Hersteller bioabbaubarer Hochleistungs-Schmierstoffe (Ester-basiert). Lämmle ist DE-Vertriebspartner.",
    businessFocus: ["LUBRICANT"] as const,
    productFamilies: ["Panolin HLP SYNTH"],
  },
  {
    name: "Liebherr",
    website: "https://www.liebherr.com",
    headquartersCountry: "DE",
    headquartersCity: "Kirchdorf",
    description: "Maschinenbau-Konzern; Schmierstoffe für eigene Hydraulik- und Antriebskomponenten.",
    businessFocus: ["GREASE", "LUBRICANT"] as const,
  },
  {
    name: "Liqui Moly",
    website: "https://www.liqui-moly.com",
    headquartersCountry: "DE",
    headquartersCity: "Ulm",
    description: "Deutscher Hersteller von Schmierstoffen, Additiven und Pflegemitteln für Automotive und Industrie.",
    businessFocus: ["LUBRICANT", "ADDITIVE"] as const,
  },
  {
    name: "Lubriplate",
    website: "https://www.lubriplate.com",
    headquartersCountry: "US",
    headquartersCity: "Newark",
    description: "US-Hersteller von Industrie-Schmierstoffen, NSF-H1-Lebensmittel-Schmierstoffe.",
    businessFocus: ["GREASE", "LUBRICANT"] as const,
  },
  {
    name: "Nils",
    website: "https://www.nils.it",
    headquartersCountry: "IT",
    headquartersCity: "Pieve di Bono",
    description: "Italienischer Hersteller von Spezialschmierstoffen und Fetten.",
    businessFocus: ["GREASE", "LUBRICANT"] as const,
  },
  {
    name: "Q8Oils",
    website: "https://www.q8oils.com",
    headquartersCountry: "KW",
    headquartersCity: "Kuwait City",
    description: "Schmierstoff-Sparte von Kuwait Petroleum (Q8). Europ. Hauptsitz in Antwerpen.",
    businessFocus: ["LUBRICANT", "CHEMICAL_SUPPLIER"] as const,
  },
  {
    name: "Quaker Houghton",
    website: "https://www.quakerhoughton.com",
    headquartersCountry: "US",
    headquartersCity: "Conshohocken",
    description: "Globaler Marktführer für Process-Fluids und KSS. Fusion aus Quaker Chemical (2019) und Houghton International.",
    businessFocus: ["COOLANT", "NEAT_OIL", "CORROSION_PROTECTION", "CLEANER"] as const,
    productFamilies: ["Hocut", "Cindol", "Rust-Veto"],
  },
  {
    name: "ROCOL",
    website: "https://www.rocol.com",
    headquartersCountry: "GB",
    headquartersCity: "Leeds",
    description: "UK-Hersteller industrieller Schmierstoffe (ITW), Fokus Lebensmittel-Schmierstoffe (Foodlube).",
    businessFocus: ["GREASE", "LUBRICANT"] as const,
    productFamilies: ["Foodlube"],
  },
  {
    name: "SKF",
    website: "https://www.skf.com",
    headquartersCountry: "SE",
    headquartersCity: "Göteborg",
    description: "Weltmarktführer für Wälzlager, eigene Schmierfett-Produktlinie (LGMT, LGEP, LGHB ua.).",
    businessFocus: ["GREASE"] as const,
    productFamilies: ["LGEP", "LGHB", "LGMT"],
  },
  {
    name: "SMW-AUTOBLOK",
    website: "https://www.smwautoblok.com",
    headquartersCountry: "IT",
    headquartersCity: "Caprie",
    description: "Spanntechnik-Hersteller, eigene Pflegeschmierstoffe für Spannfutter (z.B. K67).",
    businessFocus: ["GREASE"] as const,
  },
  {
    name: "perma",
    website: "https://www.perma-tec.com",
    headquartersCountry: "DE",
    headquartersCity: "Euerdorf",
    description: "Spezialist für automatische Einpunkt-Schmierung (Stempel-Schmierstoffgeber). Schmierfette und -öle.",
    businessFocus: ["GREASE", "LUBRICANT"] as const,
    productFamilies: ["MULTI"],
  },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const m of EXTRA) {
    const slugStr = slug(m.name);
    const existing = await prisma.manufacturer.findUnique({ where: { name: m.name } });
    if (existing) {
      updated++;
      continue;
    }
    await prisma.manufacturer.create({
      data: {
        name: m.name,
        slug: slugStr,
        website: m.website,
        headquartersCountry: m.headquartersCountry,
        headquartersCity: m.headquartersCity,
        description: m.description,
        businessFocus: [...m.businessFocus],
        productFamilies: m.productFamilies ?? [],
      },
    });
    created++;
  }
  console.log(`Hersteller: ${created} neu, ${updated} bestehen bereits`);
  const total = await prisma.manufacturer.count();
  console.log(`DB-Stand: ${total} Hersteller`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
