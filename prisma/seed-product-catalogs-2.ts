// Zweite Welle Produkt-Katalog-Templates — weitere Familien, kleinere Hersteller,
// erweiterte Reihen. Selbe Mechanik wie seed-product-catalogs.ts.

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
type ProductCategory =
  | "COOLANT_WATER_MIX"
  | "COOLANT_NEAT"
  | "GRINDING_OIL"
  | "EDM_FLUID"
  | "HYDRAULIC_OIL"
  | "GEAR_OIL"
  | "COMPRESSOR_OIL"
  | "SLIDEWAY_OIL"
  | "FORMING_OIL"
  | "CLEANER"
  | "CORROSION_PROTECTION"
  | "GREASE"
  | "SPECIALTY"
  | "OTHER";

type Family = {
  manufacturer: string;
  family: string;
  category: ProductCategory;
  chemistry: ChemistryBase;
  description: string;
  certifications?: string[];
  variants: string[];
  nameTemplate: string;
  variantLabel?: "iso-vg" | "sae" | "nlgi" | "plain";
  containsMineralOil?: boolean;
  productFamily?: string;
};

// ────────────────────────────────────────────────────────────────────────────
const FAMILIES: Family[] = [
  // ═══ Mobil — weitere Reihen ═══
  {
    manufacturer: "Mobil",
    family: "Mobil Velocite",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Premium-Spindel-/Schleifspindelöl mit niedrigem Verdampfungsverlust.",
    variants: ["No 3", "No 6", "No 10"],
    nameTemplate: "Velocite {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobil Vacuoline",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Bahn-/Walz-/Streichöl-Reihe.",
    variants: ["146", "525", "528", "533", "537", "1409"],
    nameTemplate: "Vacuoline {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobil Almo 500",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Spezialöl für Druckluft-Werkzeuge und Pneumatik.",
    variants: ["525", "527", "529"],
    nameTemplate: "Almo {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobiltherm",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Wärmeträgeröl für indirekte Beheizungsanlagen.",
    variants: ["605", "603"],
    nameTemplate: "Mobiltherm {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobilcut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Mobile wassermischbare KSS-Reihe.",
    variants: ["140", "230", "250", "320 Plus", "452"],
    nameTemplate: "Mobilcut {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Mobil",
    family: "Mobilmet",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöl-Reihe.",
    variants: ["763", "766", "423", "426", "443"],
    nameTemplate: "Mobilmet {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Shell — weitere Reihen ═══
  {
    manufacturer: "Shell",
    family: "Shell Garia",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl mit hohem Klebstoff für Werkzeugmaschinen.",
    variants: ["68", "220"],
    nameTemplate: "Garia {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Shell Naturelle",
    category: "HYDRAULIC_OIL",
    chemistry: "ESTER",
    description: "Bioabbaubares Hydrauliköl auf Ester-Basis.",
    certifications: ["ISO 15380 HEES"],
    variants: ["HF-E 32", "HF-E 46", "HF-E 68"],
    nameTemplate: "Naturelle {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Shell Macron",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Umform-/Stanzöl für Karosseriebleche.",
    variants: ["DFK 350", "DFK 600", "EDM 110"],
    nameTemplate: "Macron {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Shell Adrana",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "KSS-Konzentrate mit High-Performance-Additivierung.",
    variants: ["AS 1010", "D 207.01", "D 405.01"],
    nameTemplate: "Adrana {v}",
    variantLabel: "plain",
  },

  // ═══ Castrol — weitere Reihen ═══
  {
    manufacturer: "Castrol",
    family: "Castrol Magnatec",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Pkw-Motoröl mit intelligenten Molekülen für Kaltstartschutz.",
    variants: ["Professional A5 5W-30", "5W-30 C3", "5W-40", "10W-40 A3/B4"],
    nameTemplate: "Magnatec {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Castrol",
    family: "Castrol Iloform",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Umform-/Tiefzieh-Schmierstoffe.",
    variants: ["PN 305", "TDN 81", "BWN 6", "FST 4"],
    nameTemplate: "Iloform {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Castrol Ilocut",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöle.",
    variants: ["EDM 110", "EDM 220", "GT 250", "1530"],
    nameTemplate: "Ilocut {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Castrol Optigear",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Hochleistungs-Getriebeöl-Reihe Optigear.",
    variants: ["BM 100", "BM 220", "BM 320", "BM 460", "Synthetic X 220", "Synthetic X 320"],
    nameTemplate: "Optigear {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Castrol",
    family: "Castrol Spheerol",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett für Wälzlager und allgemeine Schmierung.",
    variants: ["EPL 1", "EPL 2", "AP 2"],
    nameTemplate: "Spheerol {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Fuchs — weitere ═══
  {
    manufacturer: "Fuchs",
    family: "Renolin MR",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HM-Hydrauliköl der Renolin-MR-Reihe.",
    variants: ["10", "15", "22", "32", "46"],
    nameTemplate: "Renolin MR {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renep",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl-Reihe Renep mit hoher EP-Performance.",
    variants: ["1", "2", "3", "Compound 104", "Compound 105", "Compound 106"],
    nameTemplate: "Renep {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renogear",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches PAO-Getriebeöl Renogear.",
    variants: ["SUPER 8090 80W-90", "WT 8090 75W-90", "VCI 320", "VCI 460"],
    nameTemplate: "Renogear {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Anticorit",
    category: "CORROSION_PROTECTION",
    chemistry: "MINERAL",
    description: "Korrosionsschutzöle und -fette Anticorit.",
    variants: ["DFW 8400", "RP 4107S", "VCI 369", "PL 3802-39 S"],
    nameTemplate: "Anticorit {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Stabyl",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Komplex-Fette Stabyl für hochbelastete Industrie-Lager.",
    variants: ["LT 50", "EOS HD", "ULTRA EP 1.5", "TA"],
    nameTemplate: "Stabyl {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Wisura",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöl-Reihe für Stahl/Edelstahl/NE-Metalle.",
    variants: ["S 4000355515", "S 4000355533"],
    nameTemplate: "Wisura {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Maintain",
    category: "SPECIALTY",
    chemistry: "OTHER",
    description: "Servicepflegemittel Maintain (Kühler, Bremsen, Klima).",
    variants: ["Fricofin"],
    nameTemplate: "Maintain {v}",
    variantLabel: "plain",
  },

  // ═══ Klüber — weitere Reihen ═══
  {
    manufacturer: "Klüber Lubrication",
    family: "Centoplex",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett mit gutem Korrosionsschutz.",
    variants: ["1 DL", "2 EP", "GLP 500"],
    nameTemplate: "Centoplex {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Petamo",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Hochtemperatur-Polyharnstoff-Schmierfett für Elektromotoren-Lager.",
    variants: ["GHY 133 N", "GY 193"],
    nameTemplate: "Petamo {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Klüberbio",
    category: "GREASE",
    chemistry: "ESTER",
    description: "Bioabbaubare Schmierstoffe Klüberbio.",
    variants: ["RM 2-150", "C 5-32", "M 32-82"],
    nameTemplate: "Klüberbio {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Grafloscon",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Hochtemperatur-Graphit-Trockenschmierstoff für offene Zahnräder.",
    variants: ["A-G 1 Ultra", "C-SG 2000 Ultra"],
    nameTemplate: "Grafloscon {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Wolfracoat",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Wolframdisulfid-Hochleistungspaste für Montage und Tieftemperatur.",
    variants: ["C Spray", "Fluid", "Powder"],
    nameTemplate: "Wolfracoat {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ TotalEnergies — weitere ═══
  {
    manufacturer: "TotalEnergies",
    family: "Hydransafe HFC",
    category: "HYDRAULIC_OIL",
    chemistry: "PAG",
    description: "Schwer-entflammbare wasserhaltige Hydraulikflüssigkeit (HFC, PAG).",
    variants: ["46", "68", "100"],
    nameTemplate: "Hydransafe HFC {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Drosera MS",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl für Werkzeugmaschinen-Schlittenführungen.",
    variants: ["32", "68", "220"],
    nameTemplate: "Drosera MS {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Lactuca",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Umform-/Tiefzieh-Schmierstoffe Lactuca.",
    variants: ["MS 7000", "EP 290 S", "WS 800"],
    nameTemplate: "Lactuca {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Spirit",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe Spirit.",
    variants: ["MS 7000", "MS 5000", "MS 3000"],
    nameTemplate: "Spirit {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "TotalEnergies",
    family: "Vulsol",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Mineralöl-haltige KSS-Emulsion.",
    variants: ["MSF 200", "ECF 31"],
    nameTemplate: "Vulsol {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Caloris",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Wärmeträgeröl für indirekte Beheizung.",
    variants: ["23", "32"],
    nameTemplate: "Caloris {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ BP — weitere ═══
  {
    manufacturer: "BP",
    family: "Bartran HV",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HVLP-Hydrauliköl der Bartran-Reihe.",
    variants: ["32", "46", "68"],
    nameTemplate: "Bartran HV {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Bartran Premium",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Premium-Hydrauliköl für Hochdruck-Industriehydraulik.",
    variants: ["10", "32", "46", "68", "100"],
    nameTemplate: "Bartran Premium {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Energrease Tribol",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Synthetische Tribol-Hochleistungs-Fette (ehemals Klüber).",
    variants: ["GR 1350-2.5 PD", "GR 3020/1000-1 PD", "FoodProof 1810/2-Spray"],
    nameTemplate: "Tribol {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "BP",
    family: "Energol WM",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl für Werkzeugmaschinen.",
    variants: ["32", "68", "220"],
    nameTemplate: "Energol WM {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },

  // ═══ Eni — weitere ═══
  {
    manufacturer: "Eni",
    family: "OTE",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HM-Hydrauliköl für allgemeine Industrieanwendung.",
    variants: ["10", "22", "32", "46", "68", "100"],
    nameTemplate: "Agip OTE {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Eni",
    family: "Aquamet",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe Aquamet.",
    variants: ["MD", "ECO", "Premium"],
    nameTemplate: "Aquamet {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Eni",
    family: "Antifreeze",
    category: "SPECIALTY",
    chemistry: "OTHER",
    description: "Frost-/Kühlerschutz für Verbrennungsmotoren.",
    variants: ["Extra D", "Plus", "Long Life"],
    nameTemplate: "Antifreeze {v}",
    variantLabel: "plain",
  },

  // ═══ Q8Oils — weitere ═══
  {
    manufacturer: "Q8Oils",
    family: "Formula Elite",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Pkw-Motoröl der Formula-Elite-Reihe.",
    variants: ["C2 0W-30", "C3 5W-30", "Long Life 5W-30"],
    nameTemplate: "Formula Elite {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Q8Oils",
    family: "Unishift",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Handschalt-Getriebeöl Unishift.",
    variants: ["PC Synt 75W-80", "75W-90"],
    nameTemplate: "Unishift {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Q8Oils",
    family: "Transformer Oil",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Isolieröl für Trafos (Inhibited).",
    variants: ["I", "II"],
    nameTemplate: "Transformer Oil {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Liqui Moly — weitere ═══
  {
    manufacturer: "Liqui Moly",
    family: "Leichtlauf",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Leichtlauf-Motoröle für moderne Pkw-Motoren.",
    variants: ["High Tech 5W-40", "Performance 5W-30", "Energy 0W-40"],
    nameTemplate: "Leichtlauf {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Liqui Moly",
    family: "MoS2",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "MoS2-haltige Motoröl-Familie.",
    variants: ["Leichtlauf 10W-40", "Leichtlauf 15W-40"],
    nameTemplate: "MoS2 {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Liqui Moly",
    family: "Zentralhydrauliköl",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Zentralhydraulik-Servo-Öl für Pkw.",
    variants: ["1100", "1200", "3088", "7000"],
    nameTemplate: "Zentralhydraulik {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Cimcool — weitere ═══
  {
    manufacturer: "Cimcool",
    family: "Cimtech",
    category: "COOLANT_WATER_MIX",
    chemistry: "SYNTHETIC",
    description: "Synthetische KSS-Reihe Cimtech (transparent).",
    variants: ["310", "320", "410"],
    nameTemplate: "Cimtech {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Cimcool",
    family: "Cimguard",
    category: "CORROSION_PROTECTION",
    chemistry: "MINERAL",
    description: "Korrosionsschutzmittel Cimguard.",
    variants: ["10", "20", "30"],
    nameTemplate: "Cimguard {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Henkel — weitere ═══
  {
    manufacturer: "Henkel",
    family: "Multan",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Multan-KSS-Reihe für die Metallbearbeitung.",
    variants: ["54-2", "61-3", "71-2", "75-2"],
    nameTemplate: "Multan {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Henkel",
    family: "Loctite Industrial",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Loctite-Industrieklebstoffe (im Sinn: Konzentrate/Schmierstoff-Spezialitäten).",
    variants: ["LB 8009", "LB 8023", "LB 8101"],
    nameTemplate: "Loctite {v}",
    variantLabel: "plain",
  },

  // ═══ ROCOL — weitere ═══
  {
    manufacturer: "ROCOL",
    family: "Sapphire",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Sapphire-Hochleistungs-Schmierfette.",
    variants: ["Aqua Sil", "Premier", "Endure", "Hi-Speed"],
    nameTemplate: "Sapphire {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "ROCOL",
    family: "RTD",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "RTD-Schneid-/Gewindeschneidemittel.",
    variants: ["Liquid", "Spray", "Compound", "Paste"],
    nameTemplate: "RTD {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Carl Bechem — weitere ═══
  {
    manufacturer: "Carl Bechem",
    family: "Berucut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe Berucut.",
    variants: ["BC 22 EP", "BC 760", "BC 850"],
    nameTemplate: "Berucut {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Carl Bechem",
    family: "Beruform",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Umformschmierstoffe Beruform.",
    variants: ["TKR 200", "WCS 400", "MK 100"],
    nameTemplate: "Beruform {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Avia Bantleon — weitere ═══
  {
    manufacturer: "Avia Bantleon",
    family: "AVILUB Spindle",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Spindelöl mit niedriger Viskosität.",
    variants: ["VG 10", "VG 22"],
    nameTemplate: "AVILUB Spindle {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Avia Bantleon",
    family: "AVILUB Gear",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl-Reihe.",
    variants: ["RSX 220", "RSX 320", "RSX 460"],
    nameTemplate: "AVILUB Gear {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Petrofer — weitere ═══
  {
    manufacturer: "Petrofer",
    family: "Isohyd",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HLP/HVLP-Hydrauliköl-Reihe.",
    variants: ["HLPD 32", "HLPD 46", "HVLPD 46"],
    nameTemplate: "Isohyd {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Petrofer",
    family: "Ferrocoat",
    category: "CORROSION_PROTECTION",
    chemistry: "MINERAL",
    description: "Korrosionsschutzöle für Stahl-Halbzeuge.",
    variants: ["N 8019", "N 8050"],
    nameTemplate: "Ferrocoat {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ oelheld — weitere ═══
  {
    manufacturer: "oelheld",
    family: "Hydroschliff",
    category: "GRINDING_OIL",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbarer Schleifkühlstoff für Schleif-/Honoperationen.",
    variants: ["L 10", "L 20"],
    nameTemplate: "Hydroschliff {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "oelheld",
    family: "SintoCut",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Hochleistungs-Schneidöl Sinto-Cut.",
    variants: ["Z 28", "Z 32"],
    nameTemplate: "SintoCut {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Rhenus Lub — weitere ═══
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus TF",
    category: "COOLANT_WATER_MIX",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetische KSS-Reihe rhenus TF (transparent).",
    variants: ["3500", "5000", "7800"],
    nameTemplate: "rhenus TF {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus XY",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöle rhenus XY.",
    variants: ["46", "100", "146"],
    nameTemplate: "rhenus XY {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Cepsa — weitere ═══
  {
    manufacturer: "Cepsa",
    family: "Larus",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweck-Wälzlagerfett Cepsa Larus.",
    variants: ["EP-1", "EP-2", "EP-3"],
    nameTemplate: "Larus {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Cepsa",
    family: "Tonna",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl der Cepsa-Tonna-Reihe.",
    variants: ["32", "68", "220"],
    nameTemplate: "Tonna {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },

  // ═══ Divinol — weitere ═══
  {
    manufacturer: "Divinol",
    family: "HV ISO",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HVLP-Hydrauliköl.",
    variants: ["32", "46", "68"],
    nameTemplate: "HV ISO {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Divinol",
    family: "Bohröl",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Klassische Bohrölemulsion auf Mineralöl-Basis.",
    variants: ["B 35", "B 50", "BS"],
    nameTemplate: "Bohröl {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Motul — weitere ═══
  {
    manufacturer: "Motul",
    family: "300V",
    category: "SPECIALTY",
    chemistry: "ESTER",
    description: "Estersynthese-Renn-Motoröl 300V der Motul Sport-Reihe.",
    variants: ["4T Factory Line 10W-40", "4T 5W-40", "Off Road 5W-40", "Power 5W-30"],
    nameTemplate: "300V {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Motul",
    family: "7100",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches 4T-Motorradöl.",
    variants: ["4T 10W-40", "4T 10W-50", "4T 20W-50"],
    nameTemplate: "7100 {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ OKS — weitere ═══
  {
    manufacturer: "OKS Spezialschmierstoffe",
    family: "OKS Reiniger",
    category: "CLEANER",
    chemistry: "OTHER",
    description: "OKS-Industriereiniger und Entfetter.",
    variants: ["2611 Universalreiniger", "2701 Bremsenreiniger", "2611 Spray"],
    nameTemplate: "OKS {v}",
    variantLabel: "plain",
  },

  // ═══ Mobil Industrial — weitere Reihen ═══
  {
    manufacturer: "Mobil",
    family: "Mobil EAL Arctic",
    category: "SPECIALTY",
    chemistry: "ESTER",
    description: "Synthetisches Polyolester-Kältemaschinenöl für HFC-Kältemittel.",
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "EAL Arctic {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Mobil",
    family: "Mobil Glygoyle",
    category: "GEAR_OIL",
    chemistry: "PAG",
    description: "PAG-basiertes synthetisches Industrie-Getriebeöl.",
    variants: ["220", "320", "460", "680"],
    nameTemplate: "Glygoyle {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },

  // ═══ Lubriplate — weitere ═══
  {
    manufacturer: "Lubriplate",
    family: "Lubriplate Heavy Duty",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Heavy-Duty-Lithium-Komplex-Fette der Lubriplate-Reihe.",
    variants: ["No 630-AA", "No 630-2", "Mag-1 EP"],
    nameTemplate: "Lubriplate {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ LE — weitere ═══
  {
    manufacturer: "LE",
    family: "Monolec",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl mit Monolec-Additivierung von LE.",
    variants: ["6402", "6404", "6406", "6408"],
    nameTemplate: "Monolec {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
];

const mfgCache = new Map<string, { id: string; name: string }>();

async function resolveManufacturer(name: string): Promise<{ id: string; name: string } | null> {
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
  let totalGenerated = 0;
  let created = 0;
  let updated = 0;
  let skippedNoMfg = 0;
  const unknownMfg = new Set<string>();

  for (const fam of FAMILIES) {
    const mfg = await resolveManufacturer(fam.manufacturer);
    if (!mfg) {
      skippedNoMfg += fam.variants.length;
      unknownMfg.add(fam.manufacturer);
      continue;
    }
    for (const v of fam.variants) {
      totalGenerated++;
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
        productFamily: fam.productFamily ?? fam.family,
        certifications: fam.certifications ?? [],
        containsMineralOil: fam.containsMineralOil ?? undefined,
        viscosityIso,
        sourceConfidence: "modelliert" as const,
        notes: `Auto-generiert aus Hersteller-Produktreihen-Template (Welle 2).`,
      };

      const existing = await prisma.product.findUnique({
        where: { manufacturerId_slug: { manufacturerId: mfg.id, slug: productSlug } },
      });
      if (existing) {
        const patch: Record<string, unknown> = {};
        if (!existing.description && data.description) patch.description = data.description;
        if (!existing.chemistry && data.chemistry) patch.chemistry = data.chemistry;
        if (!existing.productFamily && data.productFamily) patch.productFamily = data.productFamily;
        if (existing.certifications.length === 0 && data.certifications.length > 0)
          patch.certifications = data.certifications;
        if (!existing.viscosityIso && data.viscosityIso) patch.viscosityIso = data.viscosityIso;
        if (Object.keys(patch).length > 0) {
          await prisma.product.update({ where: { id: existing.id }, data: patch });
          updated++;
        }
      } else {
        await prisma.product.create({ data: { ...data, manufacturerId: mfg.id } });
        created++;
      }
    }
  }

  console.log(`\nKatalog Welle 2: ${FAMILIES.length} Familien, ${totalGenerated} Kandidaten.`);
  console.log(`  ${created} neu, ${updated} ergänzt, ${skippedNoMfg} übersprungen.`);
  if (unknownMfg.size > 0) console.log(`  Unbekannt: ${[...unknownMfg].join(", ")}`);

  const total = await prisma.product.count();
  console.log(`\nDB-Stand: ${total} Produkte`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
