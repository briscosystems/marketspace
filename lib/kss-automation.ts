/**
 * Wissensbasis: Bearbeitungsverfahren (Einsatzbereiche), KSS-Messmethoden
 * und Automatisierungs-Eignung von Kühlschmierstoffen.
 *
 * Hintergrund (aus Domain-Wissen + DGUV/IFA-Empfehlungen):
 * - Refraktometer ist die Standard-Methode; durch Fremdöle und unstabile
 *   Emulsionen kann die Anzeige verfälscht werden.
 * - Titrimetrie / Säurespaltung ist robust gegen Fremdöle und Glykol-
 *   Rückstände, dafür langsamer und arbeitsintensiver.
 * - Konduktometrie funktioniert nur bei Lösungen (synthetische KSS),
 *   nicht bei Emulsionen, und reagiert auf Salzeinträge.
 * - Glykolhaltige KSS (Bor-Borat-Frei oder synthetische Hochleistungs-KSS
 *   auf PEG/PAG-Basis) bilden zähe Filme auf Refraktometer-Prismen und
 *   Sensoroberflächen — Vollautomation per Refraktometer ist deshalb
 *   nicht zuverlässig. In diesen Fällen ist die volumetrisch-titrimetrische
 *   Konzentrationsbestimmung (Dosimetrix-artige Verfahren) die richtige
 *   Wahl, weil sie unabhängig vom Brechungsindex arbeitet.
 */

// ---------------------------------------------------------------------------
// Bearbeitungsverfahren — was kann ich mit dem Produkt machen?
// ---------------------------------------------------------------------------
export type MachiningOperationId =
  | "fraesen"
  | "drehen"
  | "bohren"
  | "tieflochbohren"
  | "gewindeschneiden"
  | "reiben"
  | "raeumen"
  | "saegen"
  | "schleifen_flach"
  | "schleifen_rund"
  | "schleifen_innen"
  | "schleifen_zahnrad"
  | "honen"
  | "laeppen"
  | "walzfraesen"
  | "stanzen"
  | "tiefziehen"
  | "umformen"
  | "edm_funkenerosion"
  | "hartdrehen"
  | "schwerzerspanung";

export type MachiningOperation = {
  id: MachiningOperationId;
  label: string;
  group: "spanend" | "umformend" | "trennend" | "abrasiv" | "sonstige";
  hint?: string;
};

export const MACHINING_OPERATIONS: MachiningOperation[] = [
  { id: "fraesen", label: "Fräsen", group: "spanend" },
  { id: "drehen", label: "Drehen", group: "spanend" },
  { id: "bohren", label: "Bohren", group: "spanend" },
  { id: "tieflochbohren", label: "Tieflochbohren", group: "spanend", hint: "Spezielle Anforderung an Druck und Schmierung" },
  { id: "gewindeschneiden", label: "Gewindeschneiden", group: "spanend" },
  { id: "reiben", label: "Reiben", group: "spanend" },
  { id: "raeumen", label: "Räumen", group: "spanend" },
  { id: "saegen", label: "Sägen", group: "trennend" },
  { id: "schleifen_flach", label: "Flachschleifen", group: "abrasiv" },
  { id: "schleifen_rund", label: "Rundschleifen", group: "abrasiv" },
  { id: "schleifen_innen", label: "Innenrundschleifen", group: "abrasiv" },
  { id: "schleifen_zahnrad", label: "Zahnradschleifen", group: "abrasiv" },
  { id: "honen", label: "Honen", group: "abrasiv" },
  { id: "laeppen", label: "Läppen", group: "abrasiv" },
  { id: "walzfraesen", label: "Wälzfräsen / Verzahnen", group: "spanend" },
  { id: "stanzen", label: "Stanzen", group: "umformend" },
  { id: "tiefziehen", label: "Tiefziehen", group: "umformend" },
  { id: "umformen", label: "Massivumformen", group: "umformend" },
  { id: "edm_funkenerosion", label: "Funkenerosion (EDM)", group: "sonstige", hint: "Dielektrikum, kein klassischer KSS" },
  { id: "hartdrehen", label: "Hartdrehen", group: "spanend" },
  { id: "schwerzerspanung", label: "Schwerzerspanung", group: "spanend" },
];

export function getOperation(id: MachiningOperationId): MachiningOperation | undefined {
  return MACHINING_OPERATIONS.find((o) => o.id === id);
}

// ---------------------------------------------------------------------------
// Messverfahren — wie wird die Konzentration bestimmt?
// ---------------------------------------------------------------------------
export type MeasurementMethodId =
  | "refraktometer_hand"
  | "refraktometer_inline"
  | "titrimetrie"
  | "konduktometrie"
  | "dosimetrix"
  | "labor_analytik";

