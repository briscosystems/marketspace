/**
 * Lagerregion für Angebote und Anfragen — auf Länderebene.
 *
 * Warum nur das Land (Entscheidung 2026-08-03):
 * Kantone und Bundesländer waren ein schlechter Mittelweg. Für die Frachtkosten
 * sind sie zu ungenau (Baden-Württemberg ist 300 km breit), für die Bedienung
 * zu umständlich — und sie zwingen jeden Anbieter zu einer Entscheidung, die
 * kaum jemand filtert. Wenn Entfernung später wirklich zählt, ist der richtige
 * Weg Postleitzahl plus Umkreis (wie bei Kleinanzeigen und mobile.de), nicht
 * eine Verwaltungsebene dazwischen.
 *
 * Abgedeckt sind alle 27 EU-Staaten sowie Schweiz, Liechtenstein, Norwegen,
 * Vereinigtes Königreich und die übrigen europäischen Länder — die Liste kommt
 * aus lib/europe-countries.ts, damit Registrierung und Angebot dieselbe
 * Ländergrundlage benutzen.
 *
 * Reihenfolge: Schweiz, Österreich, Deutschland (Heimatmarkt), dann alphabetisch.
 */
import { EUROPE_COUNTRIES } from "@/lib/europe-countries";

const KERNMARKT = ["CH", "AT", "DE"];

function beschriftung(code: string, name: string): string {
  return `${code} (${name})`;
}

const nachCode = new Map(EUROPE_COUNTRIES.map((c) => [c.code, c.name]));

export const REGION_OPTIONS: string[] = [
  ...KERNMARKT.filter((c) => nachCode.has(c)).map((c) => beschriftung(c, nachCode.get(c)!)),
  ...EUROPE_COUNTRIES.filter((c) => !KERNMARKT.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((c) => beschriftung(c.code, c.name)),
  "EU (europaweit)",
];

/** Platzhalter nennt die drei Kernländer — nie nur eines. */
export const REGION_PLACEHOLDER = "Land wählen — z. B. CH, AT oder DE";

/**
 * Bringt gespeicherte Werte auf die Länder-Schreibweise.
 *
 * Deckt drei Fälle ab: die alten Kurzcodes („CH", „DE-BW"), die kurzzeitig
 * verwendeten Kantons-/Bundeslandeinträge („CH-ZH (Zürich)") und bereits
 * korrekte Werte. Unbekannte Freitexte bleiben unverändert — es soll nichts
 * verloren gehen, nur vereinheitlicht werden.
 */
export function normalisiereRegion(wert: string): string {
  const w = wert.trim();
  if (!w) return w;
  if (REGION_OPTIONS.includes(w)) return w;

  if (/^EU\b/i.test(w)) return "EU (europaweit)";

  // Erstes Wort ist der Code, ggf. mit Regionszusatz: „DE-BW" oder „CH-ZH (Zürich)".
  const code = w.split(/[\s(]/)[0].split("-")[0].toUpperCase();
  const name = nachCode.get(code);
  if (name) return beschriftung(code, name);
  return w;
}
