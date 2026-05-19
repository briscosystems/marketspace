/**
 * Heuristischer Parser für SDS-Texte (aus pdftotext extrahiert).
 *
 * Stützt sich auf die standardisierte 16-Abschnitt-Struktur (REACH/CLP/GHS):
 *   1.  Identifizierung
 *   2.  Mögliche Gefahren
 *   3.  Zusammensetzung
 *   9.  Physikalische und chemische Eigenschaften
 *  14.  Angaben zum Transport
 *
 * Erkennungsmuster sind in DE und EN tolerant gebaut — wir verlieren ggf.
 * einzelne Felder bei sehr abweichenden Layouts, aber decken die ~80%
 * Standard-SDS gut ab.
 */

export const PARSER_VERSION = "1.0";

export type ParsedSds = {
  hStatements: string[];
  pStatements: string[];
  ghsPictograms: string[];
  signalWord: string | null;

  physicalState: string | null;
  appearanceColor: string | null;
  odor: string | null;
  phValue: number | null;
  phContext: string | null;
  flashpointC: number | null;
  densityGcm3: number | null;
  viscosityKv40: number | null;
  pourpointC: number | null;
  boilingPointC: number | null;
  waterSolubility: string | null;

  casNumbers: string[];

  adrClass: string | null;
  unNumber: string | null;
  transportClass: string | null;

  supplierName: string | null;
  supplierAddress: string | null;
  emergencyPhone: string | null;
};

const EMPTY: ParsedSds = {
  hStatements: [],
  pStatements: [],
  ghsPictograms: [],
  signalWord: null,
  physicalState: null,
  appearanceColor: null,
  odor: null,
  phValue: null,
  phContext: null,
  flashpointC: null,
  densityGcm3: null,
  viscosityKv40: null,
  pourpointC: null,
  boilingPointC: null,
  waterSolubility: null,
  casNumbers: [],
  adrClass: null,
  unNumber: null,
  transportClass: null,
  supplierName: null,
  supplierAddress: null,
  emergencyPhone: null,
};

export function parseSdsText(text: string | null | undefined): ParsedSds {
  if (!text) return EMPTY;
  const t = text.replace(/\r\n?/g, "\n");

  return {
    hStatements: extractStatements(t, /\bH\d{3}[A-Za-z]?\b/g),
    pStatements: extractStatements(t, /\bP\d{3}(?:\s*\+\s*P\d{3})*\b/g),
    ghsPictograms: extractStatements(t, /\bGHS0[1-9]\b/g),
    signalWord: extractSignalWord(t),

    physicalState: extractPhysicalState(t),
    appearanceColor: extractAfterLabel(t, [
      /Farbe[:\s]+([^\n.]{2,60})/i,
      /Color[:\s]+([^\n.]{2,60})/i,
    ]),
    odor: extractAfterLabel(t, [
      /Geruch[:\s]+([^\n.]{2,60})/i,
      /Odo(?:u)?r[:\s]+([^\n.]{2,60})/i,
    ]),
    ...extractPh(t),
    flashpointC: extractFlashpoint(t),
    densityGcm3: extractDensity(t),
    viscosityKv40: extractViscosity(t),
    pourpointC: extractPourpoint(t),
    boilingPointC: extractBoilingPoint(t),
    waterSolubility: extractSolubility(t),

    casNumbers: extractCasNumbers(t),

    ...extractTransport(t),

    supplierName: null, // schwer ohne Layout-Wissen; vorerst leer
    supplierAddress: null,
    emergencyPhone: extractEmergencyPhone(t),
  };
}

function extractStatements(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace(/\s+/g, ""))));
}

function extractSignalWord(text: string): string | null {
  const m = text.match(/Signalwort[:\s]+(Gefahr|Achtung)/i) ?? text.match(/Signal\s*word[:\s]+(Danger|Warning)/i);
  if (m) return capitalize(m[1]);
  // Direkter Standalone-Match in der Section-2-Region
  if (/\bGefahr\b/i.test(text) && /\bH\d{3}/.test(text)) return "Gefahr";
  if (/\bDanger\b/i.test(text) && /\bH\d{3}/.test(text)) return "Danger";
  if (/\bAchtung\b/i.test(text) && /\bH\d{3}/.test(text)) return "Achtung";
  if (/\bWarning\b/i.test(text) && /\bH\d{3}/.test(text)) return "Warning";
  return null;
}

