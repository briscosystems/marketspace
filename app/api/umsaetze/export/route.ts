// GET /api/umsaetze/export — alle eigenen Transaktionen (Käufe + Verkäufe)
// als CSV-Download. Beträge in EUR (Basis-Währung der Plattform).
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionProductLabel } from "@/lib/transaction-label";

function csvField(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Nicht angemeldet", { status: 401 });
  }
  const userId = session.user.id;

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { manufacturer: true, productName: true } },
      rfq: { select: { manufacturer: true, productType: true } },
      buyer: { select: { pseudonym: true } },
      seller: { select: { pseudonym: true } },
    },
  });

  const header = [
    "Datum", "Art", "Produkt", "Gegenseite", "Menge", "Einheit", "Betrag EUR",
    "Ersetztes Produkt", "Einsparung EUR", "Status",
  ];
  const lines = [header.join(";")];
  for (const tx of transactions) {
    const isSale = tx.sellerId === userId;
    const saving =
      !isSale && tx.replacedPricePerUnit != null
        ? tx.replacedPricePerUnit * tx.quantity - tx.totalEur
        : null;
    lines.push(
      [
        csvField(tx.createdAt.toISOString().slice(0, 10)),
        isSale ? "Verkauf" : "Kauf",
        csvField(transactionProductLabel(tx)),
        csvField(isSale ? tx.buyer.pseudonym : tx.seller.pseudonym),
        String(tx.quantity),
        csvField(tx.quantityUnit),
        tx.totalEur.toFixed(2),
        csvField(tx.replacedProductName ?? ""),
        saving != null ? saving.toFixed(2) : "",
        tx.status,
      ].join(";"),
    );
  }

  // BOM, damit Excel Umlaute korrekt anzeigt; Semikolon = deutsches CSV-Format
  const csv = "﻿" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="brisco-umsaetze-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
