// Demo-Angebote im Stil des Konzept-Entwurfs — füllt /listings mit ~30 echten
// Produktnamen über saubere Kategorien + Anbieter mit Vertrauens-Stufen, damit
// die Vorschau so voll und strukturiert aussieht wie das Konzept-Bild.
//
// Aufruf (gegen die gewünschte DB):
//   DATABASE_URL='postgresql://…' npx tsx prisma/seed-demo-offers.ts
import { PrismaClient, ChemistryBase, PackagingForm, TrustTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CAT_LABEL: Record<string, string> = {
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  GREASE: "Fett",
  COOLANT_WATER_MIX: "Kühlschmierstoff (Emulsion, wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
  GRINDING_OIL: "Schleiföl",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bahnöl",
  FORMING_OIL: "Umformöl",
  CORROSION_PROTECTION: "Korrosionsschutz",
  SPECIALTY: "Spezialöl",
  EDM_FLUID: "Erodieröl",
};

const CAT_CHEM: Record<string, ChemistryBase> = {
  HYDRAULIC_OIL: "MINERAL",
  GEAR_OIL: "SYNTHETIC",
  GREASE: "MINERAL",
  COOLANT_WATER_MIX: "SEMI_SYNTHETIC",
  COOLANT_NEAT: "MINERAL",
  GRINDING_OIL: "MINERAL",
  COMPRESSOR_OIL: "SYNTHETIC",
  SLIDEWAY_OIL: "MINERAL",
  FORMING_OIL: "MINERAL",
  CORROSION_PROTECTION: "MINERAL",
  SPECIALTY: "SYNTHETIC",
  EDM_FLUID: "MINERAL",
};

const PRICE_BASE: Record<string, number> = {
  HYDRAULIC_OIL: 2.9, GEAR_OIL: 4.3, GREASE: 10.5, COOLANT_WATER_MIX: 5.2,
  COOLANT_NEAT: 6.1, GRINDING_OIL: 7.4, COMPRESSOR_OIL: 4.9, SLIDEWAY_OIL: 5.3,
  FORMING_OIL: 6.6, CORROSION_PROTECTION: 5.8, SPECIALTY: 9.2, EDM_FLUID: 8.4,
};

const RAW: [string, string, string, string][] = [
  ["Tellus S2 M 68", "Shell", "HYDRAULIC_OIL", "68"],
  ["Tellus S4 ME 46", "Shell", "HYDRAULIC_OIL", "46"],
  ["Agip OTE 22", "Eni", "HYDRAULIC_OIL", "22"],
  ["Energol HLP-D 100", "BP", "HYDRAULIC_OIL", "100"],
  ["Hyspin Spindle Oil 22", "Castrol", "HYDRAULIC_OIL", "22"],
  ["Arnica 100", "Eni", "HYDRAULIC_OIL", "100"],
  ["Omala S2 GX 460", "Shell", "GEAR_OIL", "460"],
  ["Klüberoil GEM 1-460 N", "Klüber Lubrication", "GEAR_OIL", "460"],
  ["Renolin Unisyn CLP 460", "Fuchs", "GEAR_OIL", "460"],
  ["Glygoyle 680", "Mobil", "GEAR_OIL", "680"],
  ["Engranajes HP 150", "Cepsa", "GEAR_OIL", "150"],
  ["Blasia S 680", "Eni", "GEAR_OIL", "680"],
  ["Energrease LS-EP 2", "BP", "GREASE", ""],
  ["Spheerol EPL 2", "Castrol", "GREASE", ""],
  ["Mobilith SHC 100", "Mobil", "GREASE", ""],
  ["Foodlube Universal 2", "ROCOL", "GREASE", ""],
  ["rhenus LAH 2", "Rhenus Lub", "GREASE", ""],
  ["Hycut ET 68", "Oemeta", "COOLANT_WATER_MIX", ""],
  ["Vulsol MSF 200", "TotalEnergies", "COOLANT_WATER_MIX", ""],
  ["Mobilmet 423", "Mobil", "COOLANT_NEAT", ""],
  ["HYCUT SE 12", "Oemeta", "GRINDING_OIL", ""],
  ["SintoGrind TC-X 630", "oelheld", "GRINDING_OIL", ""],
  ["Corena S2 P 68", "Shell", "COMPRESSOR_OIL", "68"],
  ["Dacnis 68", "TotalEnergies", "COMPRESSOR_OIL", "68"],
  ["Energol WM 68", "BP", "SLIDEWAY_OIL", "68"],
  ["Almo 525", "Mobil", "FORMING_OIL", ""],
  ["Beruform WCS 400", "Carl Bechem", "FORMING_OIL", ""],
  ["Rust-Veto 377", "Quaker Houghton", "CORROSION_PROTECTION", ""],
  ["Mobiltherm 605", "Mobil", "SPECIALTY", ""],
  ["Sarol Z", "oelheld", "EDM_FLUID", ""],
];

const SELLERS: { name: string; tier: TrustTier }[] = [
  { name: "LubTrade AG", tier: "TRADE_ASSURED" },
  { name: "ÖlDepot24", tier: "VERIFIED" },
  { name: "Nordöl Handel", tier: "PREMIUM" },
  { name: "Alpina Lubricants", tier: "VERIFIED" },
  { name: "Helvetia Öle GmbH", tier: "TRADE_ASSURED" },
  { name: "Rheinschmier", tier: "VERIFIED" },
  { name: "IndustrieÖl24", tier: "PREMIUM" },
  { name: "MRO Supply", tier: "UNVERIFIED" },
];

const REGIONS = [
  "Zürich, CH", "Basel, CH", "Bern, CH", "Aargau, CH",
  "Bayern, DE", "NRW, DE", "Wien, AT", "Lombardei, IT",
];

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const hash = await bcrypt.hash("demo-not-for-login", 10);

  // 1) Demo-Anbieter (Pseudonym + Vertrauens-Stufe) sicherstellen
  const sellerIds: string[] = [];
  for (const s of SELLERS) {
    const email = `demo-${slug(s.name)}@brisco.demo`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { trustTier: s.tier, pseudonym: s.name },
      create: {
        email,
        pseudonym: s.name,
        passwordHash: hash,
        role: "RESELLER",
        trustTier: s.tier,
      },
    });
    sellerIds.push(user.id);
  }

  // 2) Alte Demo-Angebote entfernen (idempotent), dann neu anlegen.
  //    Echte Angebote bleiben unangetastet (nur __demo-offer__ wird ersetzt).
  await prisma.listing.deleteMany({ where: { description: "__demo-offer__" } });

  let created = 0;
  for (let i = 0; i < RAW.length; i++) {
    const [name, brand, cat, iso] = RAW[i];
    const isGrease = cat === "GREASE";
    const unit = isGrease ? "kg" : "L";
    const priceNa = i % 11 === 4;
    const price = +(PRICE_BASE[cat] + ((i * 3) % 8) * 0.45).toFixed(2);
    const qtyOpts = isGrease ? [25, 50, 180] : [20, 208, 1000];
    const qty = qtyOpts[i % qtyOpts.length];
    const packaging: PackagingForm = isGrease
      ? "DRUM"
      : qty >= 1000
        ? "IBC"
        : qty >= 200
          ? "DRUM"
          : "CANISTER";
    const seller = sellerIds[i % sellerIds.length];
    const region = REGIONS[(i * 5) % REGIONS.length];
    const minOrder = isGrease ? qty : qty >= 1000 ? 200 : qty;

    await prisma.listing.create({
      data: {
        sellerId: seller,
        status: "ACTIVE",
        productType: CAT_LABEL[cat],
        manufacturer: brand,
        productName: name,
        isoViscosity: iso || null,
        chemistry: CAT_CHEM[cat],
        applicationArea: "",
        quantity: qty,
        quantityUnit: unit,
        minOrderQty: minOrder,
        locationRegion: region,
        packaging,
        priceEur: priceNa ? null : price,
        description: "__demo-offer__",
      },
    });
    created++;
  }

  const total = await prisma.listing.count({ where: { status: "ACTIVE" } });
  console.log(`✅ ${created} Demo-Angebote angelegt. Aktive Angebote gesamt: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
