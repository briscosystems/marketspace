// Seed historischer Demo-Preise — markiert als SEED_INDICATIVE (klar als
// Beispieldaten erkennbar in der UI). Generiert für die Top-Produkte je
// monatliche Datenpunkte über 60 Monate (5 Jahre) mit realistischem Drift.
//
// Realistische Basisspannen (Mai 2026, indikativ):
//   - KSS-Konzentrat:  6.50 - 14.00 EUR/L
//   - Schneidöl:       4.00 - 9.50 EUR/L
//   - Hydrauliköl:     3.20 - 7.50 EUR/L (Premium-Synth bis 12.00)
//   - Getriebeöl:      4.50 - 13.00 EUR/L
//   - Fette:           8.00 - 28.00 EUR/kg
//   - Motoröl:         5.00 - 11.00 EUR/L
//
// Drift-Modell: Basispreis ± 2% pro Monat Rauschen, mit langsamem
// Trend (10-30% Anstieg über 5 Jahre wegen Inflation/Rohstoffe).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PriceBand = { min: number; max: number; unit: "EUR_PER_L" | "EUR_PER_KG" };

const BANDS: Record<string, PriceBand> = {
  COOLANT_WATER_MIX:    { min: 6.50,  max: 14.00, unit: "EUR_PER_L" },
  COOLANT_NEAT:         { min: 4.00,  max: 9.50,  unit: "EUR_PER_L" },
  GRINDING_OIL:         { min: 5.00,  max: 11.00, unit: "EUR_PER_L" },
  HYDRAULIC_OIL:        { min: 3.20,  max: 7.50,  unit: "EUR_PER_L" },
  GEAR_OIL:             { min: 4.50,  max: 13.00, unit: "EUR_PER_L" },
  COMPRESSOR_OIL:       { min: 4.00,  max: 9.00,  unit: "EUR_PER_L" },
  SLIDEWAY_OIL:         { min: 5.00,  max: 9.50,  unit: "EUR_PER_L" },
  FORMING_OIL:          { min: 5.50,  max: 10.00, unit: "EUR_PER_L" },
  CLEANER:              { min: 3.00,  max: 7.50,  unit: "EUR_PER_L" },
  CORROSION_PROTECTION: { min: 4.50,  max: 12.00, unit: "EUR_PER_L" },
  GREASE:               { min: 8.00,  max: 28.00, unit: "EUR_PER_KG" },
  SPECIALTY:            { min: 5.00,  max: 18.00, unit: "EUR_PER_L" }, // Motor + Spezial
  EDM_FLUID:            { min: 6.00,  max: 14.00, unit: "EUR_PER_L" },
  ADDITIVE:             { min: 10.00, max: 35.00, unit: "EUR_PER_L" },
  OTHER:                { min: 4.00,  max: 10.00, unit: "EUR_PER_L" },
};

// Seedbares Random für Reproduzierbarkeit (Demodaten konsistent)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHistory(productSeed: number, band: PriceBand, months: number) {
  const rng = seededRandom(productSeed);
  // Basis-Preis: mittiger Bereich + random offset
  const basePrice = band.min + (band.max - band.min) * (0.3 + rng() * 0.4);
  // Trend über die ganze Periode (10-30% Anstieg über 60 Monate)
  const totalDrift = 0.10 + rng() * 0.20;

  const points: { observedAt: Date; price: number }[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (months - 1 - i));
    // Trend-Faktor: 1.0 am Start, 1+totalDrift am Ende
    const trendFactor = 1 + (totalDrift * i) / (months - 1);
    // Monatliche Schwankung ±3%
    const noise = 0.97 + rng() * 0.06;
    const price = basePrice * trendFactor * noise;
    points.push({
      observedAt: date,
      price: Math.round(price * 100) / 100,
    });
  }
  return points;
}

async function main() {
  // Lösche alte SEED_INDICATIVE-Beobachtungen (idempotent)
  const deleted = await prisma.priceObservation.deleteMany({ where: { source: "SEED_INDICATIVE" } });
  console.log(`Alte Seed-Beobachtungen gelöscht: ${deleted.count}`);

  // Wähle Top-Produkte nach Kategorie — Limit damit nicht 60'000 Datenpunkte
  const products = await prisma.product.findMany({
    where: {
      category: {
        in: [
          "COOLANT_WATER_MIX", "COOLANT_NEAT", "HYDRAULIC_OIL", "GEAR_OIL",
          "GREASE", "GRINDING_OIL", "COMPRESSOR_OIL", "SLIDEWAY_OIL",
          "FORMING_OIL", "EDM_FLUID", "SPECIALTY", "CLEANER",
          "CORROSION_PROTECTION", "OTHER",
        ],
      },
    },
    select: { id: true, name: true, category: true, manufacturerId: true },
    take: 200, // erste 200 Produkte
  });

  console.log(`Produkte ausgewählt: ${products.length}`);

  let totalObservations = 0;
  for (const p of products) {
    const band = BANDS[p.category] ?? BANDS.OTHER;
    // Seed pro Produkt aus dem ID-Hash für Reproduzierbarkeit
    const seed = parseInt(p.id.slice(-6), 36);
    // 60 Monate = 5 Jahre, aber je Produkt nur jeden 2. Monat (30 Punkte) — spart Daten
    const history = generateHistory(seed, band, 30);

    // Bulk-Insert
    await prisma.priceObservation.createMany({
      data: history.map((h) => ({
        productId: p.id,
        observedAt: h.observedAt,
        pricePerUnit: h.price,
        unit: band.unit,
        regionCode: "EU",
        source: "SEED_INDICATIVE",
        status: "VERIFIED",
        sourceLabel: "Indikative Marktwerte (Brisco Demo)",
        notes: "Modellierte Beispieldaten — Drift +10..30% über 5 Jahre, ±3% Monatsschwankung. Reale Preise via User-Submission oder Transaktions-Capture.",
      })),
    });
    totalObservations += history.length;
  }

  console.log(`\nFertig: ${totalObservations} Preis-Beobachtungen geseedet`);

  const total = await prisma.priceObservation.count();
  console.log(`DB-Stand: ${total} PriceObservations total`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
