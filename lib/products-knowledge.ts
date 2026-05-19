/**
 * Wissensbasis: bekannte Hersteller, ihre Produkt-Familien und typische
 * Produkttypen. Wird verwendet für:
 *   - Autocomplete im Listing-Form
 *   - Auto-Detection des Herstellers aus dem Produktnamen
 *   - Vorschlag des Produkttyps aus der Produktfamilie
 */

export type ProductFamily = {
  family: string;
  manufacturer: string;
  productType: string;
  aliases?: string[];
};

// Bekannte Hersteller (für Manufacturer-Autocomplete)
export const KNOWN_MANUFACTURERS: string[] = [
  "Castrol",
  "Shell",
  "Mobil",
  "ExxonMobil",
  "Fuchs",
  "Klüber",
  "Total",
  "TotalEnergies",
  "BP",
  "Esso",
  "Aral",
  "Panolin",
  "Laemmle",
  "Addinol",
  "Blaser",
  "Oemeta",
  "Houghton",
  "Quaker Houghton",
  "Valvoline",
  "Motul",
  "Chevron",
  "Eni",
  "Liqui Moly",
  "Ravenol",
  "Rowe",
  "Pennzoil",
];

// Bekannte Produkttypen
export const PRODUCT_TYPES: string[] = [
  "Hydrauliköl",
  "Getriebeöl",
  "Motoröl",
  "Schmierfett",
  "Schneidöl (nicht-wassermischbar)",
  "Kühlschmierstoff (Emulsion, wassermischbar)",
  "Kühlschmierstoff (Lösung, wassermischbar)",
  "Schleiföl",
  "Honöl",
  "Umformöl",
  "Stanzöl",
  "Tiefziehöl",
  "Spindelöl",
  "Kompressorenöl",
  "Wärmeträgeröl",
  "Bioabbaubares Hydrauliköl",
  "Korrosionsschutzöl",
  "Hydraulikflüssigkeit (HFC/HFD)",
];

// Bekannte Anwendungsbereiche
export const APPLICATION_AREAS: string[] = [
  "Hydraulik",
  "CNC-Drehen",
  "CNC-Fräsen",
  "Schleifen",
  "Honen",
  "Tieflochbohren",
  "Räumen",
  "Wälzfräsen",
  "Stanzen",
  "Tiefziehen",
  "Walzen",
  "Härten",
  "Industriegetriebe",
  "Wälzlager",
  "Gleitlager",
  "Kompressor",
  "Wärmeübertragung",
  "Spritzguss",
  "Lebensmittelmaschinen",
  "Forst- und Landtechnik",
  "Schiffshydraulik",
];

