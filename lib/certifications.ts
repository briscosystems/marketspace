/**
 * Normierter Zertifikat-Katalog für Industrieschmierstoffe und KSS.
 *
 * Verwendet von:
 * - CertBadge (Anzeige mit Icon/Farbe + Detail-Popover)
 * - CertInput im Listing-/RFQ-Form (Vorschlag/Validierung)
 * - KI-Alternative (Prompt-Kontext zum Vergleich von Freigaben)
 */

export type CertCategory =
  | "norm"
  | "oem"
  | "food"
  | "religious"
  | "ecology"
  | "labeling"
  | "additive";

export type CertIconKey =
  | "din"
  | "iso"
  | "reach"
  | "trgs"
  | "oem"
  | "food"
  | "halal"
  | "kosher"
  | "ecology"
  | "ghs"
  | "ce"
  | "vde"
  | "default";

export type CertDef = {
  id: string;
  short: string;
  full: string;
  details: string;
  category: CertCategory;
  icon: CertIconKey;
  color: string;
  aliases: string[];
  wikipedia?: string;
};

export const CERTIFICATIONS: CertDef[] = [
  // ---------- DIN-Normen ----------
  {
    id: "din-51524",
    short: "DIN 51524",
    full: "DIN 51524 — Druckflüssigkeiten Hydrauliköl HLP / HVLP",
    details:
      "Deutsche Norm für Hydrauliköle: Teil 1 (HL — ohne Verschleißschutz), Teil 2 (HLP — mit Verschleißschutz), Teil 3 (HVLP — Mehrbereich). Definiert Anforderungen an Viskosität, Korrosionsschutz, Oxidationsstabilität, Verschleißschutz im FZG-/Vickers-Test.",
    category: "norm",
    icon: "din",
    color: "#1F468B",
    aliases: ["DIN 51524-1", "DIN 51524-2", "DIN 51524-3", "HLP", "HVLP"],
    wikipedia: "https://de.wikipedia.org/wiki/Hydraulik%C3%B6l",
  },
  {
    id: "din-51517",
    short: "DIN 51517",
    full: "DIN 51517 — Schmieröle CLP",
    details:
      "Schmieröle für Getriebe und Lager. Teil 3 (CLP) deckt Getriebeöle mit hohem Verschleißschutz ab — FZG-Stufentest A/8,3/90, Stufe ≥ 12.",
    category: "norm",
    icon: "din",
    color: "#1F468B",
    aliases: ["DIN 51517-3", "CLP"],
  },
  {
    id: "din-51825",
    short: "DIN 51825",
    full: "DIN 51825 — Schmierfette",
    details:
      "Klassifikation von Schmierfetten nach K (Wälzlagerfett) etc., NLGI-Klasse, Tropfpunkt, Gebrauchstemperatur, Wasserbeständigkeit.",
    category: "norm",
    icon: "din",
    color: "#1F468B",
    aliases: ["KP", "KPF"],
  },
  {
    id: "din-51385",
    short: "DIN 51385",
    full: "DIN 51385 — Kühlschmierstoffe Begriffe",
    details:
      "Definition und Einteilung von Kühlschmierstoffen: SE (nicht-wassermischbar), SEM/SES (Emulsion/Lösung wassermischbar). Begriffsbasis für TRGS 611.",
    category: "norm",
    icon: "din",
    color: "#1F468B",
    aliases: ["SEM", "SES", "SE"],
  },
  {
    id: "iso-vg",
    short: "ISO VG",
    full: "ISO Viskositätsklasse",
    details:
      "ISO 3448 — internationale Viskositätsklassen für Industrieschmierstoffe (VG 2, 5, 7, 10, 15, 22, 32, 46, 68, 100, 150 …). Bezugstemperatur 40 °C.",
    category: "norm",
    icon: "iso",
    color: "#005EB8",
    aliases: ["ISO 3448"],
  },
  {
    id: "iso-6743",
    short: "ISO 6743",
    full: "ISO 6743 — Klassifikation Schmierstoffe",
    details:
      "Internationale Klassifikation von Schmierstoffen nach Familie (H = Hydraulik, C = Getriebe, M = Metallbearbeitung etc.). Pendant zur DIN 51502.",
    category: "norm",
    icon: "iso",
    color: "#005EB8",
    aliases: ["ISO 6743-4"],
  },
  {
    id: "iso-21469",
    short: "ISO 21469",
    full: "ISO 21469 — Hygiene-Anforderungen Lebensmittel-Schmierstoffe",
    details:
      "Hygiene-Anforderungen für Schmierstoffe mit zufälligem Lebensmittelkontakt. Zertifiziert durch DEKRA/NSF — Voraussetzung für H1-Freigabe.",
    category: "food",
    icon: "food",
    color: "#0E6E2A",
    aliases: [],
  },

  // ---------- Gefahrstoff / Gesundheit ----------
  {
    id: "trgs-611",
    short: "TRGS 611",
    full: "TRGS 611 — Verwendungsbeschränkungen für wassermischbare KSS",
    details:
      "Technische Regel für Gefahrstoffe: max. 20 mg/kg Gesamt-Nitrosamine in der Anwendungs­konzentration, Beschränkungen für Aminkonservierer. Pflicht für jeden wassermischbaren KSS im DACH-Raum.",
    category: "norm",
    icon: "trgs",
    color: "#D97706",
    aliases: ["TRGS611"],
  },
  {
    id: "reach",
    short: "REACH",
    full: "REACH — EU-Chemikalienverordnung",
    details:
      "Verordnung (EG) Nr. 1907/2006 zur Registrierung, Bewertung, Zulassung und Beschränkung chemischer Stoffe. Bestätigung der REACH-Konformität ist EU-weit Pflicht für Inverkehrbringer.",
    category: "norm",
    icon: "reach",
    color: "#0E6E2A",
    aliases: ["REACH-konform"],
    wikipedia: "https://de.wikipedia.org/wiki/REACH-Verordnung",
  },
  {
    id: "ghs",
    short: "GHS",
    full: "GHS — Globally Harmonized System",
    details:
      "Weltweit harmonisierte Gefahrstoffkennzeichnung. Symbole GHS01–GHS09 für physikalische, Gesundheits- und Umweltgefahren.",
    category: "labeling",
    icon: "ghs",
    color: "#D97706",
    aliases: ["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"],
  },
  {
    id: "clp",
    short: "CLP",
    full: "CLP-Verordnung",
    details:
      "Verordnung (EG) Nr. 1272/2008 — EU-Umsetzung von GHS. Einstufung, Kennzeichnung und Verpackung von Stoffen und Gemischen.",
    category: "labeling",
    icon: "ghs",
    color: "#D97706",
    aliases: [],
  },

  // ---------- OEM-Freigaben ----------
  {
    id: "bosch-rexroth",
    short: "Bosch Rexroth",
    full: "Bosch Rexroth — Hydraulik-Freigabe",
    details:
      "Werksfreigabe RDE 90235/90245 für Hydraulikflüssigkeiten in Bosch-Rexroth-Pumpen (A4, A10, A11). FZG ≥ 11, Vickers V104C ≤ 30 mg.",
    category: "oem",
    icon: "oem",
    color: "#DA291C",
    aliases: ["RDE 90235", "RDE 90245", "Rexroth"],
  },
  {
    id: "denison",
    short: "Denison HF-0",
    full: "Denison HF-0 / HF-1 / HF-2",
    details:
      "Parker-Denison-Freigabe für Hydrauliköle. HF-0 ist die strengste Stufe (zinkfrei oder zinkhaltig, T6H20C-Pumpentest).",
    category: "oem",
    icon: "oem",
    color: "#003F87",
    aliases: ["HF-0", "HF-1", "HF-2", "Denison HF-0"],
  },
  {
    id: "vickers",
    short: "Eaton Vickers",
    full: "Eaton Vickers M-2950-S / I-286-S",
    details:
      "Klassische Vickers-Pumpentest-Freigaben für Hydrauliköle (Vane-Pump-Test V104C / 35VQ25).",
    category: "oem",
    icon: "oem",
    color: "#E10600",
    aliases: ["M-2950-S", "I-286-S", "35VQ25"],
  },
  {
    id: "siemens-mn",
    short: "Siemens MN",
    full: "Siemens AG — Getriebeöl-Freigabe",
    details:
      "Werksfreigabe für Siemens-Großgetriebe (Flender). MN 743 11 etc., FZG ≥ 12, Mikropitting-Test FVA 54.",
    category: "oem",
    icon: "oem",
    color: "#00A0E9",
    aliases: ["Siemens", "Flender", "MN 743"],
  },
  {
    id: "man",
    short: "MAN",
    full: "MAN-Truck-Norm",
    details:
      "MAN-Werksnormen für Motor-, Getriebe- und Achsöle (z.B. M 3275 für Motorenöl, M 3343 für Schaltgetriebeöl).",
    category: "oem",
    icon: "oem",
    color: "#E20613",
    aliases: ["MAN M 3275", "MAN M 3343"],
  },
  {
    id: "mercedes",
    short: "MB-Freigabe",
    full: "Mercedes-Benz-Freigabe (MB Approval)",
    details:
      "Werksfreigabe der MB Operations (z.B. MB 228.5 für Motorenöl, MB 235.X für Achsöle).",
    category: "oem",
    icon: "oem",
    color: "#1A1A1A",
    aliases: ["MB 228.5", "MB 235", "Mercedes-Benz Approval"],
  },
  {
    id: "volvo",
    short: "Volvo",
    full: "Volvo-Werksfreigabe",
    details: "Volvo-Truck-Spezifikationen (VDS-4/VDS-5 für Motorenöl etc.).",
    category: "oem",
    icon: "oem",
    color: "#003E51",
    aliases: ["VDS-4", "VDS-5"],
  },
  {
    id: "skf-emcor",
    short: "SKF EMCOR",
    full: "SKF EMCOR — Lager-Korrosionsschutztest",
    details:
      "SKF-Standard für Lager-Korrosionsschutz. Bewertung 0–5 (0 = kein Rost). Wichtig für KSS, die mit Wälzlagern in Kontakt kommen.",
    category: "oem",
    icon: "oem",
    color: "#003D88",
    aliases: ["EMCOR", "SKF", "FAG"],
  },
  {
    id: "fzg",
    short: "FZG-Stufe",
    full: "FZG-Zahnradtest",
    details:
      "Forschungsstelle für Zahnräder — Last-/Schadensstufe im Stirnrad-Test A/8,3/90. Bestanden ab Stufe 10; Premium ≥ 12.",
    category: "norm",
    icon: "iso",
    color: "#005EB8",
    aliases: ["FZG"],
  },

  // ---------- Lebensmittel & Religion ----------
  {
    id: "nsf-h1",
    short: "NSF H1",
    full: "NSF H1 / FDA 21 CFR 178.3570",
    details:
      "Registrierung für Schmierstoffe mit zufälligem Lebensmittelkontakt. NSF International prüft Rezeptur gegen FDA-Positiv-Liste. Voraussetzung in Lebensmittel-/Pharma-Produktion.",
    category: "food",
    icon: "food",
    color: "#0E6E2A",
    aliases: ["FDA H1", "H1", "NSF"],
  },
  {
    id: "nsf-h2",
    short: "NSF H2",
    full: "NSF H2",
    details:
      "Schmierstoffe für Lebensmittel-Maschinen OHNE Lebensmittelkontakt — weniger streng als H1.",
    category: "food",
    icon: "food",
    color: "#0E6E2A",
    aliases: ["H2"],
  },
  {
    id: "halal",
    short: "Halal",
    full: "Halal-zertifiziert",
    details:
      "Frei von Schweinefett und Alkohol-Spuren. In der Pharma- und Halal-Lebensmittelproduktion verlangt.",
    category: "religious",
    icon: "halal",
    color: "#0E6E2A",
    aliases: [],
  },
  {
    id: "kosher",
    short: "Kosher",
    full: "Kosher-zertifiziert",
    details:
      "Konform mit jüdischen Speisegesetzen — relevant für Lebensmittel-/Pharma-Maschinen mit entsprechender Kundschaft.",
    category: "religious",
    icon: "kosher",
    color: "#1F468B",
    aliases: [],
  },

  // ---------- Additiv-Eigenschaften (oft als Freigabe-Begriff genutzt) ----------
  {
    id: "boron-free",
    short: "Bor-frei",
    full: "Bor-frei formuliert",
    details:
      "Frei von Bor-/Borat-Verbindungen — relevant zur Vermeidung von ECHA-Beschränkungen (CMR-Verdacht) und für Klärschlamm-Entsorgung.",
    category: "additive",
    icon: "ecology",
    color: "#0E6E2A",
    aliases: ["boron-free", "borfrei"],
  },
  {
    id: "formaldehyde-free",
    short: "Formaldehyd-frei",
    full: "Frei von Formaldehyd-Depotbildnern",
    details:
      "Keine Triazin- oder andere Formaldehyd-Abspalter — empfohlen von Berufsgenossenschaften zur Reduktion von Hautirritationen.",
    category: "additive",
    icon: "ecology",
    color: "#0E6E2A",
    aliases: ["formaldehyde-free"],
  },
  {
    id: "biocide-free",
    short: "Biozid-frei",
    full: "Biozid-frei (BBF)",
    details:
      "Komplett ohne biozide Wirkstoffe (BBF — Boron-Biocide-Free). Reduziert Hautirritationen, erfordert dafür striktere Standzeit-Überwachung.",
    category: "additive",
    icon: "ecology",
    color: "#0E6E2A",
    aliases: ["BBF"],
  },
  {
    id: "chlor-free",
    short: "Chlor-frei",
    full: "Chlor-frei (chlorine-free)",
    details:
      "Frei von chlorierten Paraffinen (SCCP/MCCP) — erforderlich nach POP-Verordnung (EU) 2019/1021.",
    category: "additive",
    icon: "ecology",
    color: "#0E6E2A",
    aliases: ["chlorine-free", "SCCP-free"],
  },

  // ---------- Sicherheits- / Produktkennzeichnung ----------
  {
    id: "ce",
    short: "CE",
    full: "CE-Kennzeichnung",
    details:
      "Konformitätskennzeichnung der EU für Produkte des freien Warenverkehrs. Bei Schmierstoffen nur in Verbindung mit konkreten Produktrichtlinien relevant.",
    category: "labeling",
    icon: "ce",
    color: "#005EB8",
    aliases: [],
  },
  {
    id: "vde",
    short: "VDE",
    full: "VDE-Prüfzeichen",
    details:
      "Verband der Elektrotechnik — relevant bei dielektrischen Schmierstoffen / Transformatorenölen.",
    category: "labeling",
    icon: "vde",
    color: "#E30613",
    aliases: [],
  },
];

