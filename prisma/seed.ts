import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  const alpha = await prisma.user.upsert({
    where: { email: "alpha@example.com" },
    update: { trustTier: "VERIFIED" },
    create: {
      email: "alpha@example.com",
      passwordHash,
      pseudonym: "Alpha-Trader",
      role: "RESELLER",
      trustTier: "VERIFIED",
      companyName: "Alpha Lubricants GmbH",
      vatId: "DE111111111",
      country: "DE",
    },
  });

  const beta = await prisma.user.upsert({
    where: { email: "beta@example.com" },
    update: { trustTier: "TRADE_ASSURED" },
    create: {
      email: "beta@example.com",
      passwordHash,
      pseudonym: "Beta-Trader",
      role: "RESELLER",
      trustTier: "TRADE_ASSURED",
      companyName: "Beta Industrieöle KG",
      vatId: "ATU22222222",
      country: "AT",
    },
  });

  await prisma.listing.deleteMany({
    where: { seller: { email: { in: ["alpha@example.com", "beta@example.com"] } } },
  });

  await prisma.listing.create({
    data: {
      sellerId: alpha.id,
      productType: "Hydrauliköl",
      manufacturer: "Shell",
      productName: "Tellus S2 M 46",
      isoViscosity: "46",
      chemistry: "MINERAL",
      applicationArea: "Hydraulik (industriell, stationär)",
      quantity: 5000,
      quantityUnit: "L",
      minOrderQty: 200,
      locationRegion: "DE-BW",
      packaging: "DRUM",
      certificates: ["DIN 51524-2 HLP", "ISO 11158 HM", "Bosch Rexroth RDE 90220-1"],
      priceEur: 3.4,
      shippingTerms: "Selbstabholung oder Lieferung (verhandelbar)",
      description:
        "Restbestand aus Großgebinde. Fässer original verschlossen, Charge 2025-Q4.",
      productionDate: new Date("2025-11-01"),
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: alpha.id,
      productType: "Kühlschmierstoff (KSS-Emulsion)",
      manufacturer: "Fuchs",
      productName: "Renolin MR 520",
      isoViscosity: "46",
      chemistry: "MINERAL",
      applicationArea: "Hydraulik / Gleitbahn-Mischanwendung",
      quantity: 12,
      quantityUnit: "IBC",
      minOrderQty: 1,
      locationRegion: "DE-NW",
      packaging: "IBC",
      certificates: ["DIN 51517-3 CLP", "Cincinnati Lamb P-68"],
      priceEur: 2.95,
      shippingTerms: "Lieferung innerhalb DACH",
      description:
        "Überbestand nach Projektabbruch. IBC mit Plombe, Lagerung trocken/temperiert.",
      productionDate: new Date("2025-09-15"),
    },
  });

  const mobilListing = await prisma.listing.create({
    data: {
      sellerId: beta.id,
      productType: "Hydrauliköl",
      manufacturer: "Mobil",
      productName: "DTE 25 Ultra",
      isoViscosity: "46",
      chemistry: "SEMI_SYNTHETIC",
      applicationArea: "Hochleistungs-Hydraulik, Servoventile",
      quantity: 2400,
      quantityUnit: "L",
      minOrderQty: 200,
      locationRegion: "AT-OÖ",
      packaging: "DRUM",
      certificates: ["DIN 51524-2 HLP", "ISO 11158 HM", "Eaton E-FDGN-TB002-E"],
      shippingTerms: "Selbstabholung Linz",
      description:
        "Neuware, OEM-Originalgebinde 208 L Fässer. Charge auf Anfrage.",
      productionDate: new Date("2026-02-10"),
    },
  });

  // Beispiel-Konversation: Alpha fragt bei Beta nach dem Mobil-Hydrauliköl
  await prisma.conversation.deleteMany({
    where: {
      OR: [
        { buyerId: alpha.id, sellerId: beta.id },
        { buyerId: beta.id, sellerId: alpha.id },
      ],
    },
  });
  const convo = await prisma.conversation.create({
    data: { buyerId: alpha.id, sellerId: beta.id, listingId: mobilListing.id },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo.id,
        senderId: alpha.id,
        body: "Hallo, wäre eine Teilmenge von 800 L aus deinem DTE-25-Bestand möglich?",
      },
      {
        conversationId: convo.id,
        senderId: beta.id,
        body: "Servus, 800 L gehen in 4 × 208 L Fässern. Selbstabholung Linz, Preis wie im Listing.",
      },
    ],
  });

  // Sauberes Reset für RFQs + Transactions/Reviews zwischen Alpha/Beta
  await prisma.review.deleteMany({
    where: { OR: [{ reviewerId: { in: [alpha.id, beta.id] } }, { revieweeId: { in: [alpha.id, beta.id] } }] },
  });
  await prisma.transaction.deleteMany({
    where: { OR: [{ buyerId: { in: [alpha.id, beta.id] } }, { sellerId: { in: [alpha.id, beta.id] } }] },
  });
  await prisma.rfq.deleteMany({ where: { buyerId: { in: [alpha.id, beta.id] } } });

  // Aktive RFQ: Beta sucht KSS
  await prisma.rfq.create({
    data: {
      buyerId: beta.id,
      productType: "Kühlschmierstoff (KSS-Emulsion)",
      isoViscosity: "46",
      chemistry: "SEMI_SYNTHETIC",
      applicationArea: "CNC-Schleifen / Wire-Drawing",
      quantity: 4000,
      quantityUnit: "L",
      locationRegion: "AT-OÖ",
      deadline: new Date(Date.now() + 14 * 86400000),
      budgetMinEur: 2.5,
      budgetMaxEur: 3.5,
      notes:
        "Suche kurzfristig 4 000 L KSS für Schleifanwendung. DIN 51385 SEW oder gleichwertig. Alternative Marken willkommen, wenn TRGS-611-konform.",
      visibility: "PUBLIC",
    },
  });

  // Abgeschlossene Beispiel-Transaktion mit beidseitigen Reviews
  const tx = await prisma.transaction.create({
    data: {
      buyerId: alpha.id,
      sellerId: beta.id,
      totalEur: 6800,
      quantity: 2000,
      quantityUnit: "L",
      status: "COMPLETED",
      shippedAt: new Date(Date.now() - 6 * 86400000),
      completedAt: new Date(Date.now() - 1 * 86400000),
    },
  });
  await prisma.review.create({
    data: {
      transactionId: tx.id,
      reviewerId: alpha.id,
      revieweeId: beta.id,
      rating: 5,
      comment: "Schnelle Lieferung, Charge wie beschrieben, alles passte.",
      tags: ["ON_TIME_DELIVERY", "QUALITY_AS_DESCRIBED"],
    },
  });
  await prisma.review.create({
    data: {
      transactionId: tx.id,
      reviewerId: beta.id,
      revieweeId: alpha.id,
      rating: 5,
      comment: "Korrekte Abnahme, faire Verhandlung.",
      tags: ["FAIR_NEGOTIATION", "FAST_RESPONSE"],
    },
  });

  const totals = await prisma.listing.count();
  const rfqTotals = await prisma.rfq.count();
  const txTotals = await prisma.transaction.count();
  console.log(`✓ Seed fertig. Listings: ${totals}, RFQs: ${rfqTotals}, Transaktionen: ${txTotals}`);
  console.log("  Test-Accounts:");
  console.log("    alpha@example.com / test1234   (Alpha-Trader)");
  console.log("    beta@example.com  / test1234   (Beta-Trader)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