export type MeasurementMethod = {
  id: MeasurementMethodId;
  label: string;
  short: string;
  details: string;
  /** 1 = nur Stichprobe, 5 = vollautomatisch dauerhaft */
  automationLevel: number;
  /** Verträgt sich mit glykolhaltigen KSS? */
  glycolCompatible: boolean;
  /** Verträgt sich mit Emulsionen mit Fremdöl-Anteil? */
  trampOilTolerant: boolean;
};

export const MEASUREMENT_METHODS: MeasurementMethod[] = [
  {
    id: "refraktometer_hand",
    label: "Hand-Refraktometer",
    short: "Hand-Refraktometer",
    details:
      "Standardmessung in der Werkstatt. Eine Probe wird auf das Prisma getropft, die Skala zeigt °Brix oder direkt %. Schnell und günstig, aber durch Fremdöl oder eingetrübte Emulsionen verfälscht; Glykol-haltige Rezepturen bilden Filme auf dem Prisma.",
    automationLevel: 1,
    glycolCompatible: false,
    trampOilTolerant: false,
  },
  {
    id: "refraktometer_inline",
    label: "Inline-Refraktometer",
    short: "Inline-Refraktometer",
    details:
      "Im KSS-Kreislauf fest verbautes Refraktometer, das laufend misst und Daten an eine Steuerung gibt (Liquidtool, GIMAT, Bosch). Voraussetzung: klare Emulsion ohne Filmbildung am Sensor — bei glykolhaltigen KSS oder hoher Schaumneigung treten Drifts und Wartungsbedarf auf.",
    automationLevel: 4,
    glycolCompatible: false,
    trampOilTolerant: false,
  },
  {
    id: "titrimetrie",
    label: "Säurespaltung / Titration",
    short: "Titration",
    details:
      "Volumetrisches Verfahren: definierte Probemenge wird angesäuert/indikatorgefärbt, die zugegebene Maßlösung gibt die Konzentration. Robust gegen Fremdöle und Glykol-Rückstände, aber arbeitsintensiv. Wird bei Plausibilitäts-Abweichungen zwischen Refraktometer und Sollwert als Referenz herangezogen.",
    automationLevel: 2,
    glycolCompatible: true,
    trampOilTolerant: true,
  },
  {
    id: "konduktometrie",
    label: "Konduktometrie",
    short: "Konduktometrie",
    details:
      "Leitfähigkeitsmessung der Lösung — funktioniert nur bei vollsynthetischen KSS (echte Lösungen). Reagiert empfindlich auf Salz-/Hartwasser-Einträge; nicht geeignet für Emulsionen.",
    automationLevel: 3,
    glycolCompatible: true,
    trampOilTolerant: false,
  },
  {
    id: "dosimetrix",
    label: "Dosimetrix (volumetrische Dosierregelung)",
    short: "Dosimetrix",
    details:
      "Volumetrisch-titrimetrische Regelung: das System dosiert Konzentrat und Wasser nach Bilanz/Verbrauch und prüft die Konzentration über Säurespaltung. Funktioniert unabhängig vom Brechungsindex und ist deshalb die Methode der Wahl, wenn das KSS Glykol-Anteile enthält und ein Refraktometer-Sensor zu schnell verölt oder verfilmt.",
    automationLevel: 5,
    glycolCompatible: true,
    trampOilTolerant: true,
  },
  {
    id: "labor_analytik",
    label: "Externe Laboranalytik",
    short: "Labor",
    details:
      "GC, IR, ICP-OES und vollständige biologische Analytik im Schmierstofflabor — höchste Aussagekraft, aber Versand und Tage Wartezeit.",
    automationLevel: 1,
    glycolCompatible: true,
    trampOilTolerant: true,
  },
];