function extractPhysicalState(text: string): string | null {
  const m =
    text.match(/Aggregatzustand[:\s]+([^\n.]{2,40})/i) ||
    text.match(/Physical\s*state[:\s]+([^\n.]{2,40})/i) ||
    text.match(/Form[:\s]+(flüssig|fest|gasförmig|liquid|solid|paste|aerosol|gas)/i);
  return m ? m[1].trim() : null;
}

function extractAfterLabel(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const value = m[1].trim();
      if (!value || /^[-—]+$/.test(value) || /keine? Daten/i.test(value)) continue;
      return value.length > 80 ? value.slice(0, 80) : value;
    }
  }
  return null;
}

function extractPh(text: string): { phValue: number | null; phContext: string | null } {
  // Match: "pH-Wert: 9.2 (Konzentrat)" oder "pH value: 8.5-9.5"
  const patterns: Array<{ pattern: RegExp; contextFrom?: number }> = [
    { pattern: /pH[-\s]*Wert[:\s]+(\d{1,2}(?:[,.]\d+)?)(?:\s*[–-]\s*\d{1,2}(?:[,.]\d+)?)?\s*\(?\s*([^)\n]*?)\)?(?=\s|$|\n)/i },
    { pattern: /pH\s*value[:\s]+(\d{1,2}(?:[,.]\d+)?)(?:\s*[–-]\s*\d{1,2}(?:[,.]\d+)?)?\s*\(?\s*([^)\n]*?)\)?(?=\s|$|\n)/i },
    { pattern: /\bpH\s*[:=]\s*(\d{1,2}(?:[,.]\d+)?)/i },
  ];
  for (const { pattern } of patterns) {
    const m = text.match(pattern);
    if (m) {
      const num = parseFloat(m[1].replace(",", "."));
      if (!Number.isNaN(num) && num >= 0 && num <= 14) {
        const context = m[2]?.trim() || null;
        return {
          phValue: num,
          phContext: context && context.length < 60 && !/^[–-]+$/.test(context) ? context : null,
        };
      }
    }
  }
  return { phValue: null, phContext: null };
}

function extractFlashpoint(text: string): number | null {
  // Patterns: "Flammpunkt: 165 °C", "Flash point: > 200 °C"
  const m =
    text.match(/Flammpunkt[:\s]+(?:>?\s*ca\.?\s*)?(\d{2,3})\s*°?\s*C/i) ||
    text.match(/Flash\s*point[:\s]+(?:>?\s*ca\.?\s*)?(\d{2,3})\s*°?\s*C/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (v > 0 && v < 1000) return v;
  }
  return null;
}

function extractDensity(text: string): number | null {
  // "Dichte: 0.89 g/cm³", "Density: 0.89 g/ml at 20 °C"
  const m =
    text.match(/Dichte[:\s]+(?:bei[^\n]*)?(\d(?:[,.]\d+)?)\s*g\/(?:cm³|ml|cm3|mL)/i) ||
    text.match(/Density[:\s]+(?:at[^\n]*)?(\d(?:[,.]\d+)?)\s*g\/(?:cm³|ml|cm3|mL)/i);
  if (m) {
    const v = parseFloat(m[1].replace(",", "."));
    if (v > 0.5 && v < 2.5) return v;
  }
  return null;
}

function extractViscosity(text: string): number | null {
  // "Viskosität: 32 mm²/s bei 40 °C" — wir wollen den 40°C-Wert
  const patterns = [
    /Viskosit[äa]t[^\n]{0,80}?(\d{1,4}(?:[,.]\d+)?)\s*mm[²2]\/s[^\n]{0,40}40\s*°?\s*C/i,
    /Kinematic\s*viscosity[^\n]{0,80}?(\d{1,4}(?:[,.]\d+)?)\s*mm[²2]\/s[^\n]{0,40}40\s*°?\s*C/i,
    /(\d{1,4}(?:[,.]\d+)?)\s*mm[²2]\/s\s*(?:\(\s*)?40\s*°?\s*C/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1].replace(",", "."));
      if (v > 1 && v < 10000) return v;
    }
  }
  return null;
}

