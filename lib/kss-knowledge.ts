// KSS-Praxiswissen-Konstanten — Filter-Optionen, Wizard-Fragen, Zertifikate.
// Quellen: helcotec FAQ, Blaser Swisslube Tech-Doku, TRGS 611, DGUV 109-003,
// VKIS/VSI-Stoffliste (DIN 51385), Industry-Foren.

export const APPLICATION_AREAS = [
  "Drehen",
  "Fräsen",
  "Bohren",
  "Tieflochbohren",
  "Schleifen",
  "Honen",
  "Sägen",
  "Räumen",
  "Gewindeschneiden",
  "Stanzen",
  "Tiefziehen",
  "Walzen",
  "Schweißen",
  "Erodieren (EDM)",
  "Funkenerosion Senken",
  "Funkenerosion Drahterodieren",
  "Minimalmengenschmierung (MMS)",
  "Hochdruck-Innenkühlung",
  "Trockenbearbeitung",
] as const;

export const MATERIALS = [
  "Stahl (Baustahl, Vergütungsstahl)",
  "Edelstahl / Inox",
  "Werkzeugstahl (HSS, gehärtet)",
  "Aluminium-Knetlegierungen",
  "Aluminium-Gusslegierungen",
  "Buntmetall (Messing, Bronze, Kupfer)",
  "Gusseisen (GG, GGG)",
  "Titan / Titanlegierungen",
  "Nickelbasislegierungen (Inconel, Hastelloy)",
  "Magnesium",
  "Hartmetall / Sinterwerkstoffe",
  "Kunststoffe / Composites",
  "Verbundwerkstoffe (CFK/GFK)",
] as const;

export const CRITICAL_ISSUES = [
  "Bakterienbefall / Verkeimung",
  "Pilz- / Hefebefall",
  "Geruchsbildung (H₂S)",
  "Schaumbildung",
  "Fleckenbildung Buntmetall",
  "Aluminium-Anlauf / Verfärbung",
  "Korrosion Maschinen / Werkstücke",
  "Hautirritation / Ekzeme",
  "Atemwegsreizung / Aerosole",
  "Harzartige / klebrige Ablagerungen",
  "Niedrige Werkzeugstandzeit",
  "Fremdöleintrag (Tramp Oil)",
  "Nitrit > 20 mg/l (TRGS 611)",
  "Lack-/Beschichtungs-Rückstände",
  "Emulsionsinstabilität / Phasentrennung",
  "Dichtungsschaden (Quellung/Versprödung)",
] as const;

export const CERTIFICATIONS = [
  { code: "TRGS-611", label: "TRGS 611 (DE-Vorschrift, bor-/aminbasiert)" },
  { code: "TRGS-552", label: "TRGS 552 (N-Nitrosamine)" },
  { code: "DGUV-109-003", label: "DGUV Regel 109-003 (Tätigkeiten mit KSS)" },
  { code: "DGUV-209-051", label: "DGUV Information 209-051 (mikrobielle Belastung)" },
  { code: "VKIS-VSI-IGM-BGHM", label: "VKIS/VSI/IGM/BGHM-Stoffliste (DIN 51385)" },
  { code: "NSF-H1", label: "NSF H1 (Lebensmittelkontakt)" },
  { code: "NSF-H2", label: "NSF H2 (Lebensmittelnähe)" },
  { code: "BLAUER-ENGEL", label: "Blauer Engel (DE-UZ 178)" },
  { code: "HALAL-KOSHER", label: "Halal / Kosher" },
  { code: "REACH", label: "REACH-/CLP-konform, SVHC-frei" },
  { code: "WGK-1", label: "WGK 1 (schwach wassergefährdend)" },
  { code: "WGK-2", label: "WGK 2 (wassergefährdend)" },
  { code: "OEM-DMG-MORI", label: "OEM-Freigabe DMG Mori" },
  { code: "OEM-MAZAK", label: "OEM-Freigabe Mazak" },
  { code: "OEM-GF", label: "OEM-Freigabe GF Machining" },
  { code: "OEM-SANDVIK", label: "OEM-Freigabe Sandvik Coromant" },
] as const;

