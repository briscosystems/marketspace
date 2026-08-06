/**
 * Bewertung von Tank-Messwerten gegen die Pflege-Sollwerte des Produkts.
 *
 * Das ist der fachliche Kern des Tank-Registers: Eine Zahl allein hilft dem
 * Betrieb nicht — er muss wissen, ob sie in Ordnung ist und was zu tun wäre.
 * Die Sollwerte stammen aus den Herstellerdatenblättern (Daten-Sprint
 * 2026-08-05); fehlen sie, wird bewusst NICHT bewertet, statt zu raten.
 *
 * Grenzwerte, die nicht vom Produkt abhängen:
 *  - Nitrit: TRGS 611 begrenzt wassermischbare KSS auf 20 mg/l.
 *  - pH: Unter 8,5 wird die Emulsion anfällig für Bakterien und Korrosion,
 *    das ist Stand der Technik (DGUV-Regel 109-003) und gilt zusätzlich zum
 *    produktspezifischen Fenster.
 */

export type Ampel = "gut" | "achtung" | "kritisch" | "unbekannt";

export type Sollwerte = {
  refractometerFactor: number | null;
  recommendedConcentrationMin: number | null;
  recommendedConcentrationMax: number | null;
  phEmulsionMin: number | null;
  phEmulsionMax: number | null;
};

export type Messwerte = {
  brix: number | null;
  concentrationPct: number | null;
  ph: number | null;
  nitritePpm: number | null;
  bacteria: "NONE" | "LOW" | "MEDIUM" | "HIGH" | null;
};

export type Befund = {
  /** Kurzbezeichnung des geprüften Werts, z.B. "Konzentration". */
  feld: string;
  ampel: Ampel;
  /** Was gemessen wurde, fertig formatiert. */
  wert: string;
  /** Was sein sollte — leer, wenn kein Sollwert hinterlegt ist. */
  soll: string | null;
  /** Klartext-Hinweis für die Werkstatt. */
  hinweis: string | null;
};

/** Rechnet die Refraktometer-Ablesung in Prozent um, wenn ein Faktor bekannt ist. */
export function konzentrationAusBrix(brix: number | null, faktor: number | null): number | null {
  if (brix == null || faktor == null) return null;
  return Math.round(brix * faktor * 10) / 10;
}

/** Die schlechteste Ampel gewinnt — so entsteht das Gesamturteil. */
export function schlechteste(ampeln: Ampel[]): Ampel {
  if (ampeln.includes("kritisch")) return "kritisch";
  if (ampeln.includes("achtung")) return "achtung";
  if (ampeln.includes("gut")) return "gut";
  return "unbekannt";
}

function fmt(n: number, einheit: string): string {
  return `${n.toString().replace(".", ",")} ${einheit}`;
}

/**
 * Nachdosier-Empfehlung: Wie viel Konzentrat fehlt, um von der gemessenen auf
 * die Ziel-Konzentration zu kommen? Bewusst grob gerechnet (Volumen × Differenz)
 * — genauer wäre Scheingenauigkeit, weil Verschleppung und Verdunstung
 * mitspielen.
 */
export function nachdosierLiter(
  volumenLiter: number | null,
  istPct: number | null,
  zielPct: number | null,
): number | null {
  if (volumenLiter == null || istPct == null || zielPct == null) return null;
  if (zielPct <= istPct) return null;
  const liter = (volumenLiter * (zielPct - istPct)) / 100;
  return Math.round(liter * 10) / 10;
}

