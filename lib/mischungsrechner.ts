/**
 * Mischungsrechner für wassermischbare Kühlschmierstoffe.
 *
 * Warum: Die häufigste Frage in der Werkstatt ist nicht „wie viel Prozent habe
 * ich?", sondern „was muss ich jetzt reinkippen?". Wer das falsch rechnet,
 * fährt den Tank zu mager (Korrosion, Keime) oder zu fett (Hautreizungen,
 * Rückstände, unnötige Kosten).
 *
 * Vorbild ist der Mischungsrechner auf brisco.ch (Solutions → Mixing
 * Calculator): Tankvolumen, Sollkonzentration, Fehlvolumen und gemessene
 * Ist-Konzentration hinein — Wasser- und Konzentratmenge heraus.
 *
 * Die Rechnung:
 *   Im Tank stecken aktuell   V_ist × c_ist   Liter Konzentrat.
 *   Nach dem Auffüllen soll   V_gesamt × c_soll   Liter Konzentrat drin sein.
 *   Die Differenz ist die Menge Konzentrat, die ins Fehlvolumen muss;
 *   der Rest des Fehlvolumens ist Wasser.
 *
 * Sonderfall: Ist der Tank so stark abgemagert, dass selbst reines Konzentrat
 * im Fehlvolumen die Sollkonzentration nicht mehr erreicht, sagt der Rechner
 * das ausdrücklich — dann hilft nur, mit angesetzter Emulsion statt mit Wasser
 * nachzufüllen (Praxisregel: 0,5 % über Soll ansetzen).
 */

export type MischungEingabe = {
  /** Gesamtes Fassungsvermögen des Tanks in Litern. */
  tankVolumenL: number;
  /** Gewünschte Konzentration in % (aus dem Herstellerdatenblatt). */
  sollProzent: number;
  /** Wie viele Liter fehlen bis zum vollen Tank. */
  fehlVolumenL: number;
  /** Gemessene Ist-Konzentration in % (Brix × Refraktometer-Faktor). */
  istProzent: number;
};

export type MischungErgebnis =
  | {
      ok: true;
      /** Liter Wasser, die ins Fehlvolumen gehören. */
      wasserL: number;
      /** Liter Konzentrat, die ins Fehlvolumen gehören. */
      konzentratL: number;
      /** Konzentration der Nachfüllmischung in % — für Dosiergeräte. */
      nachfuellProzent: number;
      /** Rechnerische Konzentration im Tank nach dem Auffüllen. */
      ergebnisProzent: number;
    }
  | {
      ok: false;
      /** Warum es nicht aufgeht — in Klartext. */
      grund: "zu_mager" | "zu_fett" | "eingabe";
      /** Empfohlene Ansetzkonzentration, wenn mit Emulsion statt Wasser aufgefüllt werden muss. */
      empfehlungProzent?: number;
      /** Konzentration, die mit reinem Konzentrat im Fehlvolumen maximal erreichbar wäre. */
      maximalProzent?: number;
    };

function runde(n: number, stellen = 1): number {
  const f = 10 ** stellen;
  return Math.round(n * f) / f;
}

export function berechneMischung(e: MischungEingabe): MischungErgebnis {
  const { tankVolumenL, sollProzent, fehlVolumenL, istProzent } = e;

  // Grobe Plausibilität — lieber gar nichts sagen als Unsinn rechnen.
  if (
    !(tankVolumenL > 0) ||
    !(fehlVolumenL > 0) ||
    fehlVolumenL > tankVolumenL ||
    !(sollProzent > 0) ||
    sollProzent > 30 ||
    istProzent < 0 ||
    istProzent > 30
  ) {
    return { ok: false, grund: "eingabe" };
  }

  const istVolumenL = tankVolumenL - fehlVolumenL;
  // Konzentrat, das jetzt im Tank steckt, und das nachher drin sein soll.
  const konzentratVorhandenL = (istVolumenL * istProzent) / 100;
  const konzentratZielL = (tankVolumenL * sollProzent) / 100;
  const konzentratNoetigL = konzentratZielL - konzentratVorhandenL;

  // Der Tank ist bereits fetter als das Ziel — reines Wasser genügt.
  if (konzentratNoetigL <= 0) {
    const ergebnis = (konzentratVorhandenL / tankVolumenL) * 100;
    return {
      ok: false,
      grund: "zu_fett",
      maximalProzent: runde(ergebnis, 2),
    };
  }

  // Selbst reines Konzentrat im Fehlvolumen reicht nicht mehr aus.
  if (konzentratNoetigL > fehlVolumenL) {
    const maximal = ((konzentratVorhandenL + fehlVolumenL) / tankVolumenL) * 100;
    return {
      ok: false,
      grund: "zu_mager",
      // Praxisregel: leicht über Soll ansetzen, damit man sich annähert.
      empfehlungProzent: runde(sollProzent + 0.5, 1),
      maximalProzent: runde(maximal, 2),
    };
  }

  const konzentratL = runde(konzentratNoetigL, 1);
  const wasserL = runde(fehlVolumenL - konzentratNoetigL, 1);
  const nachfuellProzent = runde((konzentratNoetigL / fehlVolumenL) * 100, 1);
  const ergebnisProzent = runde(
    ((konzentratVorhandenL + konzentratNoetigL) / tankVolumenL) * 100,
    2,
  );

  return { ok: true, wasserL, konzentratL, nachfuellProzent, ergebnisProzent };
}
