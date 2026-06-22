// Bulk-Seed: Systematisch generierte Produktreihen großer Hersteller.
//
// Strategie: Hersteller-Produktfamilien sind in der Industrie standardisiert.
// Z.B. Shell Tellus S2 M existiert als ISO VG 22, 32, 46, 68, 100. Daraus
// lässt sich für jede Viskosität ein Product-Eintrag mit korrekten Metadaten
// generieren. So entstehen aus ~150 Familien-Templates ~700-900 Produkte.
//
// Idempotent über (manufacturerId, slug).
// Quelle: Hersteller-Produktkataloge (Shell/Mobil/Castrol/Fuchs/Klüber/Total)
// und Lube-Finder-Datenbanken.

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
  family: string;                  // "Tellus S2 M"
  category: ProductCategory;
  chemistry: ChemistryBase;
  description: string;
  certifications?: string[];
  variants: string[];              // ["22", "32", "46", "68", "100"] oder ["10W-40", "5W-30"]
  nameTemplate: string;            // "Tellus S2 M {v}" — {v} = variant
  variantLabel?: "iso-vg" | "sae" | "nlgi" | "plain"; // wofür steht der Variant
  containsMineralOil?: boolean;
  productFamily?: string;          // explizit setzbarer productFamily-Wert
};