export const PRODUCTION_TYPES = [
  {
    value: "CONTRACT_MANUFACTURING",
    label: "Lohnfertigung",
    description: "Wechselnde Werkstoffe und Aufträge — Universal-KSS empfohlen",
  },
  {
    value: "SERIAL_PRODUCTION",
    label: "Serienproduktion",
    description: "Konstantes Werkstück/Verfahren — Spezial-KSS möglich",
  },
  {
    value: "MIXED",
    label: "Mischbetrieb",
    description: "Sowohl Serie als auch Lohn",
  },
] as const;

export const COOLANT_FORMS = [
  {
    value: "CONVENTIONAL_EMULSION",
    label: "Konventionelle Emulsion",
    description: "Milchig, Mineralölbasis + Tenside",
  },
  {
    value: "SEMI_SYNTHETIC",
    label: "Teilsynthetisch (milchig-opal)",
    description: "Reduzierter Mineralölanteil, weniger Tramp-Oil-Probleme",
  },
  {
    value: "FULL_SYNTHETIC",
    label: "Vollsynthetisch (klar)",
    description: "Ohne Mineralöl, sehr gute Filtrierbarkeit, oft für Schleifen",
  },
  {
    value: "TWO_COMPONENT",
    label: "Zweikomponenten-System",
    description: "Konzentrat + separater Korrosionsschutz, hohe Flexibilität",
  },
] as const;

// Wizard-Fragen (Reihenfolge wichtig — vom Generischen zum Spezifischen)
export const WIZARD_QUESTIONS = [
  {
    id: "satisfied",
    type: "boolean",
    label: "Bist du mit dem bestehenden KSS zufrieden?",
    help: "Wenn nein, beschreibe weiter unten die Probleme.",
  },
  {
    id: "currentProductId",
    type: "product-select",
    label: "Welchen KSS verwendest du aktuell? (optional)",
    help: "Wähle aus dem Katalog — hilft der KI bei Vergleichsbasis.",
  },
  {
    id: "problemDescription",
    type: "text",
    label: "Was genau ist das Problem? Oder: was suchst du im neuen KSS?",
    help: "Z.B. 'Riecht nach 2 Wochen schon faulig' oder 'Brauche etwas für Inconel-Bearbeitung'. Sprach-Eingabe möglich.",
    placeholder: "Sprich frei — z.B. zu Standzeit, Geruch, Hautreizung, Material-Mix, Maschinenfreigaben…",
  },
  {
    id: "applicationAreas",
    type: "multi-select",
    label: "Welche Bearbeitungsverfahren laufen?",
    options: APPLICATION_AREAS,
  },
  {
    id: "materials",
    type: "multi-select",
    label: "Welche Werkstoffe werden bearbeitet?",
    options: MATERIALS,
  },
  {
    id: "productionType",
    type: "single-select",
    label: "Lohnfertigung oder Serienproduktion?",
    options: PRODUCTION_TYPES,
  },
  {
    id: "concentrateForm",
    type: "single-select",
    label: "Bevorzugte KSS-Form?",
    options: COOLANT_FORMS,
  },
  {
    id: "criticalIssues",
    type: "multi-select",
    label: "Welche kritischen Punkte sind dir wichtig?",
    options: CRITICAL_ISSUES,
  },
  {
    id: "certifications",
    type: "multi-select",
    label: "Welche Zertifizierungen sind erforderlich?",
    options: CERTIFICATIONS.map((c) => c.label),
  },
  {
    id: "waterHardness",
    type: "number",
    label: "Wasserhärte am Standort (°dH, optional)",
    placeholder: "z.B. 14",
  },
] as const;
