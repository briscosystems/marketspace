/**
 * Datenqualitäts-Korrektur vom 2026-07-15
 *
 * Ergebnis eines Prüfdurchgangs mit 12 Recherche-Läufen (8 Hersteller-Nummern-
 * schemata + alle 94 ProductIssue-Quellen). Auslöser war der RENOLIN-B-Fall:
 * Ein Fuchs-Hauscode war als ISO-VG gelesen und daraus eine Reihe erfunden worden.
 * Der Durchgang zeigt: kein Flächenbrand (Klüber/TotalEnergies/Shell sind sauber),
 * aber derselbe Fehler erneut bei Fuchs (Renolin MR) und in Varianten bei
 * BP, Castrol, Eni, Cepsa, Q8 und Mobil.
 *
 * Jeder Eintrag unten trägt seinen Beleg. Idempotent: bereits erledigte Schritte
 * werden übersprungen, das Skript kann gefahrlos erneut laufen.
 *
 * Aufruf:  npx tsx prisma/fix-datenqualitaet-2026-07-15.ts [--dry]
 */
import { prisma } from "@/lib/prisma";

const DRY = process.argv.includes("--dry");

type IssueDeletion = { id: string; was: string; grund: string; beleg: string };
type ProductDeletion = { id: string; name: string; grund: string; beleg: string };
type ProductPatch = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  grund: string;
  beleg: string;
};

// ============================================================
// 1) Praxis-Probleme, deren Quelle die eigene Aussage widerlegt
//    (die drei schwersten Befunde des Durchgangs)
// ============================================================
export const ISSUE_DELETIONS: IssueDeletion[] = [
  {
    id: "cmpim8oq30019llhq3cs1ptgp",
    was: "Castrol Hysol MB 50 — „Coolant wird in neuer Maschine sofort ranzig“",
    grund:
      "Aussage ist INVERTIERT. Die Quelle beschreibt den Wechsel VOM Vorgänger Hamikleer AUF Hysol " +
      "MB-50, weil das alte Mittel ranzig wurde: „The Hysol was great“. Das Ranzigwerden gehörte zum " +
      "Vorgängerprodukt. Auch „brandneue Maschine, sofort ranzig“ steht nirgends — laut Thread lief " +
      "das KSS 11 Monate problemlos.",
    beleg:
      "https://www.practicalmachinist.com/forum/threads/castrol-hysol-mb-50-problems.225737/",
  },
  {
    id: "cmpim8oqg001hllhqmce14x9u",
    was: "Castrol Hysol R — „MG Rover Powertrain Group Litigation“",
    grund:
      "Falsch beschuldigter Hersteller. Die hinterlegte Quelle nennt ausdrücklich Houghton plc als " +
      "KSS-Lieferant („supplied by an independent contractor – Houghton plc“); Castrol kommt darin " +
      "nicht vor. Der Rechtsfall ist real, hat aber keinen Bezug zu Hysol R. Da ProductIssue.productId " +
      "Pflicht ist, lässt sich der Produktbezug nicht lösen — daher Löschung.",
    beleg:
      "https://www.thompsonstradeunion.law/news/news-releases/asbestos-disease-news/mg-rover-powertrain-group-litigation",
  },
  {
    id: "cmpim8ouc003dllhq0zrcxel1",
    was: "Quaker Houghton Cindol 305D — „korrekte Konzentration kritisch für Bio-Stabilität“",
    grund:
      "Der ursprünglich gemeldete Fall, hiermit bestätigt. Die als „Quaker Houghton TDS Cindol 305D“ " +
      "ausgewiesene Quelle ist in Wahrheit das Datenblatt von CIMSTAR 540 (Cimcool) — 0 Treffer für " +
      "„Cindol“, 0 für „Quaker“/„Houghton“. Das wörtlich zitierte „excellent rust preventive " +
      "properties and biostability“ steht in dem Dokument überhaupt nicht: das Zitat ist erfunden.",
    beleg: "https://dtsindustrial.com/media/productattach/c/i/cimstar_540.pdf",
  },
];