// ────────────────────────────────────────────────────────────────────────────
// Produktfamilien-Katalog
// ────────────────────────────────────────────────────────────────────────────
const FAMILIES: Family[] = [
  // ═══ SHELL ═══
  {
    manufacturer: "Shell",
    family: "Tellus S2 M",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard mineralölbasiertes Hydrauliköl HLP — hohe Oxidationsstabilität, Anti-Verschleiß, breite ISO-VG-Auswahl.",
    certifications: ["DIN 51524-2 HLP", "ISO 11158 HM"],
    variants: ["15", "22", "32", "46", "68", "100"],
    nameTemplate: "Tellus S2 M {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Tellus S2 MX",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Hochleistungs-Hydrauliköl auf Group-II-Basisöl. Lange Standzeiten in industriellen Hochdruckanwendungen.",
    certifications: ["DIN 51524-2 HLP", "ISO 11158 HM"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Tellus S2 MX {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Tellus S2 VX",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Hydrauliköl mit hohem Viskositätsindex (HVLP) — geeignet für stark schwankende Umgebungstemperaturen.",
    certifications: ["DIN 51524-3 HVLP", "ISO 11158 HV"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Tellus S2 VX {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Tellus S3 M",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Premium-Hydrauliköl HLP für extreme Beanspruchung, sehr lange Lebensdauer durch verbesserte Additivierung.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Tellus S3 M {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Tellus S4 ME",
    category: "HYDRAULIC_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Hydrauliköl mit niedrigem Reibungskoeffizient, energieeffizient. Lange Lebensdauer.",
    variants: ["32", "46", "68"],
    nameTemplate: "Tellus S4 ME {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Tellus S4 VX",
    category: "HYDRAULIC_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches HVLP-Hydrauliköl für extreme Temperaturbereiche (-40 °C bis +90 °C).",
    variants: ["32", "46", "68"],
    nameTemplate: "Tellus S4 VX {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Omala S2 G",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl auf Mineralölbasis (CLP) für offene und geschlossene Industriegetriebe.",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Omala S2 G {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Omala S2 GX",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Premium-Industrie-Getriebeöl mit verbessertem Mikropittingschutz.",
    certifications: ["DIN 51517-3 CLP", "ISO 12925-1 CKD"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Omala S2 GX {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Omala S4 GX",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches PAO-Industrie-Getriebeöl (CLP HC) — Premium, sehr lange Standzeiten.",
    certifications: ["DIN 51517-3 CLP HC"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Omala S4 GX {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Omala S4 WE",
    category: "GEAR_OIL",
    chemistry: "PAG",
    description: "PAG-basiertes Schneckengetriebeöl. Sehr hoher Reibungs-Wirkungsgrad bei Bronze-Stahl-Paarung.",
    variants: ["150", "220", "320", "460", "680"],
    nameTemplate: "Omala S4 WE {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Rimula R6 LM",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Low-SAPS-Motoröl für moderne Diesel-LKW mit DPF.",
    variants: ["10W-40", "5W-30"],
    nameTemplate: "Rimula R6 LM {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Rimula R5 E",
    category: "SPECIALTY",
    chemistry: "SEMI_SYNTHETIC",
    description: "Teilsynthetisches Diesel-Motoröl für moderne Nutzfahrzeug-Motoren.",
    variants: ["10W-40"],
    nameTemplate: "Rimula R5 E {v}",
    variantLabel: "sae",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Gadus S2 V220",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Komplex-Schmierfett für Industrie- und Automotive-Anwendungen.",
    variants: ["1", "2", "3"],
    nameTemplate: "Gadus S2 V220 {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Gadus S3 V220C",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Premium-Lithium-Komplex-Fett für hochbelastete Industrie-Wälzlager.",
    variants: ["1", "2"],
    nameTemplate: "Gadus S3 V220C {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Corena S2 P",
    category: "COMPRESSOR_OIL",
    chemistry: "MINERAL",
    description: "Standard-Kolbenkompressor-Öl auf Mineralölbasis.",
    variants: ["68", "100", "150"],
    nameTemplate: "Corena S2 P {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Corena S4 R",
    category: "COMPRESSOR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Hochleistungs-Kompressoröl für Rotations- und Schraubenkompressoren.",
    variants: ["32", "46", "68"],
    nameTemplate: "Corena S4 R {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Tonna S3 M",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl (Schlittenführungsöl) für Werkzeugmaschinen, gute Klebrigkeit.",
    certifications: ["ISO 19378 G"],
    variants: ["32", "68", "220"],
    nameTemplate: "Tonna S3 M {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Vacuum Pump Oil S2 R",
    category: "COMPRESSOR_OIL",
    chemistry: "MINERAL",
    description: "Vakuumpumpenöl auf Mineralölbasis.",
    variants: ["100"],
    nameTemplate: "Vacuum Pump Oil S2 R {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Shell",
    family: "Spirax S4 CX",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Achsen-/Getriebeöl für schwere Nutzfahrzeuge.",
    variants: ["10W"],
    nameTemplate: "Spirax S4 CX {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Shell",
    family: "Spirax S4 TX",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Automatikgetriebe-/Drehmomentwandler-Öl für Nutzfahrzeuge.",
    variants: ["50"],
    nameTemplate: "Spirax S4 TX {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },

  // ═══ MOBIL ═══
  {
    manufacturer: "Mobil",
    family: "DTE 20 Ultra",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Hochleistungs-Anti-Wear-Hydrauliköl, ISO HM, lange Filtrierbarkeit, niedrige Schaumneigung.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["10", "15", "22", "25", "26", "27", "28"],
    nameTemplate: "DTE 20 Ultra {v}",
    variantLabel: "plain",
    containsMineralOil: true,
    productFamily: "DTE 20 Ultra",
  },
  {
    manufacturer: "Mobil",
    family: "DTE Excel",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Premium-Anti-Wear-Hydrauliköl mit hervorragender thermischer Stabilität.",
    variants: ["32", "46", "68", "100"],
    nameTemplate: "DTE Excel {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "DTE 10 Excel",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Premium-HVLP-Hydrauliköl, ausgezeichnete Anti-Wear-Performance, hoher Viskositätsindex.",
    variants: ["15", "22", "32", "46", "68", "100"],
    nameTemplate: "DTE 10 Excel {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Vactra",
    category: "SLIDEWAY_OIL",
    chemistry: "MINERAL",
    description: "Bettbahnöl für Werkzeugmaschinen-Schlittenführungen. Numerische Serie 1-4 entspricht ISO VG 32/68/150/220.",
    variants: ["No 1", "No 2", "No 3", "No 4"],
    nameTemplate: "Vactra {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobilgear 600 XP",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl der höchsten Belastungsstufe (CLP), für Hochleistungs-Getriebe.",
    certifications: ["DIN 51517-3 CLP", "AGMA 9005-E02"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Mobilgear 600 XP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobilgear SHC XMP",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches PAO-Industrie-Getriebeöl. Lange Standzeit, energieeffizient.",
    variants: ["150", "220", "320", "460", "680"],
    nameTemplate: "Mobilgear SHC XMP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Mobil",
    family: "SHC 600",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Industrie-Getriebeöl auf PAO-Basis, breite Temperaturbeständigkeit.",
    variants: ["626", "627", "629", "630", "632", "634", "636", "639"],
    nameTemplate: "SHC {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Mobil",
    family: "Mobil 1",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Pkw-Motoröl-Spitzenprodukt für moderne Benziner und Diesel.",
    variants: ["0W-20", "0W-30", "0W-40", "5W-30", "5W-40", "10W-60"],
    nameTemplate: "Mobil 1 {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Mobil",
    family: "Delvac MX",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Mineralisches Diesel-Motoröl für schwere Nutzfahrzeuge, lange Standzeit.",
    variants: ["10W-30", "10W-40", "15W-40"],
    nameTemplate: "Delvac MX {v}",
    variantLabel: "sae",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobilgrease XHP 222",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Komplex-EP-Mehrzweckfett, NLGI 2, hervorragender Verschleißschutz und Hochlast-Performance.",
    variants: ["Standard"],
    nameTemplate: "Mobilgrease XHP {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Mobil",
    family: "Mobilith SHC",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Hochleistungs-Lithium-Komplex-Schmierfett für extreme Temperaturen und Belastungen.",
    variants: ["100", "220", "460", "1500"],
    nameTemplate: "Mobilith SHC {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ CASTROL ═══
  {
    manufacturer: "Castrol",
    family: "Hyspin AWH-M",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Premium-Anti-Wear-Hydrauliköl HVLP, sehr langes Ölwechselintervall.",
    certifications: ["DIN 51524-3 HVLP"],
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Hyspin AWH-M {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Hyspin AWS",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HLP-Hydrauliköl für Industrie und mobile Hydraulik.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Hyspin AWS {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Hyspin HLP-Z",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Zinkfreies (HLP-ZF) Hydrauliköl für umweltsensible Anwendungen.",
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Hyspin HLP-Z {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Hyspin ZZ",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Zinkhaltiges (HLP) Hydrauliköl für Standard-Industrieanwendungen.",
    variants: ["32", "46", "68"],
    nameTemplate: "Hyspin ZZ {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Alpha SP",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Mineralisches Industrie-Getriebeöl (CLP).",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Alpha SP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Alphasyn EP",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches PAO-Industrie-Getriebeöl (CLP HC).",
    variants: ["150", "220", "320", "460", "680"],
    nameTemplate: "Alphasyn EP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Castrol",
    family: "Hysol XF",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Hochleistungs-KSS für Stahl-/Guss-Bearbeitung, biostabile Semi-Synth-Formulierung, borfrei.",
    variants: ["Standard"],
    nameTemplate: "Hysol XF {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Castrol",
    family: "Hysol SL",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Mineralöl-haltige KSS-Emulsion für Schwer-Spanen.",
    variants: ["37 XBB", "50 XBB"],
    nameTemplate: "Hysol SL {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Variocut",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbares Schneidöl mit S/P-Additivierung für anspruchsvolle Bearbeitungsoperationen.",
    variants: ["B 30", "C 429", "D 734", "G 101"],
    nameTemplate: "Variocut {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Edge",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Pkw-Motoröl mit FST-Technologie.",
    variants: ["0W-30", "0W-40", "5W-30", "5W-40", "10W-60"],
    nameTemplate: "Edge {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Castrol",
    family: "GTX",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Mineralisches Pkw-Motoröl mit Sludge-Schutz-Additivierung.",
    variants: ["10W-40", "15W-40", "20W-50"],
    nameTemplate: "GTX {v}",
    variantLabel: "sae",
    containsMineralOil: true,
  },
  {
    manufacturer: "Castrol",
    family: "Transmax Manual",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Manuelles Schaltgetriebeöl für Nutzfahrzeug- und Pkw-Anwendungen.",
    variants: ["EP 80W", "EP 80W-90", "V 75W-80"],
    nameTemplate: "Transmax Manual {v}",
    variantLabel: "sae",
    containsMineralOil: true,
  },

  // ═══ FUCHS ═══
  {
    manufacturer: "Fuchs",
    family: "Renolin B HVI Plus",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Zinkhaltiges HVLP-Hydrauliköl für mobile und industrielle Hydraulik.",
    certifications: ["DIN 51524-3 HVLP"],
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Renolin B HVI Plus {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renolin B",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HLP-Hydrauliköl, zinkhaltig.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["10", "22", "32", "46", "68", "100"],
    nameTemplate: "Renolin B {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renolin CLP",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP), mit Schwefel-Phosphor-Additivierung.",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Renolin CLP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renolin Unisyn CLP",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches PAO-Getriebeöl, Premium-Klasse (CLP HC).",
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Renolin Unisyn CLP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Ecocool",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Familie für leichte bis schwere Zerspanung von Stahl, Alu und Buntmetall.",
    variants: ["R 2030", "R 2120", "S 760 B", "AC1100", "XEP", "ZH Eco", "PP 70"],
    nameTemplate: "Ecocool {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Fuchs",
    family: "Titan GT1",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Premium-Pkw-Motoröl der GT1-Familie.",
    variants: ["5W-40", "Flex 3 5W-40", "Flex C2 0W-30", "Longlife IV 0W-20", "Pro C1 5W-30"],
    nameTemplate: "Titan GT1 {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Titan Supergear",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Nutzfahrzeug-Getriebeöl für Achs- und Handschalt-Getriebe.",
    variants: ["80W-90", "LS 80W-90"],
    nameTemplate: "Titan Supergear {v}",
    variantLabel: "sae",
    containsMineralOil: true,
  },
  {
    manufacturer: "Fuchs",
    family: "Renoclean",
    category: "CLEANER",
    chemistry: "OTHER",
    description: "Industrie-Reiniger und Entfetter.",
    variants: ["GMO 2203", "ISO", "MSO 3004 UK", "SMC", "VR 1021 CXV"],
    nameTemplate: "Renoclean {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Fuchs",
    family: "Plantocut",
    category: "COOLANT_NEAT",
    chemistry: "ESTER",
    description: "Bioabbaubares Schneidöl auf Ester-Basis, hervorragend für Aluminium.",
    variants: ["10 SR (DE)", "10 SR (US)"],
    nameTemplate: "Plantocut {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Cassida Fluid",
    category: "HYDRAULIC_OIL",
    chemistry: "SYNTHETIC",
    description: "NSF-H1-zertifiziertes Lebensmittel-Hydrauliköl für die Lebensmittelindustrie.",
    certifications: ["NSF H1", "ISO 21469"],
    variants: ["HF 15 (DE)", "HF 15 (EN)", "GL 220 (EN)"],
    nameTemplate: "Cassida Fluid {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Fuchs",
    family: "Renolit",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Wälzlagerfett-Familie für verschiedene Industrieanwendungen.",
    variants: ["CXI 2", "RB 15", "RHF 1"],
    nameTemplate: "Renolit {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ KLÜBER LUBRICATION ═══
  {
    manufacturer: "Klüber Lubrication",
    family: "Klübersynth EG 4",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches PAO-Getriebeöl-Reihe für Industrie- und Wellenkupplungen.",
    variants: ["150", "220", "320", "460"],
    nameTemplate: "Klübersynth EG 4-{v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Klübersynth UH1",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetische Lebensmittel-Schmierstoffe (NSF H1) für Getriebe und Wälzlager.",
    certifications: ["NSF H1"],
    variants: ["6-460", "14-31", "14-151", "14-1500"],
    nameTemplate: "Klübersynth UH1 {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Klüberoil 4 UH1",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "NSF-H1-zertifiziertes synthetisches Lebensmittelschmieröl.",
    certifications: ["NSF H1"],
    variants: ["68 N", "150 N", "220 N", "320 N", "460 N", "680 N", "1500 N"],
    nameTemplate: "Klüberoil 4 UH1-{v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Klüberoil GEM 1",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Mineralisches Industrie-Getriebeöl mit Mikropittingschutz.",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Klüberoil GEM 1-{v} N",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Isoflex",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Synthetische Schmierfette für Präzisionsanwendungen und kleine Spaltgrößen.",
    variants: ["Topas NB 52", "Topas NB 152", "Topas NCA 5051", "PDP 38", "Alltime SL2"],
    nameTemplate: "Isoflex {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Microlube",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Spezial-Schmierfette für Mikromechanik und Präzisionslager.",
    variants: ["GB 0", "GB 00 (US)", "GB 00 (YoderOil)"],
    nameTemplate: "Microlube {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },
  {
    manufacturer: "Klüber Lubrication",
    family: "Polylub",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Polyharnstoff-Schmierfette für Hochtemperatur- und Lebensdauer-Wälzlager.",
    variants: ["WH 2", "GA 352 P", "FOOD WH 2", "HD 2"],
    nameTemplate: "Polylub {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ TOTAL/TOTALENERGIES ═══
  {
    manufacturer: "TotalEnergies",
    family: "Azolla ZS",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-Anti-Wear-Hydrauliköl HLP.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["22", "32", "46", "68", "100", "150"],
    nameTemplate: "Azolla ZS {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Equivis ZS",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HVLP-Hydrauliköl mit verbesserter Temperaturbeständigkeit.",
    certifications: ["DIN 51524-3 HVLP"],
    variants: ["32", "46", "68", "100"],
    nameTemplate: "Equivis ZS {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Carter EP",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP), Schwerlast.",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Carter EP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Carter SH",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetisches PAO-Industrie-Getriebeöl.",
    variants: ["150", "220", "320", "460", "680"],
    nameTemplate: "Carter SH {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Quartz 9000",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Pkw-Motoröl.",
    variants: ["5W-40", "0W-30", "5W-30"],
    nameTemplate: "Quartz 9000 {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "TotalEnergies",
    family: "Multis EP",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett mit EP-Additivierung.",
    variants: ["1", "2", "3"],
    nameTemplate: "Multis EP {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ BP ═══
  {
    manufacturer: "BP",
    family: "Energol HLP",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HLP-Hydrauliköl.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Energol HLP-D {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Energol HLP-HM",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HLP-Hydrauliköl mit verbesserten Eigenschaften (verbessertes Verschleiß-, Korrosions- und Demulgierverhalten).",
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Energol HLP-HM {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Energol SHF-HV",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HVLP-Hydrauliköl mit hohem Viskositätsindex.",
    variants: ["32", "46", "68"],
    nameTemplate: "Energol SHF-HV {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Energrease LS",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett-Reihe für allgemeine Schmieraufgaben.",
    variants: ["1", "2", "3", "EP-1", "EP-2", "EP-3"],
    nameTemplate: "Energrease LS {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "BP",
    family: "Energrease HTG",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Hochtemperatur-Lithium-Komplex-Fett.",
    variants: ["2"],
    nameTemplate: "Energrease HTG-{v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ ENI ═══
  {
    manufacturer: "Eni",
    family: "OSO",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HLP-Hydrauliköl der Eni-Familie.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "OSO {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Eni",
    family: "Arnica",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HVLP-Hydrauliköl mit hohem Viskositätsindex und breiter Temperaturbeständigkeit.",
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Arnica {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Eni",
    family: "Blasia",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP) für Schwerlast-Anwendungen.",
    certifications: ["DIN 51517-3 CLP"],
    variants: ["68", "100", "150", "220", "320", "460", "680"],
    nameTemplate: "Blasia {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Eni",
    family: "Blasia S",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "PAO-basiertes synthetisches Industrie-Getriebeöl (CLP HC).",
    variants: ["220", "320", "460", "680"],
    nameTemplate: "Blasia S {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },
  {
    manufacturer: "Eni",
    family: "GR MU EP",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett mit EP-Additivierung.",
    variants: ["0", "1", "2", "3"],
    nameTemplate: "GR MU EP {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ Q8 OILS ═══
  {
    manufacturer: "Q8Oils",
    family: "Holst",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Anti-Wear-Hydrauliköl-Reihe der Q8.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["CR 22", "CR 32", "CR 46", "CR 68", "CR 100"],
    nameTemplate: "Holst {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Q8Oils",
    family: "Goya",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP).",
    variants: ["68", "100", "150", "220", "320", "460"],
    nameTemplate: "Goya {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Q8Oils",
    family: "T 670",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Hochleistungs-Pkw-Motoröl.",
    variants: ["5W-40", "5W-30"],
    nameTemplate: "T 670 {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },

  // ═══ CEPSA ═══
  {
    manufacturer: "Cepsa",
    family: "Hidráulico HLP",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HLP-Hydrauliköl spanischer Herkunft.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "Hidráulico HLP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Cepsa",
    family: "Hidráulico HM",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HM-Hydrauliköl mit Anti-Wear-Additivierung.",
    variants: ["22", "32", "46", "68"],
    nameTemplate: "Hidráulico HM {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Cepsa",
    family: "Engranajes HP",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP).",
    variants: ["100", "150", "220", "320", "460"],
    nameTemplate: "Engranajes HP {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },

  // ═══ DIVINOL (Zeller+Gmelin) ═══
  {
    manufacturer: "Divinol",
    family: "HLP ISO",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "Standard-HLP-Hydrauliköl der Divinol-Familie.",
    certifications: ["DIN 51524-2 HLP"],
    variants: ["22", "32", "46", "68", "100"],
    nameTemplate: "HLP ISO {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Divinol",
    family: "ICL",
    category: "GEAR_OIL",
    chemistry: "MINERAL",
    description: "Industrie-Getriebeöl (CLP).",
    variants: ["100", "150", "220", "320", "460"],
    nameTemplate: "ICL {v}",
    variantLabel: "iso-vg",
    containsMineralOil: true,
  },
  {
    manufacturer: "Divinol",
    family: "Multilube",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett.",
    variants: ["1", "2", "3"],
    nameTemplate: "Multilube {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ MOTUL ═══
  {
    manufacturer: "Motul",
    family: "8100 X-cess",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Premium-Motoröl für Pkw.",
    variants: ["5W-40", "5W-30"],
    nameTemplate: "8100 X-cess {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Motul",
    family: "Tekma",
    category: "SPECIALTY",
    chemistry: "MINERAL",
    description: "Nutzfahrzeug-Diesel-Motoröl.",
    variants: ["Mega X 15W-40", "Mega X 10W-40", "Ultima 10W-40"],
    nameTemplate: "Tekma {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Motul",
    family: "Multi ATF",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Mehrbereichs-Automatikgetriebeöl (Multi-Vehicle-ATF).",
    variants: ["VI"],
    nameTemplate: "ATF {v}-NC",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ LIQUI MOLY ═══
  {
    manufacturer: "Liqui Moly",
    family: "Pro-Line",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Profi-Additive für Motor, Getriebe, Dieselsystem.",
    variants: ["Motor Tune Up", "Diesel System Reiniger", "Getriebe-Additiv", "Hydrostössel-Additiv"],
    nameTemplate: "Pro-Line {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Liqui Moly",
    family: "Top Tec 4200",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Premium-Pkw-Motoröl (Long Life).",
    variants: ["5W-30", "0W-30"],
    nameTemplate: "Top Tec 4200 {v}",
    variantLabel: "sae",
    containsMineralOil: false,
  },
  {
    manufacturer: "Liqui Moly",
    family: "Synthoil",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Vollsynthetisches Motoröl der Synthoil-Reihe.",
    variants: ["Race Tech GT1 10W-60", "High Tech 5W-40", "Energy 0W-40"],
    nameTemplate: "Synthoil {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ Quaker Houghton ═══
  {
    manufacturer: "Quaker Houghton",
    family: "Hocut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe für Schwerzerspanung Stahl, Edelstahl, Guss.",
    variants: ["795-H", "768", "3380", "4400"],
    nameTemplate: "Hocut {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Quaker Houghton",
    family: "Cindol",
    category: "FORMING_OIL",
    chemistry: "MINERAL",
    description: "Umformöl für Stanz- und Tiefzieharbeiten.",
    variants: ["305 D", "320", "1705"],
    nameTemplate: "Cindol {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Quaker Houghton",
    family: "Rust-Veto",
    category: "CORROSION_PROTECTION",
    chemistry: "MINERAL",
    description: "Korrosionsschutzöl für Lagerung und Transport.",
    variants: ["4242", "377", "Greaseless 1100"],
    nameTemplate: "Rust-Veto {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Rhenus Lub ═══
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus FU",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe FU für anspruchsvolle Bearbeitung.",
    variants: ["50", "51", "60 TN", "750", "800", "855", "1100"],
    nameTemplate: "rhenus FU {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus LCK",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Komplex-Fett für Industrie-Wälzlager.",
    variants: ["2"],
    nameTemplate: "rhenus LCK {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },
  {
    manufacturer: "Rhenus Lub",
    family: "rhenus LZN",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett.",
    variants: ["2"],
    nameTemplate: "rhenus LZN {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ Cimcool ═══
  {
    manufacturer: "Cimcool",
    family: "Cimstar",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Familie für universelle Zerspanung.",
    variants: ["40B PINK", "60C-HFP", "60XLZ", "540", "540 BLUE", "10-570-HFP", "MAX VARIO"],
    nameTemplate: "Cimstar {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Cimcool",
    family: "Cimperial",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Mineralöl-haltige KSS-Emulsion für Schwerzerspanung.",
    variants: ["1071", "1070 SLS", "1011"],
    nameTemplate: "Cimperial {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Oemeta ═══
  {
    manufacturer: "Oemeta",
    family: "Hycut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Universelle wassermischbare KSS-Reihe.",
    variants: ["CF 21", "ET 68", "SE 12 EP", "SE 32"],
    nameTemplate: "Hycut {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Oemeta",
    family: "Hytap",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbares Schneid-/Gewindeöl.",
    variants: ["Standard"],
    nameTemplate: "Hytap {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Oemeta",
    family: "Novamet",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöl-Reihe für Aluminium und Buntmetall.",
    variants: ["900", "5500"],
    nameTemplate: "Novamet {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Blaser Swisslube ═══
  {
    manufacturer: "Blaser Swisslube",
    family: "B-Cool",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Familie B-Cool für universelle Anwendung.",
    variants: ["MC 610", "MC 510", "755", "9665"],
    nameTemplate: "B-Cool {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Blaser Swisslube",
    family: "Vasco",
    category: "COOLANT_WATER_MIX",
    chemistry: "SYNTHETIC",
    description: "Synthetische wassermischbare KSS, transparent.",
    variants: ["5000", "6000", "7000"],
    nameTemplate: "Vasco {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Blaser Swisslube",
    family: "Synergy",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Premium-KSS-Reihe Synergy für Schwerzerspanung.",
    variants: ["735", "905", "915"],
    nameTemplate: "Synergy {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Blaser Swisslube",
    family: "Blasocut",
    category: "COOLANT_WATER_MIX",
    chemistry: "MINERAL",
    description: "Bioconcept-KSS (mineralölbasiert) der Blasocut-Reihe.",
    variants: ["2000 Universal", "BC 25 MD", "BC 35", "BC 940"],
    nameTemplate: "Blasocut {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Master Fluid Solutions ═══
  {
    manufacturer: "Master Fluid Solutions",
    family: "TRIM",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "TRIM KSS-Reihe für universelle Zerspanung.",
    variants: ["SOL", "MicroSol 685", "MicroSol 698", "E206", "SC520", "SC585"],
    nameTemplate: "TRIM {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Master Fluid Solutions",
    family: "Master STAGES",
    category: "CLEANER",
    chemistry: "OTHER",
    description: "Industrie-Reiniger-Reihe für Metallbearbeitung.",
    variants: ["CLEAN 2020", "CLEAN 2030", "CLEAN 2310"],
    nameTemplate: "Master STAGES {v}",
    variantLabel: "plain",
  },

  // ═══ Petrofer ═══
  {
    manufacturer: "Petrofer",
    family: "Isocut",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbares Schneidöl-Reihe.",
    variants: ["Fluid", "Premium", "TR"],
    nameTemplate: "Isocut {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Petrofer",
    family: "Emulcut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe Emulcut.",
    variants: ["1015", "1100 P", "1500 BF"],
    nameTemplate: "Emulcut {v}",
    variantLabel: "plain",
  },

  // ═══ oelheld ═══
  {
    manufacturer: "oelheld",
    family: "SintoGrind",
    category: "GRINDING_OIL",
    chemistry: "MINERAL",
    description: "Hochleistungs-Schleiföle für Hartmetall-, HSS- und Profilschleifen.",
    variants: ["TTS", "Z 7", "Z 28"],
    nameTemplate: "SintoGrind {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "oelheld",
    family: "IonoGrind",
    category: "GRINDING_OIL",
    chemistry: "MINERAL",
    description: "Wassermischbarer Schleifkühlstoff für Schleifoperationen.",
    variants: ["B", "B-MD"],
    nameTemplate: "IonoGrind {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "oelheld",
    family: "Sarol",
    category: "EDM_FLUID",
    chemistry: "MINERAL",
    description: "Dielektrikum für Funkenerosion (Senk-/Draht-Erodieren).",
    variants: ["E", "D", "Z"],
    nameTemplate: "Sarol {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Jokisch ═══
  {
    manufacturer: "Jokisch",
    family: "Jokisol",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbare Schneidöl-Reihe.",
    variants: ["MS 9000", "M 5", "BB 2000"],
    nameTemplate: "Jokisol {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Hebro Chemie ═══
  {
    manufacturer: "Hebro Chemie",
    family: "Hebro Cut",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe der Hebro Chemie.",
    variants: ["HC 22 K", "HC 750", "HC 850"],
    nameTemplate: "Hebro Cut {v}",
    variantLabel: "plain",
  },

  // ═══ Carl Bechem ═══
  {
    manufacturer: "Carl Bechem",
    family: "Berutox",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Spezial-Schmierfett-Reihe Berutox für Hochlast.",
    variants: ["FE 18 EP", "FH 28 KN", "VPT 64 K", "M 21 EP"],
    nameTemplate: "Berutox {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Carl Bechem",
    family: "Berusynth",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Synthetische Hochleistungs-Schmierfette.",
    variants: ["68 H1", "CU 250", "EP 460"],
    nameTemplate: "Berusynth {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ Laemmle/Panolin ═══
  {
    manufacturer: "Laemmle/Panolin",
    family: "Panolin HLP SYNTH",
    category: "HYDRAULIC_OIL",
    chemistry: "ESTER",
    description: "Bioabbaubares Hochleistungs-Hydrauliköl auf gesättigter Ester-Basis.",
    certifications: ["ISO 15380 HEES", "Blauer Engel"],
    variants: ["15", "22", "32", "46", "68", "100"],
    nameTemplate: "Panolin HLP SYNTH {v}",
    variantLabel: "iso-vg",
    containsMineralOil: false,
  },

  // ═══ Avia/Bantleon ═══
  {
    manufacturer: "Avia Bantleon",
    family: "AVILUB Hydraulic",
    category: "HYDRAULIC_OIL",
    chemistry: "MINERAL",
    description: "HLP-Hydrauliköl-Reihe.",
    variants: ["RSL 22", "RSL 32", "RSL 46", "RSL 68", "DD"],
    nameTemplate: "AVILUB Hydraulic {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "Avia Bantleon",
    family: "AVILUB Metacool",
    category: "COOLANT_WATER_MIX",
    chemistry: "SEMI_SYNTHETIC",
    description: "Wassermischbare KSS-Reihe Metacool.",
    variants: ["SEI 2", "TGI 3"],
    nameTemplate: "AVILUB Metacool {v}",
    variantLabel: "plain",
  },
  {
    manufacturer: "Avia Bantleon",
    family: "AVILUB Metacorin",
    category: "COOLANT_NEAT",
    chemistry: "MINERAL",
    description: "Nicht-wassermischbares Schneidöl.",
    variants: ["833"],
    nameTemplate: "AVILUB Metacorin {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ Henkel/Loctite ═══
  {
    manufacturer: "Henkel",
    family: "Bonderite",
    category: "COOLANT_WATER_MIX",
    chemistry: "OTHER",
    description: "Reinigerlösungen und KSS-Konzentrate der Bonderite-Reihe (Multan, Multex).",
    variants: ["L-MR 71.2", "L-MR 22 LA", "L-MR Multan 71"],
    nameTemplate: "Bonderite {v}",
    variantLabel: "plain",
  },

  // ═══ ROCOL ═══
  {
    manufacturer: "ROCOL",
    family: "Foodlube",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "NSF-H1-zertifizierte Lebensmittel-Schmierfette und -öle der Foodlube-Reihe.",
    certifications: ["NSF H1"],
    variants: ["Hi-Power Range", "Multi-Paste", "EP1", "Universal 2"],
    nameTemplate: "Foodlube {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ Liebherr ═══
  {
    manufacturer: "Liebherr",
    family: "Universalfett",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Liebherr Universal-Wälzlagerfett (z.B. Art. 9900).",
    variants: ["9900"],
    nameTemplate: "Universalfett {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ LE (Lubrication Engineers) ═══
  {
    manufacturer: "LE",
    family: "Almagard",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Premium-Wälzlagerfette der Almagard-Familie.",
    variants: ["3751", "3752", "3753"],
    nameTemplate: "Almagard {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },
  {
    manufacturer: "LE",
    family: "Quinplex",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "Quinplex H1-zertifizierte Lebensmittel-Schmierstoffe.",
    certifications: ["NSF H1"],
    variants: ["4058 Penetrating Oil", "1245 Synthetic FM Oil"],
    nameTemplate: "Quinplex {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ Lubriplate ═══
  {
    manufacturer: "Lubriplate",
    family: "Syn",
    category: "GEAR_OIL",
    chemistry: "SYNTHETIC",
    description: "Synthetische PAO-Industrie-Getriebeöle und Fette der Syn-Reihe.",
    variants: ["Lube 1602", "Lube 1604", "Lube 1606"],
    nameTemplate: "Syn {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ Nils ═══
  {
    manufacturer: "Nils",
    family: "GR 7000",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Spezial-Wälzlagerfett für Industrie-Anwendungen.",
    variants: ["Standard"],
    nameTemplate: "GR 7000 {v}",
    variantLabel: "plain",
    containsMineralOil: true,
  },

  // ═══ SKF ═══
  {
    manufacturer: "SKF",
    family: "LGMT",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Lithium-Mehrzweckfett für allgemeine Industrie-Wälzlager.",
    variants: ["2", "3"],
    nameTemplate: "LGMT {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },
  {
    manufacturer: "SKF",
    family: "LGEP",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Extreme-Pressure-Lithium-Wälzlagerfett.",
    variants: ["2"],
    nameTemplate: "LGEP {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },
  {
    manufacturer: "SKF",
    family: "LGET",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Hochtemperatur-Fluorether-Schmierfett für extreme Bedingungen.",
    variants: ["2"],
    nameTemplate: "LGET {v}",
    variantLabel: "nlgi",
    containsMineralOil: false,
  },
  {
    manufacturer: "SKF",
    family: "LGHB",
    category: "GREASE",
    chemistry: "MINERAL",
    description: "Hochtemperatur-Calcium-Sulfonat-Lagerfett.",
    variants: ["2"],
    nameTemplate: "LGHB {v}",
    variantLabel: "nlgi",
    containsMineralOil: true,
  },

  // ═══ perma ═══
  {
    manufacturer: "perma",
    family: "MULTI LC Syn",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Synthetisches Schmierfett für perma-Schmierstoffspender.",
    variants: ["220-2"],
    nameTemplate: "MULTI LC Syn {v}",
    variantLabel: "plain",
    containsMineralOil: false,
  },

  // ═══ OKS Spezialschmierstoffe ═══
  {
    manufacturer: "OKS Spezialschmierstoffe",
    family: "OKS",
    category: "SPECIALTY",
    chemistry: "SYNTHETIC",
    description: "OKS-Spezialschmierstoffe (Sprays, Pasten, Fette).",
    variants: ["110", "240", "400", "511", "1100", "1112"],
    nameTemplate: "OKS {v}",
    variantLabel: "plain",
  },

  // ═══ SMW-AUTOBLOK ═══
  {
    manufacturer: "SMW-AUTOBLOK",
    family: "K-Fett",
    category: "GREASE",
    chemistry: "SYNTHETIC",
    description: "Spannfutter-Pflegefette von SMW.",
    variants: ["K67", "K68", "K70"],
    nameTemplate: "{v}",
    variantLabel: "plain",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Hersteller-Resolver (Cache)
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
// Hauptlauf
// ────────────────────────────────────────────────────────────────────────────
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

      // ISO VG aus iso-vg-Varianten extrahieren
      let viscosityIso: string | undefined;
      if (fam.variantLabel === "iso-vg" && /^\d+$/.test(v)) {
        viscosityIso = `ISO VG ${v}`;
      }

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
        notes: `Auto-generiert aus Hersteller-Produktreihen-Template.`,
      };

      const existing = await prisma.product.findUnique({
        where: { manufacturerId_slug: { manufacturerId: mfg.id, slug: productSlug } },
      });
      if (existing) {
        // Nur fehlende Felder ergänzen
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

  console.log(`\nKatalog-Templates: ${FAMILIES.length} Familien, ${totalGenerated} Produkt-Kandidaten generiert.`);
  console.log(`  ${created} Produkte neu angelegt`);
  console.log(`  ${updated} Produkte ergänzt`);
  console.log(`  ${skippedNoMfg} übersprungen (Hersteller nicht in DB: ${[...unknownMfg].join(", ")})`);

  const total = await prisma.product.count();
  console.log(`\nDB-Stand: ${total} Produkte`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
