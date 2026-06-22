// Auto-Capture: bei einer abgeschlossenen Marketplace-Transaktion legt diese
// Funktion eine PriceObservation (source=TRANSACTION, status=VERIFIED) an.
//
// Aufruf-Beispiel im Transaction-Status-Update:
//   if (newStatus === "COMPLETED") await capturePriceFromTransaction(txId);
//
// Idempotent über transactionId — Doppel-Erfassung ausgeschlossen.

import { prisma } from "@/lib/prisma";

export async function capturePriceFromTransaction(transactionId: string): Promise<{
  captured: boolean;
  reason?: string;
}> {
  // Existiert bereits eine Beobachtung für diese Tx?
  const existing = await prisma.priceObservation.findFirst({
    where: { transactionId },
  });
  if (existing) return { captured: false, reason: "Bereits erfasst" };

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      listing: {
        select: {
          productName: true,
          manufacturer: true,
          quantityUnit: true,
          packaging: true,
          locationRegion: true,
        },
      },
    },
  });
  if (!tx || tx.status !== "COMPLETED") {
    return { captured: false, reason: "Transaktion nicht abgeschlossen" };
  }
  if (!tx.listing) return { captured: false, reason: "Listing nicht verfügbar" };
  if (!tx.quantity || tx.quantity <= 0) return { captured: false, reason: "Keine Menge" };

  // Versuche Product zu matchen (Listing → Product via manufacturer+name)
  const product = await prisma.product.findFirst({
    where: {
      manufacturer: {
        name: { equals: tx.listing.manufacturer, mode: "insensitive" },
      },
      name: { equals: tx.listing.productName, mode: "insensitive" },
    },
  });
  if (!product) return { captured: false, reason: "Produkt nicht im Katalog" };

  // EUR / Mengeneinheit berechnen
  const unitKey = tx.quantityUnit?.toUpperCase() ?? "L";
  const unit = unitKey === "KG" ? "EUR_PER_KG" : unitKey === "STK" || unitKey === "PIECE" ? "EUR_PER_PIECE" : "EUR_PER_L";
  const pricePerUnit = tx.totalEur / tx.quantity;

  await prisma.priceObservation.create({
    data: {
      productId: product.id,
      observedAt: tx.completedAt ?? new Date(),
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      unit,
      quantityMin: tx.quantity,
      quantityMax: tx.quantity,
      packagingForm: tx.listing.packaging,
      regionCode: tx.listing.locationRegion?.slice(0, 2)?.toUpperCase() ?? null,
      source: "TRANSACTION",
      status: "VERIFIED", // automatisch verifiziert — Transaktion ist Beleg
      verifiedAt: new Date(),
      transactionId: tx.id,
      sourceLabel: `Marketplace-Transaktion ${tx.id.slice(-8)}`,
    },
  });

  return { captured: true };
}
