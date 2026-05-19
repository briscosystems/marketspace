/**
 * Web-Anreicherung für die 6 Hersteller, deren Basis-Seed dünn war.
 *
 * Quellen siehe Inline-Kommentare. Anreicherung basiert auf öffentlich
 * zugänglichen Hersteller-Websites + Branchenverzeichnisse, abgerufen
 * im Mai 2026.
 *
 * Aufruf:
 *   npx tsx prisma/enrich-manufacturers.ts
 */
import { PrismaClient, BusinessFocus } from "@prisma/client";

const prisma = new PrismaClient();

type Patch = {
  slug: string;
  data: {
    name?: string;
    website?: string;
    headquartersCountry?: string;
    headquartersCity?: string;
    businessFocus?: BusinessFocus[];
    productFamilies?: string[];
    knownForApplications?: string[];
    description?: string;
  };
};

const PATCHES: Patch[] = [
  {
    // Quelle: curtis-systems.de — Mosbach/DE-Region, KSS-Hersteller
    // (Curtis Fluids USA existiert auch; Brisco-Kontext = DE/CH-Markt)
    slug: "curtis",
    data: {
      name: "Curtis Systems",
      website: "https://curtis-systems.de",
      headquartersCountry: "DE",
      businessFocus: ["COOLANT", "NEAT_OIL"],
      description: "Kühlschmierstoff- und Schneidöl-Hersteller.",
    },
  },
  {
    // Quelle: esgemo.de
    slug: "esgemo",
    data: {
      name: "Esgemo Schmierstofftechnik",
      website: "https://www.esgemo.de",
      headquartersCountry: "DE",
      headquartersCity: "Mosbach",
      businessFocus: ["COOLANT", "NEAT_OIL", "CLEANER"],
      productFamilies: ["esgeCool", "esgeGrind", "esgeForm"],
      knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Senkerodieren", "Stanzen"],
      description: "Kühlschmierstoffe, Schleiföle, Dielektrika, Stanz-/Umformöle. Mitglied VSI/FDPW.",
    },
  },
  {
    // Quelle: ml-lubrication.com — Schweinfurt
    slug: "ml-lubrication",
    data: {
      name: "ML Lubrication",
      website: "https://www.ml-lubrication.com",
      headquartersCountry: "DE",
      headquartersCity: "Schweinfurt",
      foundedYear: 1981,
      businessFocus: ["COOLANT", "NEAT_OIL", "CLEANER", "CORROSION_PROTECTION"],
      knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Umformen"],
      description: "Spezialschmierstoffe ursprünglich für die Wälzlagerindustrie (Schweinfurt). Aerospace, Automotive, Medical. Niederlassungen in USA und China.",
    } as Patch["data"],
  },
  {
    // Quelle: unitech-lubricants.com — primär CA/DE
    slug: "unitech",
    data: {
      name: "Unitech Lubricants",
      website: "https://unitech-lubricants.com",
      headquartersCountry: "DE",
      headquartersCity: "Albstadt-Ebingen",
      businessFocus: ["COOLANT", "NEAT_OIL", "CLEANER", "CORROSION_PROTECTION"],
      productFamilies: ["MSA", "HOSMAC", "PURGON"],
      knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Tiefbohren", "Honen", "Tiefziehen", "Walzen", "Stanzen"],
      description: "Unitech Kühlschmierstoffe (DE) mit Schwesterfirma Unitech Lubricants America (Waterloo, ON). ISO 9001/14001 zertifiziert.",
    },
  },
  {
    // Quelle: zet-chemie.de (Markenname offiziell ZET-CHEMIE, ein "T")
    slug: "zett-chemie",
    data: {
      name: "ZET-Chemie",
      website: "https://www.zet-chemie.de",
      headquartersCountry: "DE",
      businessFocus: ["COOLANT", "NEAT_OIL", "CLEANER", "CORROSION_PROTECTION", "LUBRICANT", "GREASE"],
      knownForApplications: ["Drehen", "Fräsen", "Schleifen", "Stanzen", "Umformen"],
      description: "Kühlschmierstoffe, Schleif-/Schneidöle, Korrosionsschutz, Reiniger. Mineralöl-freie Formulierungen für Stahl, Guss, Aluminium, Buntmetalle, Hartmetalle.",
    },
  },
  {
    // Quelle: bosslubricants.com — seit Jan 2025 Teil der Fuchs-Gruppe
    slug: "boss-lubricants",
    data: {
      name: "Boss Lubricants",
      website: "https://www.bosslubricants.com",
      headquartersCountry: "DE",
      headquartersCity: "Albstadt",
      businessFocus: ["LUBRICANT", "GREASE", "COOLANT"],
      knownForApplications: ["Medizintechnik", "Sicherheitstechnik", "Metallbearbeitung", "Maschinenbau"],
      description: "Spezialschmierstoffe für Medizin-, Sicherheits- und Metallbearbeitungstechnik. Seit Januar 2025 Teil der Fuchs-Gruppe.",
    },
  },
];

async function main() {
  let ok = 0;
  for (const p of PATCHES) {
    await prisma.manufacturer.update({
      where: { slug: p.slug },
      data: p.data,
    });
    ok++;
  }
  console.log(`Anreicherung: ${ok}/${PATCHES.length} Hersteller aktualisiert.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
