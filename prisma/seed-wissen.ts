// Praxis-Wissen anreichern — zusätzliche dokumentierte Fälle, Schwerpunkt
// "Fleckenbildung auf Stückgut-Oberflächen" (WORKPIECE_STAINS) + weitere häufige
// Themen. Idempotent über Tag sourceAuthor="__demo-wissen__".
//
// Aufruf: DATABASE_URL='…' npx tsx prisma/seed-wissen.ts
import { PrismaClient, IssueCategory, IssueSeverity, IssueSourceType } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "__demo-wissen__";

type Seed = {
  cat: IssueCategory;
  sev: IssueSeverity;
  title: string;
  description: string;
  symptoms: string[];
  rootCause: string;
  workaround: string;
  preventive?: string;
  materials?: string[];
  operations?: string[];
  official?: boolean;
  src: IssueSourceType;
  srcTitle: string;
};

const SEEDS: Seed[] = [
  {
    cat: "WORKPIECE_STAINS", sev: "MEDIUM",
    title: "Grünliche Verfärbung auf Messing- und Buntmetallteilen",
    description:
      "Nach der Bearbeitung zeigen Messing-, Kupfer- und Rotguss-Werkstücke grünliche bis dunkle Flecken, teils mit leicht klebrigem Belag. Tritt verstärkt bei frisch angesetzter Emulsion und höherem pH auf.",
    symptoms: ["Grünfärbung", "Fleckenbildung Messing", "klebriger Belag"],
    rootCause: "Zu hoher pH-Wert und aggressive Amin-/Fettsäure-Komponenten greifen Buntmetall an.",
    workaround: "pH auf 8,8–9,2 halten, ein ausdrücklich buntmetallverträgliches Konzentrat einsetzen und Teile nicht nass liegen lassen.",
    preventive: "Buntmetall-Inhibitor (Benzotriazol) im Produkt bevorzugen; Konzentration nicht überdosieren.",
    materials: ["Messing", "Kupfer", "Buntmetall", "Rotguss"], operations: ["Drehen", "Fräsen"],
    src: "FORUM", srcTitle: "Industrieforum: Buntmetall verfärbt sich",
  },
  {
    cat: "WORKPIECE_STAINS", sev: "MEDIUM",
    title: "Dunkle Anlauffarben und Flecken auf Aluminium",
    description:
      "Aluminium-Werkstücke (besonders hochlegierte Sorten) bekommen graue bis dunkle Anlaufflecken, teils fleckig-wolkig über die Oberfläche verteilt.",
    symptoms: ["Anlauffarben Alu", "graue Flecken", "wolkige Oberfläche"],
    rootCause: "Alkalischer Angriff durch zu hohe Konzentration/pH auf die Alu-Legierung.",
    workaround: "Konzentration senken (Refraktometer!), alu-geeigneten KSS mit Aluminium-Inhibitor verwenden.",
    materials: ["Aluminium", "AlMgSi", "Alu-Guss"], operations: ["Fräsen", "Bohren"],
    src: "MANUFACTURER", srcTitle: "Hersteller-Anwendungshinweis Aluminiumbearbeitung", official: true,
  },
  {
    cat: "WORKPIECE_STAINS", sev: "LOW",
    title: "Weiße/kalkige Flecken auf Werkstücken nach dem Trocknen",
    description:
      "Nach dem Abtrocknen bleiben weiße, kalkige oder kristalline Ränder und Flecken auf dem Stückgut zurück — vor allem an Regionen mit stehenden Tropfen.",
    symptoms: ["Weißflecken", "Kalkränder", "Salzrückstände"],
    rootCause: "Zu hartes Ansetzwasser (>20 °dH) hinterlässt Kalk-/Salzrückstände beim Verdunsten.",
    workaround: "Emulsion mit enthärtetem/teilentsalztem Wasser (10–15 °dH) ansetzen; Teile nach der Bearbeitung abspülen/abblasen.",
    materials: ["Stahl", "Edelstahl", "Aluminium"],
    src: "FORUM", srcTitle: "Praktiker-Tipp: Wasserhärte und Fleckenbildung",
  },
  {
    cat: "WORKPIECE_STAINS", sev: "HIGH",
    title: "Rost- und Braunflecken auf Guss/Stahl bei Zwischenlagerung des Stückguts",
    description:
      "Fertig bearbeitete Guss- und Stahlteile zeigen nach einigen Stunden bis Tagen der Zwischenlagerung Rost- und Braunflecken, insbesondere an Kontaktstellen und in gestapeltem Zustand.",
    symptoms: ["Rostflecken", "Braunflecken", "Kontaktkorrosion"],
    rootCause: "Zu niedrige Konzentration oder verbrauchter Korrosionsschutz (nach Stillstand/Verkeimung) → unzureichender Zwischenrostschutz.",
    workaround: "Konzentration prüfen und anheben; für Zwischenlagerung Kurzzeit-Korrosionsschutz auftragen; Stückgut nicht nass stapeln, sondern belüftet trocknen.",
    preventive: "Regelmäßige Refraktometer-Kontrolle und Systempflege gegen Verkeimung (senkt Korrosionsschutz).",
    materials: ["Grauguss", "Stahl", "Sphäroguss"], operations: ["Drehen", "Fräsen", "Schleifen"],
    src: "CASE_STUDY", srcTitle: "Fallstudie: Zwischenrost an gestapelten Gussteilen",
  },
  {
    cat: "WORKPIECE_STAINS", sev: "LOW",
    title: "Schlieren und fleckige Oberfläche auf polierten Edelstahlteilen",
    description:
      "Auf polierten oder sichtbaren Niro-Oberflächen entstehen ölige Schlieren und fleckige, ungleichmäßige Bereiche, die die Optik stören.",
    symptoms: ["Schlieren", "Ölfilm", "fleckige Niro-Oberfläche"],
    rootCause: "Eingeschlepptes Fremd-/Tramp-Oil (Lecköl der Maschine) schwimmt auf und legt sich als Film auf die Teile.",
    workaround: "Tramp-Oil regelmäßig abskimmen, Leckagen der Hydraulik/Bahnöl abstellen, Bandfilter/Skimmer prüfen.",
    materials: ["Edelstahl", "Niro"],
    src: "FORUM", srcTitle: "CNC-Forum: Schlieren auf Edelstahl",
  },
  {
    cat: "FOAM", sev: "MEDIUM",
    title: "Starke Schaumbildung bei weichem Wasser und Hochdruckzufuhr",
    description:
      "Die Emulsion schäumt stark über, der Schaum läuft aus der Wanne; verstärkt bei weichem Ansetzwasser und hohen Pumpendrücken/Düsen.",
    symptoms: ["Schaum", "Überlaufen", "Lufteintrag"],
    rootCause: "Weiches Wasser (<8 °dH) und hoher Lufteintrag begünstigen stabilen Schaum.",
    workaround: "Wasserhärte leicht anheben, geeigneten Entschäumer sparsam dosieren, Rücklauf/Düsen entlüften und Füllstand erhöhen.",
    src: "FORUM", srcTitle: "Forum: KSS schäumt über",
  },
  {
    cat: "BIOLOGY", sev: "HIGH",
    title: "Fauliger Geruch und pH-Abfall nach dem Wochenende",
    description:
      "Montagmorgens riecht die Emulsion faulig (sog. Montagsgeruch), der pH ist gefallen, teils Verfärbung und Schleim an der Wanne.",
    symptoms: ["Fauliger Geruch", "pH-Drop", "Schleimbildung"],
    rootCause: "Anaerobe Bakterien (u. a. Pseudomonas/SRB) vermehren sich bei Stillstand.",
    workaround: "Über Nacht/Wochenende umwälzen und belüften; Systemreiniger vor Neuansatz; Biozid nur nach Herstellervorgabe.",
    preventive: "Konzentration halten, Tramp-Oil entfernen, Späne austragen; Umwälzpumpe zeitgesteuert laufen lassen.",
    materials: [], operations: [],
    src: "FORUM", srcTitle: "Montagsgeruch im KSS", official: false,
  },
  {
    cat: "OPERATOR_HEALTH", sev: "HIGH",
    title: "Hautrötungen und Ekzeme an Unterarmen und Händen",
    description:
      "Bediener klagen über gerötete, rissige Haut und Ekzeme im Kontaktbereich mit der Emulsion.",
    symptoms: ["Hautrötung", "Ekzem", "trockene Haut"],
    rootCause: "Überkonzentration, hoher pH und/oder Nitrosamin-/Formaldehyd-Abspalter reizen die Haut.",
    workaround: "Konzentration exakt einhalten, pH kontrollieren, borsäure-/formaldehydabspalterfreies Produkt wählen, Hautschutzplan (TRGS 401).",
    preventive: "Regelmäßige Konzentrations-/pH-Messung; Hautschutz-Unterweisung.",
    src: "REGULATORY", srcTitle: "TRGS 611 / Hautschutz KSS", official: true,
  },
  {
    cat: "CORROSION", sev: "MEDIUM",
    title: "Braune Ablagerungen und Flugrost an Maschinenführungen",
    description:
      "An Bahnen, Führungen und in der Wanne bilden sich braune Ablagerungen und Flugrost, obwohl das Werkstück selbst noch ok ist.",
    symptoms: ["Flugrost", "braune Ablagerung", "Führungen betroffen"],
    rootCause: "Unverträglichkeit/Verschleppung von Bahnöl in die Emulsion oder zu geringer Korrosionsschutz.",
    workaround: "Bahnöl-Kompatibilität prüfen (Splitting vermeiden), Tramp-Oil abskimmen, Konzentration/Additivstand kontrollieren.",
    src: "FORUM", srcTitle: "Flugrost an der Maschine",
  },
  {
    cat: "RESIDUES", sev: "MEDIUM",
    title: "Klebrige, harzige Rückstände auf Maschine und Werkzeugen",
    description:
      "Nach längerer Standzeit bilden sich klebrige, harzartige Beläge auf Werkzeughaltern, Blechen und in der Maschine, die schwer zu entfernen sind.",
    symptoms: ["klebrige Rückstände", "Harzbildung", "Verklebung"],
    rootCause: "Aufkonzentration durch Verdunstung und Fremdöl-Anreicherung; alte, überalterte Emulsion.",
    workaround: "Emulsion auffrischen/neu ansetzen, Systemreiniger einsetzen, Verdunstungswasser regelmäßig nachfüllen (Konzentration konstant halten).",
    src: "FORUM", srcTitle: "Klebrige Beläge im KSS-System",
  },
];