// Bekannte Produkt-Familien — pro Hersteller die häufigsten Linien
//
// `aliases` enthält bewusst auch Suffix-Codes (z.B. "XBB" für Castrol Hysol),
// damit die Auto-Detection auch dann greift, wenn der User nur einen Teil
// der Produkt-Bezeichnung tippt.
export const PRODUCT_FAMILIES: ProductFamily[] = [
  // ---------- Shell ----------
  {
    family: "Tellus",
    manufacturer: "Shell",
    productType: "Hydrauliköl",
    aliases: ["Tellus S2", "Tellus S3", "Tellus S4", "Tellus T", "S2 M", "S2 MX", "S2 V", "S4 ME", "S4 VX"],
  },
  { family: "Helix", manufacturer: "Shell", productType: "Motoröl", aliases: ["Helix Ultra", "Helix HX7", "Helix HX8"] },
  { family: "Spirax", manufacturer: "Shell", productType: "Getriebeöl", aliases: ["Spirax S2", "Spirax S3", "Spirax S6"] },
  { family: "Omala", manufacturer: "Shell", productType: "Getriebeöl", aliases: ["Omala S2", "Omala S4"] },
  { family: "Rimula", manufacturer: "Shell", productType: "Motoröl", aliases: ["Rimula R4", "Rimula R6"] },
  { family: "Naturelle", manufacturer: "Shell", productType: "Bioabbaubares Hydrauliköl", aliases: ["Naturelle HF-E"] },
  { family: "Corena", manufacturer: "Shell", productType: "Kompressorenöl", aliases: ["Corena S2 P", "Corena S4"] },
  { family: "Gadus", manufacturer: "Shell", productType: "Schmierfett", aliases: ["Gadus S2", "Gadus S3"] },
  { family: "Donax", manufacturer: "Shell", productType: "Getriebeöl" },
  { family: "Refrigeration Oil S", manufacturer: "Shell", productType: "Kompressorenöl", aliases: ["S4 FR-V"] },
  { family: "Dromus", manufacturer: "Shell", productType: "Kühlschmierstoff (Emulsion, wassermischbar)", aliases: ["Dromus B", "Dromus BX"] },
  { family: "Garia", manufacturer: "Shell", productType: "Schneidöl (nicht-wassermischbar)", aliases: ["Garia 405", "Garia 601"] },

  // ---------- Castrol ----------
  {
    family: "Hyspin",
    manufacturer: "Castrol",
    productType: "Hydrauliköl",
    aliases: ["Hyspin AWS", "Hyspin AWH", "Hyspin HVI", "AWS HX", "AWH M"],
  },
  {
    family: "Hysol",
    manufacturer: "Castrol",
    productType: "Kühlschmierstoff (Emulsion, wassermischbar)",
    // XBB ist Castrols Suffix für Hysol-Varianten ohne Borate/Formaldehyd
    aliases: ["Hysol SL", "Hysol R", "Hysol N", "Hysol G", "Hysol CGX", "SL XBB", "SL 37 XBB", "SL 50 XBB", "XBB", "CGX 100"],
  },
  {
    family: "Variocut",
    manufacturer: "Castrol",
    productType: "Schneidöl (nicht-wassermischbar)",
    aliases: ["Variocut B", "Variocut C", "Variocut D", "Variocut G", "B 30", "C 429", "C 462", "D 734", "G 101", "G 159"],
  },
  { family: "Alphasyn", manufacturer: "Castrol", productType: "Getriebeöl", aliases: ["Alphasyn EP", "Alphasyn HG"] },
  { family: "Alpha", manufacturer: "Castrol", productType: "Getriebeöl", aliases: ["Alpha SP", "Alpha BMB"] },
  { family: "Magna", manufacturer: "Castrol", productType: "Schmierfett", aliases: ["Magna BD", "Magna ZS"] },
  { family: "Aircol", manufacturer: "Castrol", productType: "Kompressorenöl", aliases: ["Aircol PD", "Aircol SN"] },
  { family: "Iloform", manufacturer: "Castrol", productType: "Umformöl", aliases: ["Iloform PN", "Iloform TDN"] },
  { family: "Ilocut", manufacturer: "Castrol", productType: "Schneidöl (nicht-wassermischbar)" },
  { family: "Honilo", manufacturer: "Castrol", productType: "Honöl" },
  { family: "Syntilo", manufacturer: "Castrol", productType: "Kühlschmierstoff (Lösung, wassermischbar)", aliases: ["Syntilo 9930", "Syntilo R", "Syntilo XPS"] },
  { family: "Optigear", manufacturer: "Castrol", productType: "Getriebeöl", aliases: ["Optigear BM", "Optigear Synthetic"] },
  { family: "Tribol", manufacturer: "Castrol", productType: "Schmierfett", aliases: ["Tribol GR", "Tribol 1100"] },

  // ---------- Fuchs ----------
  {
    family: "Renolin",
    manufacturer: "Fuchs",
    productType: "Hydrauliköl",
    aliases: ["Renolin MR", "Renolin B", "Renolin ZAF", "Renolin HVI", "MR 5", "MR 10", "MR 15", "MR 520", "B 32 HVI", "B 46 HVI"],
  },
  {
    family: "Renolin Unisyn CLP",
    manufacturer: "Fuchs",
    productType: "Getriebeöl",
    aliases: ["Unisyn CLP", "Renolin PG", "CLP 68", "CLP 100", "CLP 150", "CLP 220", "CLP 320", "CLP 460", "PG 320"],
  },
  { family: "Renolit", manufacturer: "Fuchs", productType: "Schmierfett", aliases: ["Renolit RB", "Renolit CXI", "Renolit CALZ", "Renolit LZR"] },
  {
    family: "Ecocool",
    manufacturer: "Fuchs",
    productType: "Kühlschmierstoff (Emulsion, wassermischbar)",
    aliases: ["Ecocool R 2030", "Ecocool R 3015", "Ecocool S-10", "Ecocool XEP", "Ecocool ALU", "Ecocool 700", "Ecocool PHH-AL", "PHH-AL"],
  },
  { family: "Ecocut", manufacturer: "Fuchs", productType: "Schneidöl (nicht-wassermischbar)", aliases: ["Ecocut HSG", "Ecocut Ultra"] },
  { family: "Anticorit", manufacturer: "Fuchs", productType: "Korrosionsschutzöl", aliases: ["Anticorit DFW", "Anticorit OHK"] },
  { family: "Cassida", manufacturer: "Fuchs", productType: "Hydrauliköl", aliases: ["Cassida Fluid", "Cassida HF", "Cassida GL"] },
  { family: "Plantogel", manufacturer: "Fuchs", productType: "Schmierfett" },
  { family: "Plantohyd", manufacturer: "Fuchs", productType: "Bioabbaubares Hydrauliköl", aliases: ["Plantohyd S", "Plantohyd N"] },

  // ---------- Mobil / ExxonMobil ----------
  {
    family: "DTE",
    manufacturer: "Mobil",
    productType: "Hydrauliköl",
    aliases: ["DTE 10 Excel", "DTE 20", "DTE 24", "DTE 25", "DTE 26", "DTE Excel", "DTE 25 Ultra", "DTE 26 Ultra"],
  },
  { family: "Mobilgear", manufacturer: "Mobil", productType: "Getriebeöl", aliases: ["Mobilgear 600", "Mobilgear SHC"] },
  { family: "Mobilube", manufacturer: "Mobil", productType: "Getriebeöl", aliases: ["Mobilube HD"] },
  { family: "Vacmul", manufacturer: "Mobil", productType: "Kompressorenöl" },
  { family: "Mobiltherm", manufacturer: "Mobil", productType: "Wärmeträgeröl" },
  { family: "Mobilux", manufacturer: "Mobil", productType: "Schmierfett", aliases: ["Mobilux EP"] },
  { family: "Mobilgrease", manufacturer: "Mobil", productType: "Schmierfett", aliases: ["Mobilgrease XHP"] },
  { family: "Mobil 1", manufacturer: "Mobil", productType: "Motoröl", aliases: ["Mobil 1 ESP", "Mobil 1 FS"] },
  { family: "Mobilmet", manufacturer: "Mobil", productType: "Schneidöl (nicht-wassermischbar)", aliases: ["Mobilmet 426", "Mobilmet 766"] },
  { family: "Mobilcut", manufacturer: "Mobil", productType: "Kühlschmierstoff (Emulsion, wassermischbar)", aliases: ["Mobilcut 251", "Mobilcut 320"] },
  { family: "Velocite", manufacturer: "Mobil", productType: "Spindelöl", aliases: ["Velocite Oil"] },
  { family: "SHC", manufacturer: "Mobil", productType: "Getriebeöl", aliases: ["Mobil SHC", "SHC 624", "SHC 626", "SHC 630"] },

  // ---------- Klüber ----------
  { family: "Klüberoil", manufacturer: "Klüber", productType: "Getriebeöl" },
  { family: "Klübersynth", manufacturer: "Klüber", productType: "Getriebeöl" },
  { family: "Klübertop", manufacturer: "Klüber", productType: "Schmierfett" },
  { family: "Petamo", manufacturer: "Klüber", productType: "Schmierfett" },
  { family: "Constant", manufacturer: "Klüber", productType: "Schmierfett" },
  { family: "Klüberplex", manufacturer: "Klüber", productType: "Schmierfett" },
  { family: "Polylub", manufacturer: "Klüber", productType: "Schmierfett" },
  { family: "Asonic", manufacturer: "Klüber", productType: "Schmierfett" },

  // ---------- BP ----------
  { family: "Energol", manufacturer: "BP", productType: "Hydrauliköl" },
  { family: "Energear", manufacturer: "BP", productType: "Getriebeöl" },
  { family: "Energrease", manufacturer: "BP", productType: "Schmierfett" },

  // ---------- Total ----------
  { family: "Azolla", manufacturer: "Total", productType: "Hydrauliköl" },
  { family: "Equivis", manufacturer: "Total", productType: "Hydrauliköl" },
  { family: "Carter", manufacturer: "Total", productType: "Getriebeöl" },
  { family: "Multis", manufacturer: "Total", productType: "Schmierfett" },
  { family: "Cortis", manufacturer: "Total", productType: "Kompressorenöl" },
  { family: "Spirit", manufacturer: "Total", productType: "Schneidöl (nicht-wassermischbar)" },
  { family: "Lactuca", manufacturer: "Total", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },

  // ---------- Aral ----------
  { family: "Vitam", manufacturer: "Aral", productType: "Hydrauliköl" },
  { family: "Degol", manufacturer: "Aral", productType: "Getriebeöl" },
  { family: "Aralub", manufacturer: "Aral", productType: "Schmierfett" },

  // ---------- Panolin / Laemmle ----------
  { family: "Panolin HLP SYNTH", manufacturer: "Panolin", productType: "Bioabbaubares Hydrauliköl", aliases: ["HLP SYNTH"] },
  { family: "Panolin Atergo", manufacturer: "Panolin", productType: "Getriebeöl" },
  { family: "Panolin Hydro", manufacturer: "Panolin", productType: "Hydrauliköl" },

  // ---------- Addinol ----------
  { family: "Addinol HLP", manufacturer: "Addinol", productType: "Hydrauliköl" },
  { family: "Addinol XW", manufacturer: "Addinol", productType: "Getriebeöl" },

  // ---------- Blaser Swisslube ----------
  { family: "Blasocut", manufacturer: "Blaser", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },
  { family: "Vasco", manufacturer: "Blaser", productType: "Kühlschmierstoff (Lösung, wassermischbar)" },
  { family: "B-Cool", manufacturer: "Blaser", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },
  { family: "Synergy", manufacturer: "Blaser", productType: "Kühlschmierstoff (Lösung, wassermischbar)" },

  // ---------- Oemeta ----------
  { family: "Hycut", manufacturer: "Oemeta", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },
  { family: "Novamet", manufacturer: "Oemeta", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },
  { family: "Hytec", manufacturer: "Oemeta", productType: "Schneidöl (nicht-wassermischbar)" },

  // ---------- Houghton ----------
  { family: "Hocut", manufacturer: "Houghton", productType: "Kühlschmierstoff (Emulsion, wassermischbar)" },
  { family: "Garia", manufacturer: "Houghton", productType: "Korrosionsschutzöl" },
];