// ============================================================
// 2) Erfundene Produkte — alle mit hoher Sicherheit belegt.
//    Vorab geprüft: keiner hängt an echten Preisdaten oder Praxis-Problemen.
// ============================================================
export const PRODUCT_DELETIONS: ProductDeletion[] = [
  // --- Fuchs: der neue Renolin B ---
  {
    id: "cmphf8smg0033llefg08iqvoi",
    name: "Fuchs Renolin MR 22",
    grund:
      "Renolin MR (nackt) trägt einen HAUSCODE, keine Viskosität — dasselbe Muster wie Renolin B. " +
      "ISO VG 22 heißt bei Fuchs „MR 5“. Eine nackte MR 22 gibt es im Katalog nicht.",
    beleg:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Produktdatenblatt/FUCHS_Renolin_MR_2008-05.pdf",
  },
  {
    id: "cmphf8smj0035llefjkgb8uqm",
    name: "Fuchs Renolin MR 32",
    grund: "ISO VG 32 heißt bei Fuchs „MR 10“. Nackte MR 32 existiert nicht.",
    beleg:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Produktdatenblatt/FUCHS_Renolin_MR_2008-05.pdf",
  },
  {
    id: "cmphf8smn0037llefz32bb7yl",
    name: "Fuchs Renolin MR 46",
    grund: "ISO VG 46 heißt bei Fuchs „MR 15“. Nackte MR 46 existiert nicht.",
    beleg:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Produktdatenblatt/FUCHS_Renolin_MR_2008-05.pdf",
  },
  {
    id: "cmpheuxgi007fll1w078ruccr",
    name: "Fuchs Wisura S 4000355515",
    grund:
      "Der „Name“ ist eine 10-stellige Artikelnummer. Eine Reihe „Wisura S“ existiert nicht — real " +
      "sind WISURA DSO 5005 / DSO 5011.",
    beleg: "https://www.fuchs.com/at/de/produkt/product/56540-WISURA-DSO-5005/",
  },
  {
    id: "cmpheuxhv0081ll1w1wycpwfj",
    name: "Fuchs Wisura S 4000355533",
    grund: "Wie oben: Artikelnummer statt Produktname, Reihe existiert nicht.",
    beleg: "https://www.fuchs.com/at/de/produkt/product/56540-WISURA-DSO-5005/",
  },

  // --- BP: Weißöl-Hauscode als VG gelesen ---
  {
    id: "cmphf8stl0069llef21td00cy",
    name: "BP Energol WM 32",
    grund:
      "Energol WM ist BPs Reihe MEDIZINISCHER WEISSÖLE mit den Hauscodes WM 2 / WM 4 / WM 6 " +
      "(15 / 32 / 71 mm²/s bei 40 °C). Die Ziffer wurde als ISO-VG gelesen und die Reihe zusätzlich " +
      "als Bettbahnöl einsortiert. Die VG-Leiter 32/68/150/220 gehört zu BP Maccurat D.",
    beleg:
      "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/4FFBD989D24B8B5280257796002FABD6/$File/Energol%20WM%20Range.pdf",
  },
  {
    id: "cmphf8sto006bllefn8emlsal",
    name: "BP Energol WM 68",
    grund: "Wie oben — Hauscode als VG gelesen.",
    beleg:
      "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/4FFBD989D24B8B5280257796002FABD6/$File/Energol%20WM%20Range.pdf",
  },
  {
    id: "cmphf8stt006dllefmj9p7s2d",
    name: "BP Energol WM 220",
    grund: "Wie oben. Eine 220 hat in keinem WM-Dokument eine Entsprechung.",
    beleg:
      "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/4FFBD989D24B8B5280257796002FABD6/$File/Energol%20WM%20Range.pdf",
  },
  {
    id: "cmphf8ssi005xllefd22nhqb0",
    name: "BP Bartran Premium 10",
    grund:
      "Die vom Datensatz SELBST zitierte TDS enthält die vollständige Grade-Tabelle 22/32/46/68/100/150. " +
      "Die DB führt 10/32/46/68/100 — erfindet also die 10 und lässt die realen 22 und 150 weg. " +
      "Signatur einer generierten Standard-Leiter statt einer Abschrift.",
    beleg:
      "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/1E8117DFCC73457A80257796002F6F3A/$File/Bartran.pdf",
  },

  // --- Castrol: Stufen aus der Nachbarreihe übernommen ---
  {
    id: "cmphf4nd4006dllqfx3opa378",
    name: "Castrol Hyspin HLP-Z 22",
    grund:
      "Hyspin HLP-Z gibt es nur in 32/46/68. Die 22 stammt aus der Nachbarreihe Hyspin ZZ (10–150), " +
      "die mit HLP-Z verwechselt wurde.",
    beleg:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/F6772A24082C4B8A802588220055F5B9/$File/WEPP-CDFF8J.pdf",
  },
  {
    id: "cmphf4ndj006jllqfjf9h1954",
    name: "Castrol Hyspin HLP-Z 100",
    grund: "Wie oben — die 100 stammt aus der ZZ-Reihe.",
    beleg:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/F6772A24082C4B8A802588220055F5B9/$File/WEPP-CDFF8J.pdf",
  },

  // --- Eni ---
  {
    id: "cmphf8stx006fllef7z31fne6",
    name: "Eni Agip OTE 10",
    grund: "Die OTE-Reihe (Turbinenöl) beginnt bei VG 32. Eine 10 existiert nicht.",
    beleg:
      "https://eniliveschmiertechnik-datenblaetter.de/en/datasheet/pdb/2464?page=5&pdf=true&dl=1",
  },
  {
    id: "cmphf8su1006hllefljsr905i",
    name: "Eni Agip OTE 22",
    grund: "Die OTE-Reihe beginnt bei VG 32. Eine 22 existiert nicht.",
    beleg:
      "https://eniliveschmiertechnik-datenblaetter.de/en/datasheet/pdb/2464?page=5&pdf=true&dl=1",
  },

  // --- Cepsa: Reihe aufgefüllt, obwohl die eigene TDS sie begrenzt ---
  {
    id: "cmphf4o4s00exllqfy9tefzsa",
    name: "Cepsa Hidráulico HLP 22",
    grund:
      "Die vom Datensatz SELBST zitierte TDS führt ausschließlich ISO 46 und 68 (Dateiname sogar " +
      "„ht_cepsa_hidraulico_hlp_46_68.pdf“). Die Stufen 22/32/100 stammen erkennbar aus der " +
      "HM-Reihe (15–100), die versehentlich auf HLP übertragen wurde.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/CEPSA_HIDRA%CC%81ULICO_HLP_05_2020.pdf",
  },
  {
    id: "cmphf4o4v00ezllqfrywh0vf8",
    name: "Cepsa Hidráulico HLP 32",
    grund: "Wie oben — HLP gibt es nur in 46 und 68.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/CEPSA_HIDRA%CC%81ULICO_HLP_05_2020.pdf",
  },
  {
    id: "cmphf4o5a00f5llqfe53qycw3",
    name: "Cepsa Hidráulico HLP 100",
    grund: "Wie oben — HLP gibt es nur in 46 und 68.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/CEPSA_HIDRA%CC%81ULICO_HLP_05_2020.pdf",
  },
  {
    id: "cmphf8t3600ahllefqar0svsu",
    name: "Cepsa Tonna 32",
    grund:
      "„Tonna“ ist eine SHELL-Marke, kein Cepsa-Produkt. Shell Tonna S2 M gibt es in genau 32/68/220 — " +
      "exakt die drei Stufen im Datensatz: eine fremde Reihe wurde 1:1 unter Cepsa-Etikett gestellt. " +
      "Cepsas echtes Bettbahnöl heißt Guías.",
    beleg: "https://www.lubritec.com/lubricantes-industriales/cepsa-guias-68/",
  },
  {
    id: "cmphf8t3a00ajllefmb24zdvv",
    name: "Cepsa Tonna 68",
    grund: "Wie oben — Shell-Marke unter Cepsa geführt.",
    beleg: "https://www.lubritec.com/lubricantes-industriales/cepsa-guias-68/",
  },
  {
    id: "cmphf8t3d00alllefdm3a6wz3",
    name: "Cepsa Tonna 220",
    grund: "Wie oben — Shell-Marke unter Cepsa geführt.",
    beleg: "https://www.lubritec.com/lubricantes-industriales/cepsa-guias-68/",
  },
  {
    id: "cmphf8t2v00abllef51mx8vyc",
    name: "Cepsa Larus EP-1",
    grund:
      "Cepsa Larus ist ein 4-Takt-MARINE-DIESELMOTORENÖL (3030/3040/4040/5040), kein Fett. Der reale " +
      "Reihenname wurde auf ein Fett umgewidmet und NLGI-Stufen 1/2/3 dazuerfunden. Cepsas " +
      "Lithium-EP-Fette sind die Arga-Reihe.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/Fichas_tecnicas/icepsa-larus-3030-3040.pdf",
  },
  {
    id: "cmphf8t2z00adllefb1x6wtpc",
    name: "Cepsa Larus EP-2",
    grund: "Wie oben — Marine-Motorenöl zum Fett umdeklariert.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/Fichas_tecnicas/icepsa-larus-3030-3040.pdf",
  },
  {
    id: "cmphf8t3200afllefm7uwub6f",
    name: "Cepsa Larus EP-3",
    grund: "Wie oben — Marine-Motorenöl zum Fett umdeklariert.",
    beleg:
      "https://www.moeve.es/stfls/comercial/FICHEROS/Fichas_tecnicas/icepsa-larus-3030-3040.pdf",
  },

  // --- Q8: Buchstabe als römische Ziffer gelesen ---
  {
    id: "cmphf8svr0077llefxhar7w31",
    name: "Q8 Transformer Oil II",
    grund:
      "Das Fuchs-Muster in Reinform, nur mit einem Buchstaben: Das „I“ in „Transformer Oil I“ steht " +
      "für Inhibited, es ist keine römische Eins. Die reale Schwesterstufe heißt „U“ (Uninhibited). " +
      "Jemand hat weitergezählt und daraus „II“ gemacht.",
    beleg: "https://www.q8oils.com/product/q8-transformer-oil-u/",
  },
  {
    id: "cmphf4o3e00efllqfje7r2g92",
    name: "Q8 Holst CR 32",
    grund:
      "Holst CR gibt es nur in 15/22/46 — „CR“ steht für Cold Rolling, die Reihe ist bewusst " +
      "niedrigviskos. Die 32 stammt aus der einfachen Holst-Reihe (22–100).",
    beleg: "https://www.q8oils.com/product/q8-holst-cr-15/",
  },
  {
    id: "cmphf4o3m00ehllqfgt9nbd4w",
    name: "Q8 Holst CR 68",
    grund: "Wie oben; widerspricht zusätzlich dem Reihenzweck („low viscosity“).",
    beleg: "https://www.q8oils.com/product/q8-holst-cr-15/",
  },
  {
    id: "cmphf4o3q00ejllqf7z0xww0e",
    name: "Q8 Holst CR 100",
    grund: "Wie oben; widerspricht dem Reihenzweck.",
    beleg: "https://www.q8oils.com/product/q8-holst-cr-15/",
  },

  // --- Mobil ---
  {
    id: "cmphfaeae003bllp2gmwd65eu",
    name: "Mobil Rarus SHC 1027",
    grund:
      "Die vom Datensatz SELBST zitierte PDS listet nur 1024/1025/1026 (VG 32/46/68) — die Reihe hat " +
      "genau drei Stufen. Die 1027 ist vermutlich aus der anderen Rarus-Reihe (400er, dort gibt es " +
      "ein 427) hochgerechnet.",
    beleg:
      "https://www.ulei-mobil.ro/pdf/MobilIndustrieDataSheet/Rarus%20SHC%201020%20Series%20pds.pdf",
  },
  {
    id: "cmphf4nbq005tllqfkgn2nquv",
    name: "Mobil Mobilgrease XHP Standard",
    grund:
      "„Standard“ existiert in Mobils Namensschema nicht — alle Stufen sind numerisch " +
      "(005/220/221/222/222 Special/223). Das Feld productFamily sagt bereits „XHP 222“.",
    beleg: "https://www.mobil.com/en-us/grease/pds/gl-xx-mobilgrease-xhp-220-series",
  },

  // --- Datenmüll: Dokumentnummern und Dateinamen als Produkte ---
  {
    id: "cmpheuxlf009tll1wzewfo45t",
    name: "Castrol „2985881 (PDS/SDS)“",
    grund: "Kein Produktname, sondern eine Dokumentnummer.",
    beleg: "Selbstbeleg: der Name ist ein Dateibezeichner",
  },
  {
    id: "cmpheuxli009vll1wq9c41ttd",
    name: "Castrol „3068499 (PDS/SDS)“",
    grund: "Kein Produktname, sondern eine Dokumentnummer.",
    beleg: "Selbstbeleg: der Name ist ein Dateibezeichner",
  },
  {
    id: "cmpheuxnf00arll1w4mhbmo9r",
    name: "Klüber „KC SDS QB_D66500144“",
    grund: "Ein SDS-Dateiname, der als Produktdatensatz importiert wurde.",
    beleg: "Selbstbeleg: der Name ist ein Dateibezeichner",
  },
  {
    id: "cmpheuxif008bll1wjhysabzy",
    name: "Mobil „1 5W-30“",
    grund:
      "Abgeschnittener Name („Mobil“ fehlt), keine Attribute, kein TDS. Duplikat zu „Mobil 1 5W-30“ " +
      "(cmphf4naz005hllqfr2aymj16).",
    beleg: "interner Dublettenabgleich",
  },
];