function tokenize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function resolveCert(raw: string): CertDef {
  const t = tokenize(raw);
  for (const c of CERTIFICATIONS) {
    const candidates = [c.id, c.short, ...c.aliases];
    for (const candidate of candidates) {
      if (t.includes(tokenize(candidate))) return c;
    }
  }
  return {
    id: `unknown-${tokenize(raw)}`,
    short: raw.length > 24 ? raw.slice(0, 22) + "…" : raw,
    full: raw,
    details:
      "Dieses Zertifikat ist im normierten Katalog nicht hinterlegt. Bitte prüfen, ob es sich um eine offizielle Werksfreigabe oder Norm handelt, und ggf. den Eintrag korrigieren.",
    category: "labeling",
    icon: "default",
    color: "#64748b",
    aliases: [],
  };
}

export function isKnownCert(raw: string): boolean {
  return !resolveCert(raw).id.startsWith("unknown-");
}

/** Vorschläge fürs Multi-Select beim Anlegen/Bearbeiten */
export function suggestCerts(query: string, max = 8): CertDef[] {
  const q = tokenize(query);
  if (!q) return CERTIFICATIONS.slice(0, max);
  const scored = CERTIFICATIONS.map((c) => {
    const haystack = [c.id, c.short, c.full, ...c.aliases].map(tokenize).join(" ");
    return { c, hit: haystack.includes(q) ? 2 : haystack.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0 };
  });
  return scored
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit)
    .slice(0, max)
    .map((x) => x.c);
}
