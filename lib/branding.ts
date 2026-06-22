export type BrandColors = {
  primary: string;
  secondary: string;
  text: string;
};

const BRANDS: { match: RegExp; colors: BrandColors }[] = [
  // Castrol — grüner Korpus, rotes Mittelband (klassisches Castrol-Fass)
  { match: /castrol/i, colors: { primary: "#00853F", secondary: "#E30613", text: "#ffffff" } },
  // Fuchs Petrolub — dunkles Marken-Blau (Fuchs-Corporate), weißes Band
  { match: /fuchs/i, colors: { primary: "#003F87", secondary: "#E30613", text: "#ffffff" } },
  // Shell — gelber Korpus, rotes Mittelband (Pecten-Farben)
  { match: /shell/i, colors: { primary: "#FBCE07", secondary: "#DD1D21", text: "#1a1a1a" } },
  { match: /mobil|exxon/i, colors: { primary: "#0033A0", secondary: "#ED1A3B", text: "#ffffff" } },
  { match: /kl(ü|ue)ber/i, colors: { primary: "#005CA9", secondary: "#F39200", text: "#ffffff" } },
  { match: /total|elf/i, colors: { primary: "#F37021", secondary: "#1E3A8A", text: "#ffffff" } },
  { match: /\bbp\b/i, colors: { primary: "#009639", secondary: "#FFD700", text: "#ffffff" } },
  { match: /esso/i, colors: { primary: "#003594", secondary: "#FF6B00", text: "#ffffff" } },
  { match: /panolin|laemmle/i, colors: { primary: "#00A99D", secondary: "#003E51", text: "#ffffff" } },
  { match: /aral/i, colors: { primary: "#005EB8", secondary: "#FFD300", text: "#ffffff" } },
  { match: /valvoline/i, colors: { primary: "#D4202C", secondary: "#003366", text: "#ffffff" } },
  { match: /motul/i, colors: { primary: "#DA291C", secondary: "#1A1A1A", text: "#ffffff" } },
  { match: /chevron/i, colors: { primary: "#1F468B", secondary: "#ED1C24", text: "#ffffff" } },
  { match: /addinol/i, colors: { primary: "#005CA9", secondary: "#E30613", text: "#ffffff" } },
  { match: /houghton|quaker/i, colors: { primary: "#003C71", secondary: "#FFB81C", text: "#ffffff" } },
  { match: /blaser/i, colors: { primary: "#003B6F", secondary: "#E30613", text: "#ffffff" } },
  { match: /oemeta/i, colors: { primary: "#004F9F", secondary: "#FF9900", text: "#ffffff" } },
  // Neue Marken
  { match: /bantleon|avia/i, colors: { primary: "#E30613", secondary: "#1E3A8A", text: "#ffffff" } },
  { match: /cimcool|cimstar|cimperial/i, colors: { primary: "#00A0DF", secondary: "#003366", text: "#ffffff" } },
  { match: /divinol|zeller/i, colors: { primary: "#E30613", secondary: "#003366", text: "#ffffff" } },
  { match: /aquaslide/i, colors: { primary: "#0070C0", secondary: "#00B0F0", text: "#ffffff" } },
  { match: /motorex/i, colors: { primary: "#E30613", secondary: "#000000", text: "#ffffff" } },
  { match: /rhenus/i, colors: { primary: "#003F87", secondary: "#E30613", text: "#ffffff" } },
  { match: /oelheld/i, colors: { primary: "#0066B3", secondary: "#FFCC00", text: "#ffffff" } },
  { match: /bechem/i, colors: { primary: "#003366", secondary: "#FFC107", text: "#ffffff" } },
  { match: /\boest\b/i, colors: { primary: "#005099", secondary: "#FFCC00", text: "#ffffff" } },
  { match: /henkel|loctite/i, colors: { primary: "#E2001A", secondary: "#000000", text: "#ffffff" } },
  { match: /kluthe/i, colors: { primary: "#005CA9", secondary: "#E30613", text: "#ffffff" } },
  { match: /scharr/i, colors: { primary: "#E30613", secondary: "#003366", text: "#ffffff" } },
  { match: /jokisch/i, colors: { primary: "#003366", secondary: "#E30613", text: "#ffffff" } },
  { match: /hebro/i, colors: { primary: "#006633", secondary: "#FFCC00", text: "#ffffff" } },
  { match: /green\s*cnc|greencnc/i, colors: { primary: "#1B6E1B", secondary: "#A4D33C", text: "#ffffff" } },
  { match: /phi\s*oil|phioil/i, colors: { primary: "#1E40AF", secondary: "#F59E0B", text: "#ffffff" } },
];

