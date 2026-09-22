/**
 * Einfache Drossel für die Geräte-Schnittstelle (Betreiber 2026-09-22).
 *
 * Warum überhaupt: Die Typ-Erkennung lädt im ungünstigsten Fall den halben
 * Katalog, um Tippfehler zu verzeihen. Ein Gerät mit fehlerhafter Firmware,
 * das im Sekundentakt fragt, würde sonst die Datenbank belasten — ohne böse
 * Absicht. Die Drossel begrenzt das je Schlüssel.
 *
 * Bewusst im Arbeitsspeicher gehalten, nicht in der Datenbank:
 *  - Ein Mischer fragt ein paar Mal am Tag, nicht ein paar Mal pro Sekunde.
 *    Das Limit ist Schutz vor Fehlern, nicht vor Angreifern.
 *  - Ein Zähler in der Datenbank würde bei jedem Aufruf schreiben — das wäre
 *    teurer als der Aufruf, den er schützt.
 *
 * Grenze der Ehrlichkeit: Läuft die Seite auf mehreren Instanzen, zählt jede
 * für sich. Das tatsächliche Limit ist dann Instanzen × Grenze. Für den Zweck
 * reicht das; wer es scharf braucht, muss auf Redis umstellen.
 */

/** Erlaubte Aufrufe je Schlüssel und Zeitfenster. */
const GRENZE = 60;
/** Länge des Zeitfensters in Millisekunden. */
const FENSTER_MS = 60_000;

type Eintrag = { zaehler: number; bis: number };
const zaehler = new Map<string, Eintrag>();

export type DrosselErgebnis = {
  erlaubt: boolean;
  /** Wie viele Aufrufe im laufenden Fenster noch offen sind. */
  verbleibend: number;
  /** Sekunden bis zum nächsten Fenster — für den Header `Retry-After`. */
  wartenSekunden: number;
};

export function drossel(schluesselId: string): DrosselErgebnis {
  const jetzt = Date.now();
  const alt = zaehler.get(schluesselId);

  if (!alt || alt.bis <= jetzt) {
    zaehler.set(schluesselId, { zaehler: 1, bis: jetzt + FENSTER_MS });
    aufraeumen(jetzt);
    return { erlaubt: true, verbleibend: GRENZE - 1, wartenSekunden: 0 };
  }

  alt.zaehler += 1;
  const wartenSekunden = Math.ceil((alt.bis - jetzt) / 1000);
  if (alt.zaehler > GRENZE) {
    return { erlaubt: false, verbleibend: 0, wartenSekunden };
  }
  return { erlaubt: true, verbleibend: GRENZE - alt.zaehler, wartenSekunden };
}

/** Abgelaufene Einträge wegräumen, damit die Map nicht unbegrenzt wächst. */
function aufraeumen(jetzt: number) {
  if (zaehler.size < 500) return;
  for (const [id, e] of zaehler) if (e.bis <= jetzt) zaehler.delete(id);
}

export { GRENZE as DROSSEL_GRENZE, FENSTER_MS as DROSSEL_FENSTER_MS };
