/** Produktbezeichnung einer Transaktion aus Listing bzw. Anfrage ableiten. */
export function transactionProductLabel(tx: {
  listing: { manufacturer: string; productName: string } | null;
  rfq: { manufacturer: string | null; productType: string } | null;
}): string {
  if (tx.listing) return `${tx.listing.manufacturer} ${tx.listing.productName}`;
  if (tx.rfq) return [tx.rfq.manufacturer, tx.rfq.productType].filter(Boolean).join(" ");
  return "—";
}
