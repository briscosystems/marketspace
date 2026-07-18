/**
 * Datenqualitäts-Korrektur vom 2026-07-18 (Folge-Durchgang zum 15.07.)
 *
 * Der erste Durchgang (fix-datenqualitaet-2026-07-15.ts) hat Fantasieprodukte
 * gelöscht und zwei Viskositäten korrigiert. OFFEN geblieben waren die
 * inhaltlichen Korrekturen aus demselben belegten Prüfbericht (12 Recherche-
 * läufe): vertauschte Beschreibungen, falsche Kategorien/Chemie, falsche
 * Marken. Diese werden hier nachgezogen — jeder Eintrag mit Beleg.
 *
 * Quelle je Eintrag: die Einzelbefunde des Prüfdurchgangs (befund-*.md).
 *
 * Idempotent: setzt absolute Zielwerte. Mehrfaches Ausführen ist gefahrlos
 * (die Werte werden nur erneut gesetzt, nie hochgezählt).
 *
 * Aufruf:  npx tsx prisma/fix-datenqualitaet-2026-07-18.ts [--dry]
 */
import { prisma } from "@/lib/prisma";
import { buildSearchTokens } from "@/lib/normalize-search";

const DRY = process.argv.includes("--dry");

// Produkte, deren Name oder Hersteller sich geändert hat → searchTokens neu bauen,
// damit die Suche (z.B. „renolin clp vci“, „quaker macron“, „castrol tribol“) trifft.
const RETOKENIZE_IDS = [
  "cmphf8snn003pllefv84a7ut1", // Renolin CLP 320 VCI
  "cmphf8snr003rllef17ys1mbe", // Renolin CLP 460 VCI
  "cmphf8sji001lllefsnjz33ev", // Macron EDM 110 → Quaker Houghton
  "cmphew9cv0013llctrqzkpedc", // Tribol GR 1350 → Castrol
  "cmphew9d10015llctbiokzm6f", // Tribol GR 3020 → Castrol
  "cmphf8sth0067llefr3o06awn", // Tribol FoodProof → Castrol
];

// Hersteller-IDs (für Marken-Umhängungen)
const MFR_QUAKER_HOUGHTON = "cmphew8cp000allap3jvgumyf";
const MFR_CASTROL = "cmpclx4un0007llvjy9gvxa20";

type Patch = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  grund: string;
};

