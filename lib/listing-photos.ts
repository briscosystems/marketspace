/**
 * Gemeinsame Vorgaben für Angebots-Fotos — eine Quelle für Oberfläche und
 * Server, damit die Grenzen nicht auseinanderlaufen.
 *
 * Die Zahl 12 orientiert sich an den Vergleichsplattformen (Etsy 10,
 * Facebook 10, mobile.de 15, Kleinanzeigen/Vinted 20, eBay 24) und daran, dass
 * bei Industrieware mehrere Pflichtmotive zusammenkommen: Gebinde, Etikett,
 * Chargenaufkleber, Verschluss, Palette.
 */
export const MAX_FOTOS = 12;

/** Lange Kante der Anzeigefassung (Detailseite). */
export const KANTE_GROSS = 1600;

/** Lange Kante der Vorschau (Trefferlisten, Auswahlbilder). */
export const KANTE_KLEIN = 400;

/**
 * Motive, die Käufer bei Industrieware sehen wollen. Alibaba-Käufer fordern
 * Lager- und Anlagenfotos aktiv an; die Weigerung gilt dort als Warnzeichen.
 */
export const MOTIV_VORSCHLAEGE = [
  "Gebinde von vorne",
  "Etikett lesbar",
  "Chargen-/Herstelldatum",
  "Verschluss/Spund",
  "Palette im Lager",
] as const;
