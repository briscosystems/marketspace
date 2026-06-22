/**
 * Wissens-Layer Seed.
 *
 * Phase 1: allgemeine Werkstoff-KSS-Wechselwirkungen (scope = "general", productId = null).
 * Phase 2 (später): produkt-spezifische Notizen.
 *
 * Quellen siehe sourceLabel / sourceUrl pro Eintrag. Branchen-Standardwissen
 * aus VSI-Merkblättern, Hersteller-FAQs und Fachartikeln.
 *
 * Idempotent: löscht alle scope="general" Einträge und legt sie neu an.
 */
import { PrismaClient, MaterialCompatibility } from "@prisma/client";

const prisma = new PrismaClient();

type Note = {
  material: string;
  compatibility: MaterialCompatibility;
  condition?: string;
  note: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

const GENERAL_NOTES: Note[] = [
  // ---- ALUMINIUM ---------------------------------------------------------
  {
    material: "Aluminium",
    compatibility: "CAUTION",
    condition: "pH der Gebrauchsemulsion > 9.0",
    note:
      "Alkalische KSS können Aluminium anlaufen lassen (Aluminat-Bildung, Weißrost). " +
      "Empfehlung: KSS mit Gebrauchs-pH 8.5–9.0 wählen oder einen explizit Alu-freigegebenen KSS einsetzen.",
    sourceLabel: "VSI-Merkblatt KSS",
  },
  {
    material: "Aluminium",
    compatibility: "CAUTION",
    condition: "Chlor-haltige Additive",
    note:
      "Chlorhaltige EP-Additive können auf Aluminium Lochkorrosion auslösen. " +
      "Bei Alu-Bearbeitung chlorfreie Formulierungen bevorzugen.",
    sourceLabel: "Branchenstandard",
  },
  {
    material: "Aluminium",
    compatibility: "RECOMMENDED",
    note:
      "Bor- und chlorfreie, neutral-alkalische Formulierungen (semi-synthetisch oder synthetisch) " +
      "mit silikat-basierter Aluminium-Stabilisierung gelten als sicher. Beispiele: Oemeta HYCUT CF 21 + ADDITIV BF (Alu-optimiert).",
    sourceLabel: "Oemeta Produktdoku",
    sourceUrl: "https://www.oemeta.com/us/products-services/two-component-metalworking-fluid",
  },

  // ---- BUNTMETALL (Kupfer, Messing, Bronze) ------------------------------
  {
    material: "Buntmetall",
    compatibility: "CAUTION",
    condition: "pH der Gebrauchsemulsion > 9.0",
    note:
      "Amin-haltige KSS bei hohem pH greifen Kupfer-Legierungen an: Verfärbung (grünlich-bläulich) bis Lochkorrosion. " +
      "Tri-Ethanolamin-arme oder borfreie Formulierungen bevorzugen.",
    sourceLabel: "VSI-Merkblatt + Branchenstandard",
  },
  {
    material: "Buntmetall",
    compatibility: "CAUTION",
    condition: "Bor-haltige KSS",
    note:
      "Bor-Verbindungen können auf Kupfer/Messing Verfärbung verstärken. Bor-freie Formulierungen sind hier sicherer.",
    sourceLabel: "Branchenstandard",
  },

  // ---- MAGNESIUM ----------------------------------------------------------
  {
    material: "Magnesium",
    compatibility: "UNSUITABLE",
    condition: "wassermischbare KSS allgemein",
    note:
      "BRANDGEFAHR. Magnesium-Späne reagieren mit Wasser unter Freisetzung von Wasserstoff. " +
      "Für Magnesium-Zerspanung: ausschließlich nicht-wassermischbare Schneidöle oder " +
      "Spezial-KSS mit explizitem Mg-Freigabe (z.B. Oemeta HYCUT CF 21 + ADDITIV MG).",
    sourceLabel: "TRGS 611, Hersteller-Warnhinweis",
  },

  // ---- STAHL --------------------------------------------------------------
  {
    material: "Stahl",
    compatibility: "COMPATIBLE",
    note:
      "Universal verträglich mit nahezu allen KSS-Klassen. Bei bor-/biozidfreien Formulierungen " +
      "auf Mikrobenwachstum achten (regelmäßige Konzentrations- und pH-Kontrolle).",
  },
  {
    material: "Stahl",
    compatibility: "CAUTION",
    condition: "Konzentration < 3 %",
    note:
      "Bei zu niedriger Konzentration nicht ausreichender Korrosionsschutz — " +
      "Flugrost auf Werkstücken und Maschinenführungen.",
  },

  // ---- EDELSTAHL ----------------------------------------------------------
  {
    material: "Edelstahl",
    compatibility: "RECOMMENDED",
    condition: "höhere Konzentration 8–12 %",
    note:
      "Bei austenitischen Edelstählen für gute Werkzeugstandzeit erhöhte KSS-Konzentration (8–12 %) " +
      "oder EP-additivierte semi-synthetische / synthetische Formulierungen einsetzen.",
    sourceLabel: "Branchenstandard",
  },
  {
    material: "Edelstahl",
    compatibility: "RECOMMENDED",
    condition: "Tiefbohren / Räumen",
    note:
      "Für anspruchsvolle Operationen (Tiefbohren > 10×D, Räumen, Gewinden in CrNi) " +
      "Schneidöle mit chlor- oder schwefelhaltigen EP-Additiven verwenden.",
  },

  // ---- GRAUGUSS / GUSS ----------------------------------------------------
  {
    material: "Grauguss",
    compatibility: "COMPATIBLE",
    note:
      "Universal verträglich. Aufmerksamkeit auf Schwarzguss-Schlamm: Gusspartikel binden " +
      "im KSS Späne und Ölfraktion — regelmäßige Filterwartung notwendig.",
  },

  // ---- TITAN / INCONEL ----------------------------------------------------
  {
    material: "Titan",
    compatibility: "RECOMMENDED",
    condition: "Schneidöle bevorzugen",
    note:
      "Titan und Ni-Basislegierungen (Inconel, Hastelloy) erfordern hohe Schmierfähigkeit. " +
      "Schneidöle oder hochkonzentrierte (10–15 %) semi-synthetische KSS mit EP-Additivierung.",
    sourceLabel: "Branchenstandard",
  },

  // ---- HARTMETALL ---------------------------------------------------------
  {
    material: "Hartmetall",
    compatibility: "CAUTION",
    condition: "amin-aggressive KSS, pH > 9.5",
    note:
      "Cobalt-Auslaugung bei hohen pH-Werten — beschädigt die Bindephase im Hartmetall. " +
      "Cobalt-stabilisierte Formulierungen einsetzen (oft als 'Co-stable' deklariert).",
    sourceLabel: "Sandvik / Hartmetall-Hersteller-Empfehlung",
  },

  // ---- ANSETZWASSER -------------------------------------------------------
  {
    material: "Ansetzwasser (Allgemein)",
    compatibility: "CAUTION",
    condition: "Wasserhärte > 20 °dH",
    note:
      "Zu hartes Wasser bildet mit anionischen Emulgatoren Kalkseifen — " +
      "verstopft Filter, hinterlässt Beläge auf Werkstücken und in Spalten. " +
      "Ggf. Härte stabilisieren oder weicheres Wasser einsetzen.",
    sourceLabel: "Rhenus Lub Anwendungstechnik",
    sourceUrl: "https://www.rhenuslub.de/en/tap-water-why-the-water-quality-is-so-important-for-the-functionality-of-the-coolant/",
  },
  {
    material: "Ansetzwasser (Allgemein)",
    compatibility: "CAUTION",
    condition: "Wasserhärte < 5 °dH",
    note:
      "Zu weiches Wasser → Schaumneigung und reduzierte Standzeit. " +
      "Optimum laut Rhenus / Branchenkonsens: 5–20 °dH (5–10 °dH ideal).",
    sourceLabel: "Rhenus Lub Anwendungstechnik",
    sourceUrl: "https://www.rhenuslub.de/en/tap-water-why-the-water-quality-is-so-important-for-the-functionality-of-the-coolant/",
  },
  {
    material: "Ansetzwasser (Allgemein)",
    compatibility: "RECOMMENDED",
    note:
      "Für vollsynthetische Premium-KSS (z.B. Blaser Synergy 735) wird oft demineralisiertes " +
      "Wasser (<50 µS Leitfähigkeit) gefordert. Datenblatt prüfen.",
    sourceLabel: "Blaser Swisslube Produkt-Doku",
    sourceUrl: "https://www.lastuamisnesteet.fi/wp-content/uploads/2019/12/Synergy-735-Esite.pdf",
  },
];

async function main() {
  await prisma.materialCompatibilityNote.deleteMany({
    where: { scope: "general", productId: null },
  });
  let i = 0;
  for (const n of GENERAL_NOTES) {
    await prisma.materialCompatibilityNote.create({
      data: {
        scope: "general",
        material: n.material,
        compatibility: n.compatibility,
        condition: n.condition,
        note: n.note,
        sourceLabel: n.sourceLabel,
        sourceUrl: n.sourceUrl,
      },
    });
    i++;
  }
  const total = await prisma.materialCompatibilityNote.count();
  console.log(`Wissens-Seed: ${i} allgemeine Notizen angelegt. DB-Gesamt: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