function tok(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Sucht in der Wissensbasis nach Übereinstimmungen zum gegebenen Produktnamen
 * und gibt die wahrscheinlichste Familie zurück (oder null).
 */
export function detectFamily(productName: string): ProductFamily | null {
  if (!productName || productName.trim().length < 2) return null;
  const t = " " + tok(productName) + " ";
  for (const fam of PRODUCT_FAMILIES) {
    const candidates = [fam.family, ...(fam.aliases ?? [])];
    for (const c of candidates) {
      const needle = " " + tok(c) + " ";
      if (t.includes(needle)) return fam;
    }
  }
  // Loser Match: nur das erste Wort vergleichen
  const first = productName.split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4) {
    for (const fam of PRODUCT_FAMILIES) {
      const famFirst = fam.family.split(/\s+/)[0]?.toLowerCase();
      if (famFirst && famFirst === first) return fam;
    }
  }
  return null;
}

/** Top-N Vorschläge aus einer Wortliste, gewichtet nach Match-Qualität. */
export function suggestFrom(list: string[], query: string, max = 8): string[] {
  const q = tok(query);
  if (!q) return list.slice(0, max);
  const scored = list.map((item) => {
    const t = tok(item);
    if (t === q) return { item, hit: 3 };
    if (t.startsWith(q)) return { item, hit: 2 };
    if (t.includes(q)) return { item, hit: 1 };
    if (t.split(/\s+/).some((w) => w.startsWith(q))) return { item, hit: 1 };
    return { item, hit: 0 };
  });
  return scored
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit)
    .slice(0, max)
    .map((x) => x.item);
}

/** Vorschläge für Produkt-Familien — zeigt "Familie · Hersteller (Typ)". */
export function suggestFamilies(query: string, max = 8): ProductFamily[] {
  const q = tok(query);
  if (!q) return [];
  const scored = PRODUCT_FAMILIES.map((fam) => {
    const haystacks = [fam.family, ...(fam.aliases ?? [])].map(tok);
    const hit = haystacks.some((h) => h.startsWith(q))
      ? 2
      : haystacks.some((h) => h.includes(q))
        ? 1
        : 0;
    return { fam, hit };
  });
  return scored
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit)
    .slice(0, max)
    .map((x) => x.fam);
}