/**
 * Liefert eine dunkle Variante der Marken-Farbe, die auf weißem Hintergrund
 * lesbar bleibt. Falls primary schon dunkel genug ist, wird primary zurückgegeben.
 * Sonst fällt es auf secondary zurück; falls auch das zu hell ist, slate-900.
 */
export function readableOnLight(colors: BrandColors): string {
  const lum = (hex: string): number => {
    if (hex.startsWith("hsl")) {
      const m = hex.match(/hsl\(\s*\d+\s+\d+%\s+(\d+)%/);
      return m ? Number(m[1]) / 100 : 0.5;
    }
    const h = hex.replace("#", "");
    if (h.length !== 6) return 0.5;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  if (lum(colors.primary) <= 0.55) return colors.primary;
  if (lum(colors.secondary) <= 0.55) return colors.secondary;
  return "#0f172a";
}

export function brandColors(manufacturer: string): BrandColors {
  for (const b of BRANDS) {
    if (b.match.test(manufacturer)) return b.colors;
  }
  // Falls keine Marke matcht: deterministische Hash-Farbe damit die Card nicht grau ist
  let hash = 0;
  for (let i = 0; i < manufacturer.length; i++) {
    hash = (hash * 31 + manufacturer.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    primary: `hsl(${hue} 65% 45%)`,
    secondary: `hsl(${(hue + 30) % 360} 60% 55%)`,
    text: "#ffffff",
  };
}

export const PACKAGING_LABEL: Record<string, string> = {
  DRUM: "Fass (200 L)",
  IBC: "IBC (1000 L)",
  TANK: "Tank",
  CANISTER: "Kanister",
  BULK: "Lose",
  OTHER: "Sonstiges",
};

// ---------------------------------------------------------------------------
// Zertifikat-Definitionen — wird beim Anzeigen über String-Match aufgelöst
// ---------------------------------------------------------------------------
export type CertIcon =
  | "din"
  | "iso"
  | "reach"
  | "trgs"
  | "oem"
  | "fda"
  | "halal"
  | "kosher"
  | "biocide-free"
  | "bor-free"
  | "formaldehyde-free"
  | "ghs"
  | "ce"
  | "vde"
  | "default";

export type CertDef = {
  match: RegExp;
  short: string;
  full: string;
  icon: CertIcon;
  color: string;
};

export const CERT_DEFINITIONS: CertDef[] = [
  {
    match: /\bDIN\s*51524\b/i,
    short: "DIN 51524",
    full: "DIN 51524 — Hydrauliköle HLP",
    icon: "din",
    color: "#1F468B",
  },
  {
    match: /\bDIN\s*51517\b/i,
    short: "DIN 51517",
    full: "DIN 51517 — Schmieröle (CLP-Klasse)",
    icon: "din",
    color: "#1F468B",
  },
  {
    match: /\bDIN\s*51825\b/i,
    short: "DIN 51825",
    full: "DIN 51825 — Schmierfette",
    icon: "din",
    color: "#1F468B",
  },
  {
    match: /\bDIN\s*51385\b/i,
    short: "DIN 51385",
    full: "DIN 51385 — Kühlschmierstoffe",
    icon: "din",
    color: "#1F468B",
  },
  {
    match: /\bDIN\b/i,
    short: "DIN",
    full: "DIN-Norm",
    icon: "din",
    color: "#1F468B",
  },
  {
    match: /\bISO\s*6743\b/i,
    short: "ISO 6743",
    full: "ISO 6743 — Klassifikation Schmierstoffe",
    icon: "iso",
    color: "#005EB8",
  },
  {
    match: /\bISO\s*VG\b/i,
    short: "ISO VG",
    full: "ISO VG — Viskositätsklasse",
    icon: "iso",
    color: "#005EB8",
  },
  {
    match: /\bISO\s*\d+/i,
    short: "ISO",
    full: "ISO-Norm",
    icon: "iso",
    color: "#005EB8",
  },
  {
    match: /\bREACH\b/i,
    short: "REACH",
    full: "REACH-konform (EU-Chemikalienverordnung)",
    icon: "reach",
    color: "#0E6E2A",
  },
  {
    match: /\bTRGS\s*611\b/i,
    short: "TRGS 611",
    full: "TRGS 611 — wassermischbare KSS, nitrosamin-arm",
    icon: "trgs",
    color: "#D97706",
  },
  {
    match: /\bTRGS\b/i,
    short: "TRGS",
    full: "TRGS — Technische Regel für Gefahrstoffe",
    icon: "trgs",
    color: "#D97706",
  },
  {
    match: /Bosch[\s-]*Rexroth|Rexroth/i,
    short: "Bosch Rexroth",
    full: "Bosch Rexroth — Hydraulik-Freigabe",
    icon: "oem",
    color: "#DA291C",
  },
  {
    match: /MAN\s*\d+/i,
    short: "MAN-Freigabe",
    full: "MAN — Werksfreigabe",
    icon: "oem",
    color: "#E20613",
  },
  {
    match: /Mercedes|MB[\s-]*\d/i,
    short: "Mercedes",
    full: "Mercedes-Benz — Werksfreigabe",
    icon: "oem",
    color: "#1A1A1A",
  },
  {
    match: /Volvo/i,
    short: "Volvo",
    full: "Volvo — Werksfreigabe",
    icon: "oem",
    color: "#003E51",
  },
  {
    match: /Siemens/i,
    short: "Siemens",
    full: "Siemens — OEM-Freigabe",
    icon: "oem",
    color: "#00A0E9",
  },
  {
    match: /SKF|FAG/i,
    short: "SKF/FAG",
    full: "SKF / FAG — Lagerfreigabe",
    icon: "oem",
    color: "#003D88",
  },
  {
    match: /FDA|H1/i,
    short: "FDA H1",
    full: "FDA / NSF H1 — lebensmitteltauglich",
    icon: "fda",
    color: "#0E6E2A",
  },
  {
    match: /Halal/i,
    short: "Halal",
    full: "Halal-zertifiziert",
    icon: "halal",
    color: "#0E6E2A",
  },
  {
    match: /Kosher/i,
    short: "Kosher",
    full: "Kosher-zertifiziert",
    icon: "kosher",
    color: "#1F468B",
  },
  {
    match: /biozid[\s-]*frei|bbf/i,
    short: "BBF",
    full: "Biozid-frei (Bor- und Borat-frei)",
    icon: "biocide-free",
    color: "#0E6E2A",
  },
  {
    match: /\bbor[\s-]*frei\b/i,
    short: "Bor-frei",
    full: "Bor-frei formuliert",
    icon: "bor-free",
    color: "#0E6E2A",
  },
  {
    match: /formaldehyd[\s-]*frei/i,
    short: "Formald.-frei",
    full: "Formaldehyd-Depotbildner frei",
    icon: "formaldehyde-free",
    color: "#0E6E2A",
  },
  {
    match: /GHS\d{2}/i,
    short: "GHS",
    full: "GHS — Globally Harmonized System (Gefahrstoffkennzeichnung)",
    icon: "ghs",
    color: "#D97706",
  },
  {
    match: /\bCE\b/i,
    short: "CE",
    full: "CE-Kennzeichen",
    icon: "ce",
    color: "#005EB8",
  },
  {
    match: /VDE/i,
    short: "VDE",
    full: "VDE-Prüfzeichen",
    icon: "vde",
    color: "#E30613",
  },
];

export function resolveCert(raw: string): CertDef {
  for (const c of CERT_DEFINITIONS) {
    if (c.match.test(raw)) return c;
  }
  return {
    match: /./,
    short: raw.length > 24 ? raw.slice(0, 22) + "…" : raw,
    full: raw,
    icon: "default",
    color: "#475569",
  };
}
