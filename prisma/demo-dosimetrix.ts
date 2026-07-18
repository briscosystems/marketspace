// Einmaliges Demo-Setup: Marken-Schaufenster am Beispiel DOSIMETRIX.
// Legt (idempotent) den Hersteller "Dosimetrix" an, ein Marke-Konto, das ihn
// vertritt (aktive MARKE-Stufe), und pflegt den Schaufenster-Text. Danach ist
// das verifizierte Schaufenster unter /manufacturers/dosimetrix sichtbar.
//   Ausführen:  npx tsx prisma/demo-dosimetrix.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1) Hersteller/Marke Dosimetrix
  const manufacturer = await prisma.manufacturer.upsert({
    where: { slug: "dosimetrix" },
    update: {},
    create: {
      name: "Dosimetrix",
      slug: "dosimetrix",
      website: "https://www.dosimetrix.ch",
      headquartersCountry: "CH",
      businessFocus: ["COOLANT"],
      productFamilies: ["eMix1500", "Fluid-Management-Software", "Sensorik"],
      knownForApplications: ["KSS-Management", "Automatisches Mischen & Dosieren", "Zerspanung"],
      description:
        "Hybrides Automatisierungssystem für das Kühlschmierstoff-Management — digitale Messtechnik, Fluid-Management-Software und der automatische Misch- und Dosierautomat eMix1500 in einem System. Von Brisco Systems und GIMAT Liquid Monitoring.",
    },
  });

  // 2) Marke-Konto, das Dosimetrix vertritt (aktive MARKE-Stufe, 1 Jahr)
  const passwordHash = await bcrypt.hash("test1234", 10);
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const rep = await prisma.user.upsert({
    where: { email: "dosimetrix@example.com" },
    update: {
      membershipTier: "MARKE",
      membershipValidUntil: validUntil,
      brandManufacturerId: manufacturer.id,
      storefrontHeadline: "Automatisches KSS-Management — bis zu 25 % weniger Verbrauch",
      about:
        "Dosimetrix verbindet digitale Messgeräte, moderne Fluid-Management-Software und den " +
        "automatischen Misch- und Dosierautomaten eMix1500 zu einem System. Füllstände in den " +
        "Maschinentanks werden in Echtzeit erfasst, Mischen und Dosieren laufen automatisch — " +
        "für mehr Prozessstabilität und eine wirtschaftliche Digitalisierung der Zerspanung. " +
        "Ein System von Brisco Systems und GIMAT Liquid Monitoring.",
    },
    create: {
      email: "dosimetrix@example.com",
      passwordHash,
      pseudonym: "Dosimetrix",
      role: "OEM",
      trustTier: "VERIFIED",
      companyName: "Brisco Systems",
      country: "CH",
      membershipTier: "MARKE",
      membershipValidUntil: validUntil,
      brandManufacturerId: manufacturer.id,
      storefrontHeadline: "Automatisches KSS-Management — bis zu 25 % weniger Verbrauch",
      about:
        "Dosimetrix verbindet digitale Messgeräte, moderne Fluid-Management-Software und den " +
        "automatischen Misch- und Dosierautomaten eMix1500 zu einem System. Füllstände in den " +
        "Maschinentanks werden in Echtzeit erfasst, Mischen und Dosieren laufen automatisch — " +
        "für mehr Prozessstabilität und eine wirtschaftliche Digitalisierung der Zerspanung. " +
        "Ein System von Brisco Systems und GIMAT Liquid Monitoring.",
    },
  });

  // 3) Erste Anzeige (Werbeplattform) — Dosimetrix-Banner, live auf Start + Schaufenster
  // Hinweis: Die Eyebrow-Zeile NICHT als Wortmarke „DOSIMETRIX® hybrid" setzen —
  // das offizielle Logo steckt bereits im Produktbild (korrekte Typografie).
  // Der generische Eyebrow-Stil (grau, GROSSBUCHSTABEN) würde die Marke sonst
  // falsch nachbilden. Stattdessen eine neutrale Positionierungszeile.
  const dosiEyebrow = "Automatisiertes KSS-Management";
  await prisma.adBanner.upsert({
    where: { id: "demo-dosimetrix-ad" },
    update: { eyebrow: dosiEyebrow },
    create: {
      id: "demo-dosimetrix-ad",
      ownerId: rep.id,
      manufacturerId: manufacturer.id,
      eyebrow: dosiEyebrow,
      headline: "Mehr Standzeit. Weniger Verbrauch.",
      chips: ["−25 % KSS-Verbrauch", "2–3× Standzeit", "Spänepressen-Schnittstelle"],
      image: "/images/BRISCO_Slidergrafiken_Dosimetrix0000.png",
      ctaLabel: "Mehr erfahren",
      ctaUrl: "https://www.dosimetrix.eu",
      origin: "Made in Switzerland",
      placements: ["HOME", "STOREFRONT", "LISTINGS"],
      active: true,
    },
  });

  console.log(`OK — Schaufenster: /manufacturers/${manufacturer.slug}`);
  console.log("Anzeige live auf Startseite + Schaufenster + Angebotsübersicht (Verwaltung: /werbung)");
  console.log("Login zum Bearbeiten: dosimetrix@example.com / test1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
