// Käuferschutz — zentrale Konstanten & Helfer.
//
// Wording-Vorgabe (Stripe-Support-Bestätigung): "Käuferschutz" /
// "Zahlungsfreigabe nach Lieferbestätigung" — niemals "Treuhand"/"Escrow".
// Geldfluss: separate charges & transfers, Auszahlung erst nach
// Lieferbestätigung des Käufers (Haltefrist immer < 90 Tage).

/**
 * Abwicklungsgebühr, die der Käufer trägt (deckt die Stripe-Gebühren; die
 * Plattform verdient daran nichts): 1,5 % + 0,25 €.
 */
export function protectionFeeEur(totalEur: number): number {
  return Math.round((totalEur * 0.015 + 0.25) * 100) / 100;
}

export const PROTECTION_STATUS_LABEL: Record<string, string> = {
  NONE: "ohne Käuferschutz",
  PENDING_PAYMENT: "Zahlung offen",
  HELD: "bezahlt — Geld sicher geparkt",
  RELEASED: "freigegeben an Verkäufer",
  REFUNDED: "an Käufer zurückerstattet",
  DISPUTED: "Problem gemeldet — in Prüfung",
};
