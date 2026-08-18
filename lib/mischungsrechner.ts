/**
 * Mischungsrechner für wassermischbare Kühlschmierstoffe.
 *
 * Warum: Die häufigste Frage in der Werkstatt ist nicht „wie viel Prozent habe
 * ich?", sondern „was muss ich jetzt reinkippen?". Wer das falsch rechnet,
 * fährt den Tank zu mager (Korrosion, Keime) oder zu fett (Hautreizungen,
 * Rückstände, unnötige Kosten).
 *
 * Vorbild ist der Mischungsrechner auf brisco.ch (Solutions → Mixing
 * Calculator): Tankvolumen, Fehlvolumen, Sollkonzentration und gemessene
 * Ist-Konzentration hinein — Wasser- und Konzentratmenge heraus.
 *
 * Die Rechnung:
 *   Im Tank stecken aktuell   V_ist × c_ist   Liter Konzentrat.
 *   Nach dem Auffüllen soll   V_gesamt × c_soll   Liter Konzentrat drin sein.
 *   Die Differenz ist die Menge Konzentrat, die ins Fehlvolumen muss;
 *   der Rest des Fehlvolumens ist Wasser.
 *
 * **Niemals mit reinem Wasser nachfüllen** (Betreiber 2026-08-18): Auch wenn
 * der Tank rechnerisch zu fett ist, wird mindestens mit MIN_NACHFUELL_PROZENT
 * angesetzt. Reines Wasser gilt in der Praxis als verpönt — es gibt keine gute
 * Mischung, fördert Korrosion an der Nachfüllstelle und verschiebt die
 * Additiv-Balance. Der Rechner sagt dann ehrlich, dass der Sollwert mit dieser
 * Nachfüllung nicht getroffen wird.
 *
 * Ebenso ehrlich am anderen Ende: Reicht selbst reines Konzentrat im
 * Fehlvolumen nicht aus, wird auf 100 % begrenzt und der erreichbare Wert
 * ausgewiesen — statt eine unmögliche Menge zu melden.
 */

/** Untergrenze für jede Nachfüllmischung in % — nie mit reinem Wasser. */
export const MIN_NACHFUELL_PROZENT = 0.5;

/** Ab dieser Nachfüllkonzentration wird gewarnt: sehr fett, besser in Schritten. */
export const FETTE_NACHFUELLUNG_PROZENT = 15;

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
      /** Trifft die Nachfüllung den Sollwert? */
      sollErreicht: boolean;
      /**
       * Wenn nicht: in welche Richtung und warum.
       *  - "ueber_soll": Tank ist bereits zu fett; die Mindest-Nachfüllung von
       *    0,5 % hält ihn über dem Sollwert (reines Wasser ist keine Option).
       *  - "unter_soll": Selbst reines Konzentrat im Fehlvolumen reicht nicht.
       */
      abweichung?: "ueber_soll" | "unter_soll";
      /** true, wenn die Nachfüllmischung ungewöhnlich fett ausfällt. */
      sehrFett: boolean;
    }
  | {
      ok: false;
      grund: "eingabe";
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

  // Rechnerisch nötige Nachfüllkonzentration …
  const roh = (konzentratNoetigL / fehlVolumenL) * 100;
  // … und was davon praktisch zulässig ist: nie unter 0,5 %, nie über 100 %.
  const nachfuellProzent = runde(Math.min(100, Math.max(MIN_NACHFUELL_PROZENT, roh)), 1);

  const konzentratL = runde((fehlVolumenL * nachfuellProzent) / 100, 1);
  const wasserL = runde(fehlVolumenL - (fehlVolumenL * nachfuellProzent) / 100, 1);
  const ergebnisProzent = runde(
    ((konzentratVorhandenL + (fehlVolumenL * nachfuellProzent) / 100) / tankVolumenL) * 100,
    2,
  );

  // Toleranz: unter 0,05 Prozentpunkten ist der Sollwert praktisch getroffen.
  const sollErreicht = Math.abs(ergebnisProzent - sollProzent) < 0.05;
  const abweichung = sollErreicht
    ? undefined
    : ergebnisProzent > sollProzent
      ? ("ueber_soll" as const)
      : ("unter_soll" as const);

  return {
    ok: true,
    wasserL,
    konzentratL,
    nachfuellProzent,
    ergebnisProzent,
    sollErreicht,
    abweichung,
    sehrFett: nachfuellProzent > FETTE_NACHFUELLUNG_PROZENT,
  };
}