function extractPourpoint(text: string): number | null {
  const m =
    text.match(/Stockpunkt[:\s]+(?:ca\.?\s*)?(-?\d{1,3})\s*°?\s*C/i) ||
    text.match(/Pour\s*point[:\s]+(?:ca\.?\s*)?(-?\d{1,3})\s*°?\s*C/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (v > -100 && v < 100) return v;
  }
  return null;
}

function extractBoilingPoint(text: string): number | null {
  const m =
    text.match(/Siedebeginn[^\n]{0,40}?(\d{2,4})\s*°?\s*C/i) ||
    text.match(/Siedepunkt[^\n]{0,40}?(\d{2,4})\s*°?\s*C/i) ||
    text.match(/Boiling\s*point[^\n]{0,40}?(\d{2,4})\s*°?\s*C/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (v > 0 && v < 1000) return v;
  }
  return null;
}

function extractSolubility(text: string): string | null {
  const m =
    text.match(/Wasserlöslichkeit[:\s]+([^\n.]{3,60})/i) ||
    text.match(/Water\s*solubility[:\s]+([^\n.]{3,60})/i) ||
    text.match(/Löslichkeit\s+in\s+Wasser[:\s]+([^\n.]{3,60})/i);
  if (m && m[1]) {
    const v = m[1].trim();
    return v.length < 80 ? v : v.slice(0, 80);
  }
  return null;
}

function extractCasNumbers(text: string): string[] {
  // CAS-Format: <2-7 Ziffern>-<2 Ziffern>-<1 Ziffer>
  const matches = text.match(/\b\d{2,7}-\d{2}-\d\b/g) ?? [];
  // Validierung: CAS-Prüfziffer-Check
  const valid = matches.filter((cas) => isValidCas(cas));
  return Array.from(new Set(valid));
}

function isValidCas(cas: string): boolean {
  const digits = cas.replace(/-/g, "");
  if (digits.length < 5 || digits.length > 10) return false;
  const body = digits.slice(0, -1);
  const checkDigit = parseInt(digits.slice(-1), 10);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum += parseInt(body[body.length - 1 - i], 10) * (i + 1);
  }
  return sum % 10 === checkDigit;
}

function extractTransport(text: string): {
  adrClass: string | null;
  unNumber: string | null;
  transportClass: string | null;
} {
  // UN-Nummer
  const unMatch = text.match(/\bUN[-\s]?(\d{4})\b/);
  const unNumber = unMatch ? `UN${unMatch[1]}` : null;

  // ADR-Klasse
  let adrClass: string | null = null;
  const adrMatch =
    text.match(/ADR[^\n]{0,60}?Klasse[:\s]+(\d(?:\.\d)?)/i) ||
    text.match(/Transport(?:gefahren)?klasse[(n)]*[:\s]+(\d(?:\.\d)?)/i) ||
    text.match(/Hazard\s*class[:\s]+(\d(?:\.\d)?)/i);
  if (adrMatch) adrClass = adrMatch[1];

  // "Kein Gefahrgut" / "Not regulated"
  let transportClass: string | null = null;
  if (/kein\s+Gefahrgut/i.test(text) || /Not\s*regulated/i.test(text) || /Nicht\s*klassifiziert/i.test(text)) {
    transportClass = "kein Gefahrgut";
    adrClass = adrClass ?? "—";
  } else if (adrClass) {
    transportClass = `ADR Klasse ${adrClass}`;
  }

  return { adrClass, unNumber, transportClass };
}

function extractEmergencyPhone(text: string): string | null {
  // "Notrufnummer: +49 ..." oder "Emergency telephone: +1 ..."
  const m =
    text.match(/Notruf(?:nummer|telefon)?[:\s]+([\+\d][\d\s()\/+-]{7,25})/i) ||
    text.match(/Emergency\s*telephone[:\s]+([\+\d][\d\s()\/+-]{7,25})/i);
  if (m) {
    return m[1].trim().slice(0, 40);
  }
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