export const CORRECTIONS_2026_07_18: Patch[] = [
  // ============ CASTROL ============
  // Vertauschte Zink-Beschreibungen: HLP-Z ("Z"=Zink) ist zinkHALTIG, ZZ ist zinkFREI.
  // In der DB standen die Beschreibungen genau andersherum. (befund-castrol.md)
  ...["cmphf4nd8006fllqfznohw3iv", "cmpheuxdh0069ll1w1nptepd1", "cmphf4ndg006hllqfyks69ptm"].map(
    (id) => ({
      id,
      name: "Castrol Hyspin HLP-Z (zinkhaltig)",
      data: {
        chemistry: "MINERAL",
        description:
          "Zinkhaltiges (HLP) Hydrauliköl mit ZnDTP-Verschleißschutz für Standard-Industrieanwendungen.",
      },
      grund:
        "„Z“ steht für Zink → HLP-Z ist zinkHALTIG. DB-Beschreibung sagte fälschlich „zinkfrei“ (mit ZZ vertauscht).",
    }),
  ),
  {
    id: "cmpheuxmd00a7ll1wb0s6hlur",
    name: "Castrol Hyspin HLP-Z 46 (v2)",
    data: {
      chemistry: "MINERAL",
      description:
        "Zinkhaltiges (HLP) Hydrauliköl mit ZnDTP-Verschleißschutz für Standard-Industrieanwendungen.",
    },
    grund: "Leere Dublette der HLP-Z-46; korrekte (zinkhaltige) Beschreibung gesetzt.",
  },
  ...["cmphf4ndq006lllqfsoih13hq", "cmphf4ndu006nllqfvg9c3gyn", "cmpheuxdl006bll1wm21smfoz"].map(
    (id) => ({
      id,
      name: "Castrol Hyspin ZZ (zinkfrei)",
      data: {
        chemistry: "MINERAL",
        description: "Zinkfreies (aschefreies) Hydrauliköl für umweltsensible Anwendungen.",
      },
      grund: "Hyspin ZZ ist zinkFREI/aschefrei. DB-Beschreibung sagte fälschlich „zinkhaltig“.",
    }),
  ),
  ...["cmphf8sld002hllefgknnwo57", "cmphf8slh002jllefs544uwft", "cmphf8slk002lllefiuauoak4", "cmphf8slo002nllefir6nbga4"].map(
    (id) => ({
      id,
      name: "Castrol Optigear BM",
      data: { chemistry: "MINERAL" },
      grund: "DIN 51517-3 CLP (nicht CLP HC) → mineralisches Grundöl, nicht synthetisch.",
    }),
  ),
  {
    id: "cmpheuwyt0009ll1wkc68k9qi",
    name: "Castrol Variocut B 30",
    data: { category: "COOLANT_NEAT" },
    grund: "PDS: „Nichtwassermischbar“ — war fälschlich als wassermischbarer KSS geführt.",
  },
  {
    id: "cmpheux9t004nll1w67tojw1r",
    name: "Castrol Variocut G 101",
    data: { category: "COOLANT_NEAT" },
    grund: "Nichtwassermischbares Schleif-/Honöl — war fälschlich als wassermischbarer KSS geführt.",
  },
  {
    id: "cmpcro1jq001vllltlr5riim0",
    name: "Castrol Hysol XF",
    data: { chemistry: "SEMI_SYNTHETIC" },
    grund: "Semi-synthetischer KSS, war als MINERAL geführt.",
  },
  {
    id: "cmphf8skh0021llef92efu8yn",
    name: "Castrol Iloform PS 305",
    data: { chemistry: "SYNTHETIC" },
    grund: "Synthetische Formulierung, war als MINERAL geführt.",
  },

  // ============ MOBIL ============
  // Vactra (Bettbahnöl) ↔ Velocite (Spindelöl) waren kategorial vertauscht. (befund-mobil.md)
  ...["cmpheuxit008jll1wp0znek49", "cmpheuxiy008lll1w79rxeuqt", "cmpheuxj3008nll1wftcwe1c9", "cmpheuxj6008pll1whbsv2ntd"].map(
    (id) => ({
      id,
      name: "Mobil Vactra No 1–4",
      data: { category: "SLIDEWAY_OIL" },
      grund: "PDS: „Premium Machine Tools Slideway Lubricants“ (DIN 51502 CGLP) — Bettbahnöl, kein Schneidöl.",
    }),
  ),
  ...["cmphf8sfd0001llefpuo8vrsx", "cmphf8sfk0003llef6hlnw6nq", "cmphf8sfp0005llefzia1ox7m"].map(
    (id) => ({
      id,
      name: "Mobil Velocite No 3/6/10",
      data: {
        category: "HYDRAULIC_OIL",
        description: "Spindelöl (Spindle & Hydraulic Oil) für hochtourige Spindeln — kein Bettbahnöl.",
      },
      grund: "PDS: „Spindle and Hydraulic Oils“ — war fälschlich als Bettbahnöl geführt.",
    }),
  ),
  ...["cmphf8sgn000dllefhh3h28nj", "cmphf8sgs000fllef01sqiafl", "cmphf8sgx000hllef5x5c8quq"].map(
    (id) => ({
      id,
      name: "Mobil Almo 525/527/529",
      data: { category: "SPECIALTY" },
      grund: "PDS: „Premium Pneumatic Tool Lubricants“ (Druckluft-Werkzeuge) — kein Umformöl.",
    }),
  ),
  {
    id: "cmphf8shv000tllef2d9a3rcv",
    name: "Mobil Mobilcut 320",
    data: { chemistry: "SYNTHETIC" },
    grund: "„Synthetic, mineral oil-free“ — war als SEMI_SYNTHETIC geführt.",
  },
  {
    id: "cmphf8shg000nllefj31w1al0",
    name: "Mobil Mobilcut 140",
    data: { chemistry: "MINERAL" },
    grund: "Löslicher Emulsionstyp (Mineralöl) — war als SEMI_SYNTHETIC geführt.",
  },

  // ============ TOTALENERGIES ============
  {
    id: "cmphf8ss3005pllefet6j9lpu",
    name: "TotalEnergies Caloris MS 23",
    data: {
      category: "GREASE",
      description:
        "Bentonit-Hochtemperaturfett mit MoS₂, NLGI 2/3 — für hohe Temperaturen und langsame Bewegungen (kein Wärmeträgeröl).",
    },
    grund: "Ist ein Bentonit-Fett („23“ = NLGI 2/3), war als „Wärmeträgeröl“ (SPECIALTY) geführt.",
  },
  {
    id: "cmpheuxl1009nll1wlzm8epte",
    name: "TotalEnergies Caloris 23",
    data: {
      description:
        "Bentonit-Hochtemperaturfett NLGI 2/3 — für hohe Temperaturen und langsame Bewegungen (kein Wärmeträgeröl).",
    },
    grund: "Kategorie GREASE war korrekt, aber Beschreibung „Wärmeträgeröl“ falsch.",
  },
  {
    id: "cmphf8sr40059llefquw2bgqi",
    name: "TotalEnergies Lactuca MS 7000",
    data: {
      category: "COOLANT_WATER_MIX",
      description: "Chlorfreie Makro-Emulsion (wassermischbarer KSS) für Fräsen, Drehen, Schleifen.",
    },
    grund: "Wassermischbarer KSS (ISO-L MAD), war als Umformöl geführt.",
  },

  // ============ ENI ============
  // Ganze OTE-Familie ist Turbinenöl (DIN 51515 / L-TD), nicht Hydrauliköl. (befund-eni-cepsa-q8.md)
  ...["cmphf8su4006jllef6t27wkkx", "cmphf8su8006lllefxwublmcd", "cmphf8sub006nllefu23v74d4", "cmphf8suf006pllefwtlrgk3d", "cmphew9dx0017llctlus5wp73"].map(
    (id) => ({
      id,
      name: "Eni OTE (Turbinenöl)",
      data: {
        category: "SPECIALTY",
        description: "Turbinenöl (DIN 51515 / DIN 51502 L-TD) — kein Hydrauliköl.",
      },
      grund: "OTE ist ein Turbinenöl, war als Standard-HM-Hydrauliköl geführt.",
    }),
  ),

  // ============ KLÜBER ============
  {
    id: "cmphf4nsr00ahllqf73vs7444",
    name: "Klüber Isoflex PDP 38",
    data: {
      category: "SPECIALTY",
      chemistry: "ESTER",
      description: "Synthetisches Esteröl (Präzisions-/Tieftemperatur-Lageröl) — kein Fett.",
    },
    grund: "Ist ein Esteröl, war fälschlich als Fett (GREASE) geführt.",
  },
  {
    id: "cmphf8spk004hllefhzape5y7",
    name: "Klüber Klüberbio RM 2-150",
    data: {
      category: "SPECIALTY",
      viscosityIso: "ISO VG 150",
      description: "Biologisch abbaubares Stevenrohr-/Umlauföl (kein Fett).",
    },
    grund: "Ist ein Öl (VG 150 laut TDS), war als Fett geführt; VG fehlte.",
  },
  {
    id: "cmphfae7c001vllp2hn59cv1s",
    name: "Klüber Klüberalfa DH 3-100",
    data: {
      category: "SPECIALTY",
      description:
        "PFPE-Hochleistungsöl für Sinterlager (kein Fett); Viskosität ~165 mm²/s (KEINE ISO VG 100).",
    },
    grund: "Ist ein PFPE-Öl, war als Fett geführt. „100“ ist Hauscode, keine VG.",
  },
  {
    id: "cmpheux16000xll1wvvm8pr0n",
    name: "Klüber Klüberoil 4 UH1-1500 N",
    data: { category: "GEAR_OIL", viscosityIso: "ISO VG 1500" },
    grund: "Food-Grade-Getriebeöl VG 1500 (kein Hydrauliköl hat VG 1500).",
  },
  {
    id: "cmphf4npv009nllqfpmmtg8kt",
    name: "Klüber Klübersynth UH1 14-1600",
    data: {
      category: "GREASE",
      description: "Fließfett (NLGI 0/00, Al-Komplex) — kein Getriebeöl; „1600“ ist Hauscode, keine ISO VG.",
    },
    grund: "Ist ein Fließfett, war als Getriebeöl (SPECIALTY) geführt.",
  },
  ...["cmphf8sq1004rllef6u7k95nc", "cmphf8sq5004tllefzjyie0ov", "cmphf8sq8004vllef1i2559r6"].map(
    (id) => ({
      id,
      name: "Klüber Wolfracoat",
      data: {
        description:
          "Festschmierstoff-Beschichtung auf Basis Kupfer + Graphit (kein Wolframdisulfid/WS₂).",
      },
      grund: "Enthält Kupfer + Graphit; Beschreibung „Wolframdisulfid-Paste“ war falsch.",
    }),
  ),
  {
    id: "cmphf4nti00anllqfp877jazw",
    name: "Klüber Polylub WH 2",
    data: {
      chemistry: "MINERAL",
      description: "Mehrzweckfett auf Lithiumseife + Mineralöl, −30…100 °C (kein Polyharnstoff).",
    },
    grund: "Lithiumseife/Mineralöl, war als synthetischer Polyharnstoff geführt.",
  },
  {
    id: "cmphf4ntm00apllqf8i1ke0x3",
    name: "Klüber Polylub GA 352 P",
    data: { description: "Aluminium-Komplex-Fett (kein Polyharnstoff)." },
    grund: "Verdicker ist Aluminium-Komplex, nicht Polyharnstoff.",
  },
  {
    id: "cmphf4nt400alllqfmy0kczns",
    name: "Klüber Microlube GB 0",
    data: {
      chemistry: "MINERAL",
      description: "Hochdruck-Getriebefett (Mineralöl) für Exzenterpressen und hochbelastete Getriebe.",
    },
    grund: "Mineralöl-Basis; Beschreibung „Mikromechanik/Präzisionslager“ war falsch.",
  },
  ...["cmpheuxi70087ll1wd9fr0bk7", "cmpheuxib0089ll1wlncqpn51"].map((id) => ({
    id,
    name: "Klüber Microlube GB 00",
    data: { chemistry: "MINERAL" },
    grund: "Mineralöl-Basis, war als synthetisch geführt.",
  })),

  // ============ SHELL ============
  {
    id: "cmphf8sji001lllefsnjz33ev",
    name: "Shell → Quaker Houghton: Macron EDM 110",
    data: {
      manufacturerId: MFR_QUAKER_HOUGHTON,
      category: "EDM_FLUID",
      description: "Dielektrikum für die Funkenerosion (Senk-/Drahterodieren) — kein Umformöl.",
    },
    grund: "TDS: „©2018 Quaker Houghton“, 0× Shell. Ist ein Erodier-Dielektrikum, kein Umformöl.",
  },
  ...["cmphf4n46002hllqflupa1ofp", "cmphf4n4a002jllqfvfy8ui62", "cmphf4n4h002lllqfcstvyfrx"].map(
    (id) => ({
      id,
      name: "Shell Gadus S2 V220 1/2/3",
      data: { description: "Lithium-Seifenfett (Lithium-Hydroxystearat) auf Mineralöl-Basis." },
      grund: "TDS: „lithium hydroxystearate soap“ — war als Lithium-Komplex beschrieben.",
    }),
  ),
  {
    id: "cmphfae4d000hllp24jrx0ph5",
    name: "Shell Diala S4 ZX-I",
    data: {
      chemistry: "SYNTHETIC",
      description: "Vollsynthetisches Isolieröl (GTL-Grundöl, schwefelfrei).",
    },
    grund: "GTL-Technologie → synthetisch, war als MINERAL geführt.",
  },
  {
    id: "cmpheuxjo008zll1wx4k4n6ni",
    name: "Shell Spirax S4 CX 10W",
    data: {
      category: "HYDRAULIC_OIL",
      description:
        "Off-Highway Transmissions- und Hydrauliköl (CAT TO-4, vorher Donax TC) — kein Achsöl.",
    },
    grund: "PDS: „transmission and hydraulic oil“, war als Achs-/Getriebeöl geführt.",
  },

  // ============ BP → CASTROL ============
  {
    id: "cmphew9cv0013llctrqzkpedc",
    name: "BP → Castrol: Tribol GR 1350-2.5 PD",
    data: {
      manufacturerId: MFR_CASTROL,
      description: "Hochleistungs-Langzeitfett (Vorgänger Castrol Optipit, 2015 umbenannt).",
    },
    grund: "TDS-URL ist msdspds.castrol.com; Beschreibung „ehemals Klüber“ war falsch.",
  },
  {
    id: "cmphew9d10015llctbiokzm6f",
    name: "BP → Castrol: Tribol GR 3020/1000-1 PD",
    data: { manufacturerId: MFR_CASTROL },
    grund: "TDS-URL ist msdspds.castrol.com — gehört zu Castrol, nicht BP.",
  },
  {
    id: "cmphf8sth0067llefr3o06awn",
    name: "BP → Castrol: Tribol FoodProof 1810/2-Spray",
    data: { manufacturerId: MFR_CASTROL },
    grund: "TDS-URL ist msdspds.castrol.com — gehört zu Castrol, nicht BP.",
  },

  // ============ FUCHS ============
  {
    id: "cmphf8snn003pllefv84a7ut1",
    name: "Fuchs Renolin CLP 320 VCI",
    data: {
      name: "Renolin CLP 320 VCI",
      description: "Synthetisches PAO-Getriebeöl (CLP) mit VCI-Korrosionsschutz.",
    },
    grund: "„Renogear VCI“ ist kein Fuchs-Name; korrekt: Renolin CLP 320 VCI.",
  },
  {
    id: "cmphf8snr003rllef17ys1mbe",
    name: "Fuchs Renolin CLP 460 VCI",
    data: {
      name: "Renolin CLP 460 VCI",
      description: "Synthetisches PAO-Getriebeöl (CLP) mit VCI-Korrosionsschutz.",
    },
    grund: "„Renogear VCI“ ist kein Fuchs-Name; korrekt: Renolin CLP 460 VCI.",
  },
  {
    id: "cmphf8sn0003fllefc7qb7oq4",
    name: "Fuchs Renep Compound 104",
    data: {
      viscosityIso: "ISO VG 150",
      description:
        "Historisch/abgekündigt (Nachfolger Renolin CLP 150). „104“ ist Fuchs-Hauscode = ISO VG 150 — KEINE VG 104.",
    },
    grund: "Real, aber historisch. Hauscode 104 = VG 150; korrekte VG nachgetragen.",
  },
  {
    id: "cmphf8sn8003jllef7b6cd150",
    name: "Fuchs Renep Compound 106",
    data: {
      viscosityIso: "ISO VG 220",
      description:
        "Historisch/abgekündigt (Nachfolger Renolin CLP 220). „106“ ist Fuchs-Hauscode = ISO VG 220 — KEINE VG 106.",
    },
    grund: "Real, aber historisch. Hauscode 106 = VG 220; korrekte VG nachgetragen.",
  },
];