// ============================================================
// 3) Falsche Viskosität — Hauscode als ISO-VG eingetragen.
//    Produkte sind real, nur die Zahl ist falsch. Das ist der
//    RENOLIN-B-Fehler an der zweiten Fuchs-Reihe.
// ============================================================
export const PRODUCT_PATCHES: ProductPatch[] = [
  {
    id: "cmphf8sm9002zllefuu57vrq3",
    name: "Fuchs Renolin MR 10",
    data: { viscosityIso: "ISO VG 32" },
    grund:
      "„MR 10“ ist ein Fuchs-Hauscode, keine Viskosität: MR 10 = ISO VG 32. In der DB stand ISO VG 10. " +
      "Die Fuchs-TDS führt „Sortenbezeichnung“ und „ISO VG“ als zwei getrennte Zeilen direkt " +
      "untereinander — es wurde die falsche Zeile übernommen.",
    beleg:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Produktdatenblatt/FUCHS_Renolin_MR_2008-05.pdf",
  },
  {
    id: "cmphf8smd0031llefflyv0g3q",
    name: "Fuchs Renolin MR 15",
    data: { viscosityIso: "ISO VG 46" },
    grund: "„MR 15“ = ISO VG 46 (Hauscode). In der DB stand ISO VG 15.",
    beleg:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Produktdatenblatt/FUCHS_Renolin_MR_2008-05.pdf",
  },
];