export function getMethod(id: string): MeasurementMethod | undefined {
  return MEASUREMENT_METHODS.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// Automatisierungs-Eignung — Score & Begründung
// ---------------------------------------------------------------------------
export type AutomationProfile = {
  /** 1 = Stichprobe per Hand, 5 = sensor-basierte Vollautomation */
  score: number;
  fit: "excellent" | "good" | "fair" | "limited";
  reasons: string[];
  warnings: string[];
  recommendedMethods: MeasurementMethodId[];
};

export type AutomationInput = {
  productType?: string;
  chemistry?: string;
  containsGlycol?: boolean | null;
  mineralOilContent?: number | null;
  manufacturerProvidedScore?: number | null;
  manufacturerRecommendedMethods?: string[];
};

/**
 * Schätzt die Eignung eines KSS für die KSS-Vollautomation ab. Faktoren:
 * - Glykolanteil → Filmbildung auf Refraktometer/Sensor
 * - Vollsynthetisch vs. Emulsion → Refraktometer/Konduktometrie
 * - Mineralölanteil → Refraktometer-Tauglichkeit (saubere Brechungslinie)
 */
export function estimateAutomation(input: AutomationInput): AutomationProfile {
  const productType = (input.productType ?? "").toLowerCase();
  const chem = (input.chemistry ?? "").toUpperCase();
  const isCoolant =
    productType.includes("kss") ||
    productType.includes("emulsion") ||
    productType.includes("kühlschmier") ||
    productType.includes("kuehlschmier") ||
    productType.includes("schleif");

  const reasons: string[] = [];
  const warnings: string[] = [];
  const recommendedMethods: MeasurementMethodId[] = [];
  let score = 4; // neutraler Startwert für wassermischbare KSS

  if (!isCoolant) {
    // Nicht-wassermischbare Öle: keine klassische Konzentrationsmessung
    return {
      score: 0,
      fit: "limited",
      reasons: ["Kein wassermischbarer KSS — keine klassische Konzentrationsmessung."],
      warnings: [],
      recommendedMethods: ["labor_analytik"],
    };
  }

  if (input.containsGlycol === true) {
    score -= 2;
    warnings.push(
      "Glykolhaltige KSS bilden zähe Filme auf Refraktometer-Prismen und Sensoroberflächen — Inline-Refraktometer-Lösungen driften und sind wartungsintensiv.",
    );
    reasons.push("Glykolhaltige Rezeptur erkannt — keine Refraktometer-Vollautomation empfehlen.");
    recommendedMethods.push("dosimetrix", "titrimetrie");
  }

  if (chem === "SYNTHETIC") {
    // Reine synthetische Lösungen sind konduktometrisch messbar
    reasons.push("Vollsynthetische Lösung — Konduktometrie als Inline-Verfahren möglich.");
    if (!recommendedMethods.includes("konduktometrie")) recommendedMethods.push("konduktometrie");
    score += 0;
  }

  if (chem === "MINERAL" || chem === "SEMI_SYNTHETIC") {
    reasons.push("Mineralöl-basierte Emulsion — klassisches Inline-Refraktometer geeignet (klare Brechungslinie).");
    if (!recommendedMethods.includes("refraktometer_inline")) recommendedMethods.push("refraktometer_inline");
  }

  if (typeof input.mineralOilContent === "number") {
    if (input.mineralOilContent > 70) {
      reasons.push(`Hoher Mineralölanteil (${input.mineralOilContent} %) — Refraktometer liefert scharfe Trennlinie.`);
      score += 1;
    } else if (input.mineralOilContent < 5) {
      warnings.push("Sehr geringer Mineralölanteil — Refraktometer-Anzeige eventuell unscharf, Titration als Referenz empfehlen.");
      score -= 1;
    }
  }

  if (typeof input.manufacturerProvidedScore === "number") {
    // Wenn der Hersteller einen Score angegeben hat, wird der mit dem
    // geschätzten Score gemittelt.
    score = Math.round((score + input.manufacturerProvidedScore) / 2);
  }

  if (
    input.manufacturerRecommendedMethods &&
    input.manufacturerRecommendedMethods.length > 0
  ) {
    for (const m of input.manufacturerRecommendedMethods) {
      if (
        MEASUREMENT_METHODS.some((mm) => mm.id === m) &&
        !recommendedMethods.includes(m as MeasurementMethodId)
      ) {
        recommendedMethods.unshift(m as MeasurementMethodId);
      }
    }
  }

  // Fallback wenn nichts empfohlen wurde
  if (recommendedMethods.length === 0) {
    recommendedMethods.push("refraktometer_hand");
  }

  score = Math.max(1, Math.min(5, score));
  const fit: AutomationProfile["fit"] =
    score >= 5 ? "excellent" : score >= 4 ? "good" : score >= 3 ? "fair" : "limited";

  return { score, fit, reasons, warnings, recommendedMethods };
}

export const AUTOMATION_FIT_LABEL: Record<AutomationProfile["fit"], string> = {
  excellent: "Sehr gut automatisierbar",
  good: "Gut automatisierbar",
  fair: "Eingeschränkt automatisierbar",
  limited: "Nicht für Vollautomation empfohlen",
};

export const AUTOMATION_FIT_COLOR: Record<AutomationProfile["fit"], string> = {
  excellent: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  good: "bg-green-100 text-green-800 ring-green-300",
  fair: "bg-amber-100 text-amber-800 ring-amber-300",
  limited: "bg-red-100 text-red-800 ring-red-300",
};