/** Wendet die Korrekturen an. Idempotent. Gibt einen Kurzbericht zurück. */
export async function applyCorrections2026_07_18(): Promise<string> {
  let applied = 0;
  let missing = 0;
  for (const p of CORRECTIONS_2026_07_18) {
    const exists = await prisma.product.count({ where: { id: p.id } });
    if (exists === 0) {
      missing++;
      continue;
    }
    if (!DRY) {
      await prisma.product.update({ where: { id: p.id }, data: p.data });
    }
    applied++;
  }

  // searchTokens der umbenannten/umgehängten Produkte neu berechnen
  let retok = 0;
  for (const id of RETOKENIZE_IDS) {
    const prod = await prisma.product.findUnique({
      where: { id },
      select: { name: true, manufacturer: { select: { name: true } } },
    });
    if (!prod) continue;
    const tokens = buildSearchTokens({ productName: prod.name, manufacturer: prod.manufacturer.name });
    if (!DRY) await prisma.product.update({ where: { id }, data: { searchTokens: tokens } });
    retok++;
  }

  return `${applied} Produktkorrekturen angewandt, ${retok} searchTokens erneuert${missing ? `, ${missing} nicht gefunden (evtl. bereits gelöscht)` : ""}${DRY ? " [DRY]" : ""}`;
}

// Nur ausführen, wenn direkt aufgerufen. Beim Import durch deploy-tasks.ts wird
// nur die Funktion/Liste geladen (argv[1] ist dann „deploy-tasks“).
if (process.argv[1]?.includes("fix-datenqualitaet-2026-07-18")) {
  applyCorrections2026_07_18()
    .then((msg) => {
      console.log(msg);
      return prisma.$disconnect();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
