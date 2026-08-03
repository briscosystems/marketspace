/**
 * Lagerregionen für Angebote und Anfragen.
 *
 * Vorher standen hier neun deutsche Bundesländer einzeln, während Schweiz und
 * Österreich nur als ganzes Land wählbar waren — und der Platzhalter lautete
 * „DE-BW". Das las sich, als sei die Plattform auf Deutschland beschränkt.
 * Brisco sitzt in der Schweiz, der Markt ist DACH und Europa.
 *
 * Reihenfolge: Schweiz, Österreich, Deutschland, dann übriges Europa.
 * Der angezeigte Text IST der gespeicherte Wert — deshalb Kürzel plus Name,
 * damit man sowohl „ZH" als auch „Zürich" tippen kann und die Karte trotzdem
 * kurz bleibt.
 */

const CH = [
  "CH-ZH (Zürich)", "CH-BE (Bern)", "CH-LU (Luzern)", "CH-UR (Uri)", "CH-SZ (Schwyz)",
  "CH-OW (Obwalden)", "CH-NW (Nidwalden)", "CH-GL (Glarus)", "CH-ZG (Zug)",
  "CH-FR (Freiburg)", "CH-SO (Solothurn)", "CH-BS (Basel-Stadt)", "CH-BL (Basel-Landschaft)",
  "CH-SH (Schaffhausen)", "CH-AR (Appenzell A.Rh.)", "CH-AI (Appenzell I.Rh.)",
  "CH-SG (St. Gallen)", "CH-GR (Graubünden)", "CH-AG (Aargau)", "CH-TG (Thurgau)",
  "CH-TI (Tessin)", "CH-VD (Waadt)", "CH-VS (Wallis)", "CH-NE (Neuenburg)",
  "CH-GE (Genf)", "CH-JU (Jura)", "CH (ganze Schweiz)",
];

const AT = [
  "AT-W (Wien)", "AT-NÖ (Niederösterreich)", "AT-OÖ (Oberösterreich)",
  "AT-ST (Steiermark)", "AT-T (Tirol)", "AT-S (Salzburg)", "AT-K (Kärnten)",
  "AT-V (Vorarlberg)", "AT-B (Burgenland)", "AT (ganz Österreich)",
];

const DE = [
  "DE-BW (Baden-Württemberg)", "DE-BY (Bayern)", "DE-BE (Berlin)", "DE-BB (Brandenburg)",
  "DE-HB (Bremen)", "DE-HH (Hamburg)", "DE-HE (Hessen)", "DE-MV (Mecklenburg-Vorpommern)",
  "DE-NI (Niedersachsen)", "DE-NW (Nordrhein-Westfalen)", "DE-RP (Rheinland-Pfalz)",
  "DE-SL (Saarland)", "DE-SN (Sachsen)", "DE-ST (Sachsen-Anhalt)",
  "DE-SH (Schleswig-Holstein)", "DE-TH (Thüringen)", "DE (ganz Deutschland)",
];

const EUROPA = [
  "LI (Liechtenstein)", "FR (Frankreich)", "IT (Italien)", "NL (Niederlande)",
  "BE (Belgien)", "LU (Luxemburg)", "PL (Polen)", "CZ (Tschechien)", "SK (Slowakei)",
  "HU (Ungarn)", "SI (Slowenien)", "DK (Dänemark)", "SE (Schweden)", "NO (Norwegen)",
  "FI (Finnland)", "ES (Spanien)", "PT (Portugal)", "GB (Vereinigtes Königreich)",
  "IE (Irland)", "RO (Rumänien)", "BG (Bulgarien)", "HR (Kroatien)", "GR (Griechenland)",
  "EU (europaweit)",
];

export const REGION_OPTIONS: string[] = [...CH, ...AT, ...DE, ...EUROPA];

/** Platzhalter zeigt alle drei Kernländer — nicht nur Deutschland. */
export const REGION_PLACEHOLDER = "z. B. CH-ZH, AT-OÖ oder DE-BW";

/**
 * Alte Kurzwerte („DE-BW", „CH", „AT-OÖ") auf die neue Schreibweise bringen.
 * Liefert den Eingabewert unverändert zurück, wenn nichts passt — es soll
 * nichts verloren gehen, nur vereinheitlicht werden.
 */
export function normalisiereRegion(wert: string): string {
  const w = wert.trim();
  if (!w) return w;
  if (REGION_OPTIONS.includes(w)) return w;
  const treffer = REGION_OPTIONS.find((o) => o.split(" ")[0] === w);
  if (treffer) return treffer;
  if (w === "CH") return "CH (ganze Schweiz)";
  if (w === "AT") return "AT (ganz Österreich)";
  if (w === "DE" || w === "DE (ganz)") return "DE (ganz Deutschland)";
  if (w === "EU") return "EU (europaweit)";
  return w;
}