async function main() {
  console.log(DRY ? "== PROBELAUF (--dry): es wird nichts geschrieben ==\n" : "== Korrektur läuft ==\n");

  // --- Praxis-Probleme ---
  console.log("1) Praxis-Probleme, deren Quelle die eigene Aussage widerlegt");
  let issuesGelöscht = 0;
  for (const e of ISSUE_DELETIONS) {
    const vorhanden = await prisma.productIssue.findUnique({
      where: { id: e.id },
      select: { title: true },
    });
    if (!vorhanden) {
      console.log(`   übersprungen (schon weg): ${e.was}`);
      continue;
    }
    if (!DRY) await prisma.productIssue.delete({ where: { id: e.id } });
    issuesGelöscht++;
    console.log(`   gelöscht: ${e.was}`);
    console.log(`             ${e.grund}`);
    console.log(`             Beleg: ${e.beleg}`);
  }

  // --- Erfundene Produkte ---
  console.log("\n2) Erfundene Produkte");
  let produkteGelöscht = 0;
  for (const p of PRODUCT_DELETIONS) {
    const vorhanden = await prisma.product.findUnique({
      where: { id: p.id },
      select: { name: true, _count: { select: { priceObservations: true, issues: true } } },
    });
    if (!vorhanden) {
      console.log(`   übersprungen (schon weg): ${p.name}`);
      continue;
    }
    const anhang = vorhanden._count.priceObservations + vorhanden._count.issues;
    if (!DRY) await prisma.product.delete({ where: { id: p.id } });
    produkteGelöscht++;
    console.log(
      `   gelöscht: ${p.name}${anhang ? `  (+ ${vorhanden._count.priceObservations} Demo-Preise, ${vorhanden._count.issues} Issues kaskadiert)` : ""}`,
    );
    console.log(`             ${p.grund}`);
  }

  // --- Falsche Viskosität ---
  console.log("\n3) Falsche Viskosität (Hauscode als ISO-VG gelesen)");
  let korrigiert = 0;
  for (const p of PRODUCT_PATCHES) {
    const vorher = await prisma.product.findUnique({
      where: { id: p.id },
      select: { name: true, viscosityIso: true },
    });
    if (!vorher) {
      console.log(`   übersprungen (nicht gefunden): ${p.name}`);
      continue;
    }
    const ziel = p.data.viscosityIso as string;
    if (vorher.viscosityIso === ziel) {
      console.log(`   übersprungen (schon korrekt): ${p.name} = ${ziel}`);
      continue;
    }
    if (!DRY) await prisma.product.update({ where: { id: p.id }, data: p.data });
    korrigiert++;
    console.log(`   korrigiert: ${p.name}: „${vorher.viscosityIso}“ → „${ziel}“`);
    console.log(`               ${p.grund}`);
  }

  const produkteGesamt = await prisma.product.count();
  const issuesGesamt = await prisma.productIssue.count();
  console.log(
    `\n== ${DRY ? "Probelauf" : "Fertig"}: ${issuesGelöscht} Praxis-Probleme gelöscht, ` +
      `${produkteGelöscht} Produkte gelöscht, ${korrigiert} Viskositäten korrigiert ==`,
  );
  console.log(`   Stand jetzt: ${produkteGesamt} Produkte, ${issuesGesamt} Praxis-Probleme`);
  if (!DRY) console.log("   Hinweis: danach `npx tsx prisma/backfill-search-tokens.ts` laufen lassen.");
}

// Nur ausführen, wenn direkt aufgerufen (`npx tsx prisma/fix-…ts`). Beim Import
// durch deploy-tasks.ts sollen nur die Listen oben geladen werden.
if (process.argv[1]?.includes("fix-datenqualitaet")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