export function bewerteMessung(m: Messwerte, s: Sollwerte): Befund[] {
  const befunde: Befund[] = [];

  // ---- Konzentration ----
  const konz = m.concentrationPct ?? konzentrationAusBrix(m.brix, s.refractometerFactor);
  if (konz != null) {
    const min = s.recommendedConcentrationMin;
    const max = s.recommendedConcentrationMax;
    const soll = min != null && max != null ? `${min}–${max} %` : null;
    if (min == null || max == null) {
      befunde.push({
        feld: "Konzentration",
        ampel: "unbekannt",
        wert: fmt(konz, "%"),
        soll: null,
        hinweis: "Für dieses Produkt ist kein Konzentrationsbereich hinterlegt — der Wert wird nur festgehalten, nicht bewertet.",
      });
    } else if (konz < min * 0.8) {
      befunde.push({
        feld: "Konzentration",
        ampel: "kritisch",
        wert: fmt(konz, "%"),
        soll,
        hinweis: "Deutlich zu mager. Bei dieser Konzentration drohen Korrosion, Bakterienwachstum und schlechte Standzeit — Konzentrat nachdosieren.",
      });
    } else if (konz < min) {
      befunde.push({
        feld: "Konzentration",
        ampel: "achtung",
        wert: fmt(konz, "%"),
        soll,
        hinweis: "Etwas zu mager — nachdosieren, bevor es kippt.",
      });
    } else if (konz > max * 1.2) {
      befunde.push({
        feld: "Konzentration",
        ampel: "kritisch",
        wert: fmt(konz, "%"),
        soll,
        hinweis: "Deutlich zu fett. Das kostet unnötig Konzentrat und begünstigt Hautreizungen und Rückstände — mit Wasser verdünnen.",
      });
    } else if (konz > max) {
      befunde.push({
        feld: "Konzentration",
        ampel: "achtung",
        wert: fmt(konz, "%"),
        soll,
        hinweis: "Etwas zu fett — mit Wasser verdünnen.",
      });
    } else {
      befunde.push({ feld: "Konzentration", ampel: "gut", wert: fmt(konz, "%"), soll, hinweis: null });
    }
  }

  // ---- pH ----
  if (m.ph != null) {
    const min = s.phEmulsionMin;
    const max = s.phEmulsionMax;
    const soll = min != null && max != null ? (min === max ? `ca. ${min}` : `${min}–${max}`) : null;
    if (m.ph < 8.5) {
      // Gilt unabhängig vom Produkt: unter 8,5 kippt die Emulsion.
      befunde.push({
        feld: "pH-Wert",
        ampel: "kritisch",
        wert: m.ph.toString().replace(".", ","),
        soll,
        hinweis: "Unter 8,5 verliert die Emulsion ihren Schutz: Bakterien vermehren sich, Korrosion setzt ein. Ursache suchen (zu mager? Fremdöl? Standzeit erreicht?).",
      });
    } else if (min != null && max != null && (m.ph < min || m.ph > max)) {
      befunde.push({
        feld: "pH-Wert",
        ampel: "achtung",
        wert: m.ph.toString().replace(".", ","),
        soll,
        hinweis: m.ph < min
          ? "Unter dem Herstellerfenster — beobachten und Konzentration prüfen."
          : "Über dem Herstellerfenster — meist zu fett angesetzt oder frisch nachdosiert.",
      });
    } else if (min == null || max == null) {
      befunde.push({
        feld: "pH-Wert",
        ampel: "gut",
        wert: m.ph.toString().replace(".", ","),
        soll: null,
        hinweis: "Für dieses Produkt ist kein pH-Fenster hinterlegt; der Wert liegt aber über der kritischen Grenze von 8,5.",
      });
    } else {
      befunde.push({ feld: "pH-Wert", ampel: "gut", wert: m.ph.toString().replace(".", ","), soll, hinweis: null });
    }
  }

  // ---- Nitrit (TRGS 611) ----
  if (m.nitritePpm != null) {
    if (m.nitritePpm > 20) {
      befunde.push({
        feld: "Nitrit",
        ampel: "kritisch",
        wert: fmt(m.nitritePpm, "mg/l"),
        soll: "max. 20 mg/l",
        hinweis: "Über dem Grenzwert der TRGS 611. Zusammen mit Aminen können krebserzeugende Nitrosamine entstehen — Emulsion wechseln und Ursache klären.",
      });
    } else if (m.nitritePpm > 10) {
      befunde.push({
        feld: "Nitrit",
        ampel: "achtung",
        wert: fmt(m.nitritePpm, "mg/l"),
        soll: "max. 20 mg/l",
        hinweis: "Steigend — häufiger messen; der Grenzwert der TRGS 611 liegt bei 20 mg/l.",
      });
    } else {
      befunde.push({ feld: "Nitrit", ampel: "gut", wert: fmt(m.nitritePpm, "mg/l"), soll: "max. 20 mg/l", hinweis: null });
    }
  }

  // ---- Keimzahl ----
  if (m.bacteria) {
    const text: Record<string, string> = {
      NONE: "nicht nachweisbar",
      LOW: "gering",
      MEDIUM: "deutlich",
      HIGH: "stark",
    };
    const ampel: Ampel = m.bacteria === "HIGH" ? "kritisch" : m.bacteria === "MEDIUM" ? "achtung" : "gut";
    befunde.push({
      feld: "Keimzahl",
      ampel,
      wert: text[m.bacteria],
      soll: null,
      hinweis:
        m.bacteria === "HIGH"
          ? "Starker Befall — meist verbunden mit Geruch am Montag. Systemreiniger und Wechsel einplanen."
          : m.bacteria === "MEDIUM"
            ? "Deutlicher Befall — Konzentration und pH prüfen, beides hält Keime in Schach."
            : null,
    });
  }

  return befunde;
}

/**
 * Echte Standzeit: Wochen zwischen Ansetzen und heute (bzw. Wechsel). Die Zahl,
 * die in keinem Herstellerdatenblatt steht.
 */
export function standzeitWochen(filledAt: Date | null, bis: Date = new Date()): number | null {
  if (!filledAt) return null;
  const tage = (bis.getTime() - filledAt.getTime()) / 86_400_000;
  if (tage < 0) return null;
  return Math.floor(tage / 7);
}