async function main() {
  await prisma.productIssue.deleteMany({ where: { sourceAuthor: TAG } });

  // Passende Produkte je Kategorie suchen (Fallback: irgendein Produkt)
  const coolant = await prisma.product.findMany({
    where: { category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] } },
    select: { id: true },
    take: 40,
  });
  const anyProd = await prisma.product.findMany({ select: { id: true }, take: 40 });
  const pool = (coolant.length ? coolant : anyProd).map((p) => p.id);
  if (pool.length === 0) throw new Error("Keine Produkte gefunden");

  let created = 0;
  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i];
    await prisma.productIssue.create({
      data: {
        productId: pool[i % pool.length],
        category: s.cat,
        severity: s.sev,
        status: "VERIFIED",
        title: s.title,
        description: s.description,
        symptoms: s.symptoms,
        rootCause: s.rootCause,
        workaround: s.workaround,
        preventiveMeasure: s.preventive ?? null,
        affectedMaterials: s.materials ?? [],
        affectedOperations: s.operations ?? [],
        sourceType: s.src,
        sourceTitle: s.srcTitle,
        sourceAuthor: TAG,
        isOfficial: s.official ?? false,
        reportCount: 1 + (i % 4),
      },
    });
    created++;
  }
  const total = await prisma.productIssue.count();
  console.log(`✅ ${created} Praxis-Fälle ergänzt (Schwerpunkt Fleckenbildung). Gesamt: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
