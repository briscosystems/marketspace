// Materialien (Elastomere, Kunststoffe) + Inhaltsstoff-Verträglichkeit
//
// Quellen:
//   - ISM Compatibility Chart (industrialspec.com, 2018)
//   - O-Ring Prüflabor Richter (Schadensbild "Chemischer Angriff", 2017)
//   - Trelleborg Sealing Solutions, Chemical Compatibility DB
//   - Parker Praedifa O-Ring Handbook (PTD5705)
//   - Eastern Seals UK / Hi-Tech Seals Compatibility Guides
//
// Idempotent über `slug` upsert. Compatibility-Matrix wird nach jedem Lauf
// vollständig neu aufgebaut (delete-then-insert pro Ingredient-Material-Paar).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────────────
// 1) Materialien
// ────────────────────────────────────────────────────────────────────────────
const MATERIALS = [
  // Elastomere (Dichtungen)
  {
    slug: "nbr",
    name: "NBR (Nitril-Butadien-Kautschuk)",
    shortName: "NBR",
    category: "ELASTOMER" as const,
    description:
      "Standard-Dichtungswerkstoff. Sehr gut gegen Mineralöle, Hydrauliköle, Fette. Empfindlich gegen Amine (z.B. Ethanolamine in KSS), polare Lösemittel, Bremsflüssigkeit, Ozon. Acrylnitril-Gehalt 18-50% bestimmt Ölbeständigkeit vs. Kälteflexibilität.",
    typicalUseCases: ["O-Ringe Hydraulik", "Wellendichtringe (Simmerringe)", "Hydraulik-Stangendichtungen"],
    temperatureMinC: -30,
    temperatureMaxC: 100,
    isPolar: false,
    sourceUrl: "https://www.industrialspec.com/images/files/elastomers-chemical-compatibility-chart-from-ism.pdf",
    sourceLabel: "ISM Compatibility Chart",
  },
  {
    slug: "hnbr",
    name: "HNBR (Hydrierter Nitril-Kautschuk)",
    shortName: "HNBR",
    category: "ELASTOMER" as const,
    description:
      "Hydrierte NBR-Variante: bessere Hitze-, Ozon- und Alterungsbeständigkeit als NBR, ähnliche Medienbeständigkeit. Wird in modernen KSS-Hydrauliken NBR vorgezogen, hat aber dieselbe Schwäche gegen Amine.",
    typicalUseCases: ["KSS-Hochdruck-Hydraulik", "Klimaanlagen-Dichtungen", "Automotive-Antrieb"],
    temperatureMinC: -40,
    temperatureMaxC: 150,
    isPolar: false,
    parentSlug: "nbr",
    sourceLabel: "Trelleborg / Freudenberg Datenblätter",
  },
  {
    slug: "epdm",
    name: "EPDM (Ethylen-Propylen-Dien-Kautschuk)",
    shortName: "EPDM",
    category: "ELASTOMER" as const,
    description:
      "Top-Werkstoff für Wasser, Dampf, Glykol, schwache Säuren/Laugen, Ozon, UV. NICHT geeignet für Mineralöl, Kohlenwasserstoffe oder fettige Schmierstoffe — Quellung > 100%. Ideal für wassermischbare KSS mit niedrigem Mineralölanteil.",
    typicalUseCases: ["Brems-Hydraulik", "Sanitär/Trinkwasser", "Solar-Dichtungen", "Kfz-Kühlsysteme"],
    temperatureMinC: -50,
    temperatureMaxC: 150,
    isPolar: true,
    sourceLabel: "ISM Compatibility Chart",
  },
  {
    slug: "fkm",
    name: "FKM/Viton (Fluorkautschuk, Standardtyp)",
    shortName: "FKM",
    category: "ELASTOMER" as const,
    description:
      "Universaler Hochleistungs-Dichtungswerkstoff: top Beständigkeit gegen Mineralöle, Kohlenwasserstoffe, viele Lösemittel, hohe Temperaturen. Schwächen: Heißwasser/Dampf (bisphenolisch vernetzt < 100°C), polare Lösemittel (Aceton), niedermolekulare organische Säuren, **Monoethanolamin (D)**.",
    typicalUseCases: ["Aggressive Schmierstoffe", "Kraftstoff/Diesel", "Chemie", "Hochtemperatur-Dichtungen"],
    temperatureMinC: -20,
    temperatureMaxC: 200,
    isPolar: false,
    sourceLabel: "Parker Praedifa O-Ring Handbook",
  },
  {
    slug: "fkm-peroxide",
    name: "FKM peroxidisch vernetzt",
    shortName: "FKM-Px",
    category: "ELASTOMER" as const,
    description:
      "Peroxidisch vernetztes FKM: erweiterter Einsatzbereich in Heißwasser/Dampf bis 200°C, besser für aminhaltige Fluide als bisphenolisches FKM. Höhere Druckverformungs-Reste — eher für statische Dichtungen.",
    typicalUseCases: ["Heißwasser/Dampf-Hydraulik", "KSS-Anlagen mit Aminen"],
    temperatureMinC: -20,
    temperatureMaxC: 200,
    isPolar: false,
    parentSlug: "fkm",
    sourceLabel: "O-Ring Prüflabor Richter",
  },
  {
    slug: "ffkm",
    name: "FFKM/Kalrez (Perfluorelastomer)",
    shortName: "FFKM",
    category: "ELASTOMER" as const,
    description:
      "Universalbeständig — verträgt nahezu alle Chemikalien inkl. Amine, polare Lösemittel, Heißwasser. Sehr teuer, eingesetzt nur wenn andere Materialien versagen. Standard in der Halbleiter-/Chemie-Industrie.",
    typicalUseCases: ["Chemie-Hochsicherheit", "Halbleiter-Fertigung", "Pharma", "KSS bei Mehrfach-Aggressivität"],
    temperatureMinC: -20,
    temperatureMaxC: 327,
    isPolar: false,
    sourceLabel: "DuPont Kalrez Selector Guide",
  },
  {
    slug: "silicone-vmq",
    name: "Silikon (VMQ)",
    shortName: "VMQ",
    category: "ELASTOMER" as const,
    description:
      "Extrem temperaturbeständig (-60 bis +230°C), gut gegen Wasser, schwache Säuren, viele wässrige Medien. Mäßig in Öl (Quellung), schwache mechanische Festigkeit — primär statische Dichtungen. Lebensmittel-zugelassen.",
    typicalUseCases: ["Lebensmittelindustrie", "Backofen-Dichtungen", "Kabelisolation", "Medizintechnik"],
    temperatureMinC: -60,
    temperatureMaxC: 230,
    isPolar: false,
    sourceLabel: "ISM Compatibility Chart",
  },
  {
    slug: "fvmq",
    name: "FVMQ (Fluorsilikon)",
    shortName: "FVMQ",
    category: "ELASTOMER" as const,
    description:
      "Fluoriertes Silikon: bessere Ölbeständigkeit als VMQ, behält Tieftemperatur-Flex von Silikon. Teurer als FKM, nur bei -50°C bis -60°C-Anforderung sinnvoll.",
    typicalUseCases: ["Tieftemperatur-Hydraulik", "Luft- und Raumfahrt", "Treibstoff-Dichtungen bei Kälte"],
    temperatureMinC: -60,
    temperatureMaxC: 180,
    isPolar: false,
    parentSlug: "silicone-vmq",
    sourceLabel: "Parker Handbook",
  },
  {
    slug: "polyurethane",
    name: "Polyurethan (AU/EU)",
    shortName: "PUR",
    category: "ELASTOMER" as const,
    description:
      "Sehr hohe mechanische Festigkeit, abriebfest, gut gegen Mineralöl. **Hydrolysiert in Heißwasser, wassermischbaren KSS und Aminen — daher für wassergemischte KSS kritisch.** Standard für Hydraulik-Stangendichtungen bei Mineralöl, NICHT für Emulsionen.",
    typicalUseCases: ["Hydraulik-Stangendichtungen Mineralöl", "Abstreifer", "Verschleißteile"],
    temperatureMinC: -30,
    temperatureMaxC: 80,
    isPolar: true,
    sourceLabel: "Parker Handbook + Eastern Seals UK",
  },
  // Thermoplaste / Kunststoffe (Anlagenteile, Schauglas, Behälter)
  {
    slug: "ptfe",
    name: "PTFE (Polytetrafluorethylen / Teflon)",
    shortName: "PTFE",
    category: "THERMOPLASTIC" as const,
    description:
      "Praktisch universalbeständig — verträgt alle in KSS vorkommenden Chemikalien. Kein Elastomer (kein Rückstellverhalten), daher als Reinwerkstoff nur für statische Dichtungen / Schlauchinnenseiten / Stützringe. Häufig als Federdichtung mit FKM-/Edelstahl-Feder.",
    typicalUseCases: ["Federgelagerte Dichtungen", "Chemie-Schlauch-Inliner", "Stützringe"],
    temperatureMinC: -200,
    temperatureMaxC: 260,
    isPolar: false,
    sourceLabel: "Allgemein bekannt",
  },
  {
    slug: "pa6",
    name: "Polyamid 6/6.6 (Nylon, PA)",
    shortName: "PA6",
    category: "THERMOPLASTIC" as const,
    description:
      "Wassermischbare KSS und Heißwasser greifen PA durch Hydrolyse an — gut sichtbar an Versprödung und Festigkeitsverlust. Auch gegen Säuren empfindlich. In KSS-Anlagen meist nur als Strukturteil außerhalb der Flüssigkeit OK.",
    typicalUseCases: ["Maschinen-Gehäuse", "Zahnräder", "Schläuche (extern)"],
    temperatureMinC: -40,
    temperatureMaxC: 100,
    isPolar: true,
    sourceLabel: "Bayer-Material-Tabellen",
  },
  {
    slug: "pom",
    name: "POM (Polyoxymethylen, Polyacetal)",
    shortName: "POM",
    category: "THERMOPLASTIC" as const,
    description:
      "Wassermischbare KSS bei pH > 9.5 (typisch bei aminhaltigen Emulsionen) greift POM durch Hydrolyse an. Auch starke Säuren und Oxidationsmittel sind kritisch. OK gegen Mineralöl und neutrale Fluide.",
    typicalUseCases: ["Präzisionsteile", "Zahnräder", "Ventilkomponenten"],
    temperatureMinC: -40,
    temperatureMaxC: 100,
    isPolar: true,
    sourceLabel: "DuPont Delrin Datenblatt",
  },
  {
    slug: "pp",
    name: "PP (Polypropylen)",
    shortName: "PP",
    category: "THERMOPLASTIC" as const,
    description:
      "Gut beständig gegen wässrige Medien (auch heiß), schwache und mittelstarke Säuren/Laugen, Alkohole. Quillt in starken Kohlenwasserstoffen. Häufig in KSS-Behältern/Wannen und Filtergehäusen.",
    typicalUseCases: ["KSS-Tanks", "Filtergehäuse", "Fittings"],
    temperatureMinC: -10,
    temperatureMaxC: 100,
    isPolar: false,
    sourceLabel: "Allgemein bekannt",
  },
  {
    slug: "pe-hd",
    name: "PE-HD (Polyethylen hochdicht)",
    shortName: "PE-HD",
    category: "THERMOPLASTIC" as const,
    description:
      "Ähnlich PP — gut gegen Wasser, Säuren, Laugen. Quillt in Kohlenwasserstoffen. KSS-Kanister/IBC-Innenseiten typisch PE-HD. Stress-Cracking bei Tensiden möglich.",
    typicalUseCases: ["IBC-Container", "Kanister", "Wannen"],
    temperatureMinC: -50,
    temperatureMaxC: 80,
    isPolar: false,
    sourceLabel: "Allgemein bekannt",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 2) Inhaltsstoffe (typische KSS-/Schmierstoff-Bestandteile)
// ────────────────────────────────────────────────────────────────────────────
const INGREDIENTS = [
  // Amine — Hauptursache für NBR/Polyurethan-Schäden in KSS
  {
    slug: "monoethanolamine",
    name: "Monoethanolamin (MEA)",
    shortName: "MEA",
    category: "AMINE" as const,
    casNumbers: ["141-43-5"],
    functionInFluid:
      "pH-Stabilisierung (Soll-pH 8.8-9.5), Korrosionsschutz für Eisen, Emulgator-Hilfe. In modernen wassermischbaren KSS 5-15% des Konzentrats.",
    typicalConcentrationPct: 10,
    description:
      "Stärkstes der Ethanolamine. Stark schädigend für NBR, FKM (Standard), Polyurethan. Bei dauerhaftem Kontakt Dichtungsausfall innerhalb von Wochen.",
    isSvhc: false,
    sourceLabel: "ECHA Datenbank + ISM Chart (Rating D)",
  },
  {
    slug: "diethanolamine",
    name: "Diethanolamin (DEA)",
    shortName: "DEA",
    category: "AMINE" as const,
    casNumbers: ["111-42-2"],
    functionInFluid:
      "Korrosionsschutz, pH-Stabilisierung. Seit 2009 in Deutschland in metallbearbeitenden KSS verboten (TRGS 611), aber gelegentlich noch in Altprodukten oder Importen.",
    typicalConcentrationPct: 0,
    description:
      "Sekundäres Amin — kann mit Nitrit/Nitrat zu krebserzeugenden N-Nitrosaminen reagieren. Materialwirkung ähnlich MEA, etwas milder.",
    isSvhc: false,
    sourceLabel: "TRGS 611",
  },
  {
    slug: "triethanolamine",
    name: "Triethanolamin (TEA)",
    shortName: "TEA",
    category: "AMINE" as const,
    casNumbers: ["102-71-6"],
    functionInFluid:
      "Mildere Variante zu MEA: pH-Stabilisierung, Korrosionsschutz. Heute am häufigsten in neuen KSS-Rezepturen wegen geringerem Nitrosamin-Risiko.",
    typicalConcentrationPct: 8,
    description:
      "Tertiäres Amin — schädigend für NBR und FKM Standard, geringer als MEA. EPDM und Silikon vertragen TEA gut.",
    isSvhc: false,
    sourceLabel: "ISM Chart, Trelleborg DB",
  },
  {
    slug: "morpholine",
    name: "Morpholin",
    shortName: "Morpholin",
    category: "AMINE" as const,
    casNumbers: ["110-91-8"],
    functionInFluid: "Korrosionsinhibitor (Boilerwasser, manche KSS), Säurefänger.",
    typicalConcentrationPct: 1,
    description:
      "Sekundäres zyklisches Amin — wie DEA risikobehaftet (Nitrosaminbildung). Materialwirkung: NBR und Polyurethan stark angegriffen.",
    sourceLabel: "ECHA, ISM Chart",
  },
  // Biozide / Formaldehyd-Donatoren
  {
    slug: "bronopol",
    name: "Bronopol (BNPD)",
    shortName: "Bronopol",
    category: "FORMALDEHYDE_RELEASER" as const,
    casNumbers: ["52-51-7"],
    functionInFluid: "Konservierungsmittel gegen Bakterien in wassermischbaren KSS; Formaldehyd-Donor.",
    typicalConcentrationPct: 0.15,
    description:
      "Setzt langsam Formaldehyd frei → wirkt biozid, kann aber NBR und EPDM bei langer Exposition angreifen. Konzentrationen 0.1-0.2%.",
    sourceLabel: "BG-Hinweis biocide-info.de",
  },
  {
    slug: "dmdm-hydantoin",
    name: "DMDM-Hydantoin",
    shortName: "DMDM",
    category: "FORMALDEHYDE_RELEASER" as const,
    casNumbers: ["6440-58-0"],
    functionInFluid: "Biozid für wassermischbare KSS, langsam Formaldehyd-freisetzend.",
    typicalConcentrationPct: 0.2,
    description: "Wie Bronopol — Formaldehyd-Donor. Material-Wirkung primär auf NBR (C).",
    sourceLabel: "biocide-info.de",
  },
  {
    slug: "hexahydro-triazine",
    name: "Hexahydro-Triazin (Grotan)",
    shortName: "Triazin",
    category: "FORMALDEHYDE_RELEASER" as const,
    casNumbers: ["4719-04-4"],
    functionInFluid: "Wichtigster KSS-Biozid in Europa; Formaldehyd-Donor.",
    typicalConcentrationPct: 0.3,
    description: "Häufigster KSS-Biozid. Geruchsbildung typisch. Wirkung auf NBR und PU bei Langzeitexposition.",
    sourceLabel: "Schülke Grotan Datenblatt",
  },
  {
    slug: "mit-bit-isothiazolinones",
    name: "Methyl-/Benzisothiazolinone (MIT/BIT/CMIT)",
    shortName: "Isothiazolinone",
    category: "BIOCIDE" as const,
    casNumbers: ["2682-20-4", "2634-33-5", "26172-55-4"],
    functionInFluid: "Breitband-Biozide gegen Bakterien und Pilze in wassermischbaren KSS und Wasserlacken.",
    typicalConcentrationPct: 0.05,
    description:
      "Wirkstoff in vielen modernen Biozid-Cocktails. Materialwirkung relativ moderat — eher hautsensibilisierend für Maschinenbediener.",
    sourceLabel: "ECHA, Schülke Lonza-Datenblätter",
  },
  // Basisöle
  {
    slug: "mineral-oil",
    name: "Mineralöl (paraffinisch/naphthenisch)",
    shortName: "Mineralöl",
    category: "BASE_OIL_MINERAL" as const,
    casNumbers: ["64741-88-4", "64742-52-5", "64742-65-0"],
    functionInFluid:
      "Trägerflüssigkeit für nicht-wassermischbare KSS (Schneidöle), Schmieröle, Hydrauliköle. Auch in wassermischbaren KSS 30-60% des Konzentrats.",
    typicalConcentrationPct: 50,
    description:
      "**Stark schädigend für EPDM (Quellung > 100%) und Naturkautschuk.** Standard für NBR, HNBR, FKM (alle A-Bewertung).",
    sourceLabel: "ISM Chart",
  },
  {
    slug: "ester-oil",
    name: "Ester-Basisöl (synthetisch)",
    shortName: "Ester",
    category: "BASE_OIL_ESTER" as const,
    functionInFluid:
      "Polare synthetische Basisflüssigkeit für Hochleistungs-KSS und Bio-Schmierstoffe (PANOLIN, Plantocut). Bessere Schmierung bei dünnen Filmen, biologisch abbaubar.",
    typicalConcentrationPct: 30,
    description:
      "Wirkt auf NBR und FKM stärker quellend als Mineralöl. **PU- und Polyurethan-Dichtungen können durch Hydrolyse beschädigt werden.** Esterspezifische Dichtungen oder HNBR/FKM nutzen.",
    sourceLabel: "Trelleborg Whitepaper Bio-Lubricants",
  },
  {
    slug: "polyalkylene-glycol",
    name: "Polyalkylenglykol (PAG)",
    shortName: "PAG",
    category: "BASE_OIL_PAG" as const,
    casNumbers: ["25322-69-4"],
    functionInFluid: "Synthetische wassermischbare Hydraulikflüssigkeit (HFC, HFD-U), Kompressoröl.",
    typicalConcentrationPct: 80,
    description:
      "**Mit Mineralöl-Schmierstoffen nicht mischbar — Werkstoff-Verträglichkeit anders!** Greift Polyurethan an. NBR meist OK, FKM Standard OK.",
    sourceLabel: "ISM Chart 'Hydraulic Oil Synthetic PAG'",
  },
  {
    slug: "phosphate-ester",
    name: "Phosphat-Ester (HFD-R Hydraulikflüssigkeit)",
    shortName: "Phosphat-Ester",
    category: "EP_ADDITIVE_P" as const,
    casNumbers: ["1241-94-7"],
    functionInFluid: "Schwer-entflammbare Hydraulikflüssigkeit (HFD-R), z.B. in Turbinen, Gießereien.",
    typicalConcentrationPct: 95,
    description:
      "**Greift NBR und Polyurethan stark an. Standard-Hydraulikdichtungen versagen.** Nutzt EPDM oder spezielles FKM/FFKM.",
    sourceLabel: "Parker Handbook, ISM Chart",
  },
  // Borsäure / Borate (Korrosionsinhibitor)
  {
    slug: "boric-acid",
    name: "Borsäure",
    shortName: "B(OH)₃",
    category: "BORATE" as const,
    casNumbers: ["10043-35-3"],
    functionInFluid: "Korrosionsinhibitor, pH-Puffer in wassermischbaren KSS. Häufig in Aminborat-Komplexen.",
    typicalConcentrationPct: 2,
    description:
      "Seit 2010 als reproduktionstoxisch eingestuft (SVHC-Kandidat). Materialverträglichkeit überwiegend gut — nur Polyurethan (D).",
    isSvhc: true,
    sourceLabel: "ECHA SVHC-Liste, ISM Chart",
  },
  {
    slug: "borate-salt",
    name: "Borate (Borax, Perborat)",
    shortName: "Borate",
    category: "BORATE" as const,
    casNumbers: ["1303-96-4", "1310-58-3"],
    functionInFluid: "Korrosionsschutz, Alkalisierung, Bestandteil von Aminborat-Korrosionsinhibitoren.",
    typicalConcentrationPct: 3,
    description: "Wie Borsäure — meist verträglich, kritisch nur für Polyurethan.",
    isSvhc: true,
    sourceLabel: "ECHA SVHC, ISM Chart",
  },
  // EP-Additive
  {
    slug: "chlorinated-paraffin",
    name: "Chlorparaffine (SCCP/MCCP)",
    shortName: "Cl-Paraffine",
    category: "EP_ADDITIVE_CL" as const,
    casNumbers: ["85535-84-8", "85535-85-9"],
    functionInFluid: "Hochdruck-/Extremdruck-Additiv in Schneidölen, Umformölen. Heute durch S/P-Additive ersetzt.",
    typicalConcentrationPct: 20,
    description:
      "SCCP seit 2017 verboten (Stockholm-Konvention). MCCP eingeschränkt. Quellt NBR moderat, FKM verträgt sie gut.",
    isSvhc: true,
    sourceLabel: "Stockholm-Konvention, EPA",
  },
  {
    slug: "sulfur-ep",
    name: "Schwefelträger (aktiv/inaktiv)",
    shortName: "S-EP",
    category: "EP_ADDITIVE_S" as const,
    functionInFluid: "EP-/AW-Additiv für Reibungsschutz unter Hochlast (Schneidöle, Getriebeöle).",
    typicalConcentrationPct: 8,
    description:
      "Aktiver Schwefel verfärbt Buntmetall — wichtig für Anlagenauswahl. Materialwirkung auf Dichtungen meist unkritisch.",
    sourceLabel: "Lubrizol-Datenblätter",
  },
  // Glykolether
  {
    slug: "butyl-glycol",
    name: "Butylglykol (Ethylenglykolmonobutylether)",
    shortName: "BGE",
    category: "GLYCOL_ETHER" as const,
    casNumbers: ["111-76-2"],
    functionInFluid: "Co-Solvens für Tensid-Mischungen in KSS, Reinigern. Lösungsvermittler.",
    typicalConcentrationPct: 5,
    description: "Polare Flüssigkeit — quillt NBR stark (D), FKM gut beständig (A), EPDM mässig.",
    sourceLabel: "ISM Chart",
  },
  // Tensid
  {
    slug: "anionic-surfactant",
    name: "Anionisches Tensid (Sulfonate)",
    shortName: "Sulfonate",
    category: "EMULSIFIER" as const,
    functionInFluid: "Emulgator für wassermischbare KSS, hält Mineralöl in Wasser stabil dispergiert.",
    typicalConcentrationPct: 15,
    description:
      "Tenside selbst nicht aggressiv, können aber bei PE/PP Stress-Cracking bewirken. Bei sehr hoher Dosis Quellung von NBR möglich.",
    sourceLabel: "BASF Tensid-Datenblatt",
  },
  // Mineralien Wasser (Trägerphase)
  {
    slug: "water-hot",
    name: "Wasser (Trägerphase, > 60°C)",
    shortName: "H₂O (heiß)",
    category: "WATER" as const,
    functionInFluid: "Hauptphase wassermischbarer KSS (90-95% beim Gebrauch). Bei Erwärmung im Bearbeitungsspalt > 60°C lokal.",
    typicalConcentrationPct: 93,
    description:
      "EPDM und Silikon top, FKM-Standard nur < 100°C, NBR moderat, Polyurethan hydrolysiert (D). PA/POM Hydrolyse-empfindlich.",
    sourceLabel: "Allgemein bekannt",
  },
  {
    slug: "carboxylic-acid",
    name: "Carbonsäuren (Korrosionsinhibitor)",
    shortName: "Carbonsäuren",
    category: "CORROSION_INHIBITOR" as const,
    functionInFluid: "Eisen-/Nichteisen-Korrosionsschutz: Capryl-/Sebacin-/Azelainsäure, im Aminborat-Komplex.",
    typicalConcentrationPct: 5,
    description: "Schwache organische Säuren — meist verträglich. Bei pH < 7 kritisch für Polyurethan.",
    sourceLabel: "Lubrizol Vanlube-Reihe",
  },
  {
    slug: "btn-mbt-tolyltriazole",
    name: "Triazol-Korrosionsinhibitoren (BTA, TTA)",
    shortName: "BTA/TTA",
    category: "CORROSION_INHIBITOR" as const,
    casNumbers: ["95-14-7", "29385-43-1"],
    functionInFluid:
      "Buntmetall-Schutz (Kupfer/Messing) in KSS und Hydraulikölen. Selektiver Film auf Cu-Oberflächen.",
    typicalConcentrationPct: 0.1,
    description: "Sehr niedrige Dosierung, materialverträglich.",
    sourceLabel: "BASF Cobratec Datenblatt",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 3) Verträglichkeits-Matrix (Ingredient × Material)
// ────────────────────────────────────────────────────────────────────────────
// Rating-Mapping: A→COMPATIBLE/RECOMMENDED, B→COMPATIBLE, C→CAUTION, D→UNSUITABLE
// Daten aus ISM Chart (2018) + Trelleborg + Parker Handbook.

type RatingABCD = "A" | "B" | "C" | "D";
type Compat = { rating: RatingABCD; effect?: string; swellMin?: number; swellMax?: number; note: string; src?: string };

function r(rating: RatingABCD, note: string, opts: Partial<Compat> = {}): Compat {
  return { rating, note, ...opts };
}

// Matrix[ingredientSlug][materialSlug] = Bewertung
const MATRIX: Record<string, Record<string, Compat>> = {
  // ═══ Amine ═══
  monoethanolamine: {
    "nbr": r("D", "Monoethanolamin greift NBR-Vernetzungsnetz an, führt zu Versprödung und Rissbildung. Wechseln Sie auf EPDM oder FFKM.", { effect: "ATTACK_NETWORK" }),
    "hnbr": r("D", "Wie NBR — Amin-Empfindlichkeit bleibt erhalten.", { effect: "ATTACK_NETWORK" }),
    "epdm": r("B", "EPDM verträgt Amine gut — bevorzugter Werkstoff in aminhaltigen KSS-Hydrauliken (sofern wenig Mineralöl).", { effect: "NONE" }),
    "fkm": r("D", "Standard-FKM (bisphenolisch) wird durch MEA abgebaut. Peroxidisch vernetztes FKM oder FFKM verwenden.", { effect: "ATTACK_NETWORK", src: "Parker Handbook" }),
    "fkm-peroxide": r("C", "Peroxidisch vernetztes FKM verträgt Amine besser, aber Langzeit-Exposition prüfen.", { effect: "SWELLING" }),
    "ffkm": r("A", "FFKM ist gegen Amine universell beständig.", { effect: "NONE" }),
    "silicone-vmq": r("B", "Silikon verträgt MEA gut.", { effect: "NONE" }),
    "polyurethane": r("D", "PU hydrolysiert in Aminen schnell — totaler Verlust der Festigkeit.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "PTFE ist inert.", { effect: "NONE" }),
    "pa6": r("C", "PA kann durch Amine bei erhöhter Temperatur erweicht werden.", { effect: "SWELLING" }),
    "pom": r("D", "Stark alkalische aminhaltige Medien hydrolysieren POM.", { effect: "ATTACK_NETWORK" }),
  },
  triethanolamine: {
    "nbr": r("C", "TEA milder als MEA, aber Langzeit-Versprödung trotzdem zu erwarten.", { effect: "HARDENING" }),
    "hnbr": r("C", "Wie NBR — mildere Schädigung als MEA.", { effect: "HARDENING" }),
    "epdm": r("A", "EPDM verträgt TEA hervorragend.", { effect: "NONE" }),
    "fkm": r("C", "Standard-FKM mit TEA: moderate Quellung bei T > 80°C.", { effect: "SWELLING", swellMin: 5, swellMax: 15 }),
    "fkm-peroxide": r("B", "Peroxidisch vernetztes FKM gut beständig.", { effect: "NONE" }),
    "ffkm": r("A", "Universalbeständig.", { effect: "NONE" }),
    "silicone-vmq": r("B", "Silikon verträgt TEA.", { effect: "NONE" }),
    "polyurethane": r("D", "Hydrolyse-Problem bleibt.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  diethanolamine: {
    "nbr": r("D", "Wie MEA — Amin-Schädigung. Zusätzlich Nitrosamin-Risiko mit Nitriten in KSS.", { effect: "ATTACK_NETWORK" }),
    "epdm": r("B", "EPDM verträgt DEA gut.", { effect: "NONE" }),
    "fkm": r("C", "Mässige Quellung.", { effect: "SWELLING" }),
    "ffkm": r("A", "Inert.", { effect: "NONE" }),
    "polyurethane": r("D", "Hydrolyse.", { effect: "ATTACK_NETWORK" }),
  },
  morpholine: {
    "nbr": r("D", "Morpholin als sekundäres zyklisches Amin greift NBR stark an.", { effect: "ATTACK_NETWORK" }),
    "epdm": r("B", "EPDM resistant.", { effect: "NONE" }),
    "fkm": r("C", "Mässige Schädigung.", { effect: "SWELLING" }),
    "ffkm": r("A", "Inert.", { effect: "NONE" }),
    "polyurethane": r("D", "Hydrolyse.", { effect: "ATTACK_NETWORK" }),
  },
  // ═══ Mineralöl ═══
  "mineral-oil": {
    "nbr": r("A", "Standard-Anwendung — NBR wurde für Mineralöl entwickelt.", { effect: "NONE" }),
    "hnbr": r("A", "Wie NBR, mit besserer Hitzebeständigkeit.", { effect: "NONE" }),
    "epdm": r("D", "EPDM quillt in Mineralöl > 100% — totaler Materialverlust.", { effect: "SWELLING", swellMin: 80, swellMax: 200 }),
    "fkm": r("A", "FKM hervorragend in Mineralöl.", { effect: "NONE" }),
    "ffkm": r("A", "Universalbeständig.", { effect: "NONE" }),
    "silicone-vmq": r("C", "Silikon quillt in unpolaren Mineralölen.", { effect: "SWELLING", swellMin: 20, swellMax: 40 }),
    "polyurethane": r("A", "PU verträgt Mineralöl exzellent — Standard für Hydraulik-Stangendichtungen.", { effect: "NONE" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
    "pp": r("C", "Polypropylen quillt in Kohlenwasserstoffen.", { effect: "SWELLING" }),
    "pe-hd": r("C", "Wie PP — Quellung möglich.", { effect: "SWELLING" }),
  },
  "ester-oil": {
    "nbr": r("C", "Ester-Öle quellen NBR stärker als Mineralöl. Hoher ACN-NBR oder HNBR verwenden.", { effect: "SWELLING", swellMin: 10, swellMax: 25 }),
    "hnbr": r("B", "HNBR robuster gegen Ester-Quellung.", { effect: "SWELLING", swellMin: 5, swellMax: 15 }),
    "epdm": r("C", "EPDM quillt in Estern moderat — besser als in Mineralöl, aber Vorsicht.", { effect: "SWELLING" }),
    "fkm": r("A", "FKM ist Standard für Ester-Schmierstoffe.", { effect: "NONE" }),
    "ffkm": r("A", "Universalbeständig.", { effect: "NONE" }),
    "polyurethane": r("D", "Ester hydrolysieren PU.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "polyalkylene-glycol": {
    "nbr": r("B", "NBR mit PAG meist verträglich.", { effect: "NONE" }),
    "epdm": r("A", "EPDM ideal für PAG-basierte HFC-Hydraulikflüssigkeit.", { effect: "NONE" }),
    "fkm": r("B", "FKM Standard verträgt PAG, prüfen bei T > 100°C.", { effect: "NONE" }),
    "polyurethane": r("D", "PAG greift PU an — bei HFC-Hydraulik PU-Dichtungen NICHT verwenden.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "phosphate-ester": {
    "nbr": r("D", "Phosphat-Ester (HFD-R) zerstören NBR — Standardproblem bei Umstellung Mineralöl → HFD.", { effect: "ATTACK_NETWORK", src: "Parker" }),
    "epdm": r("A", "EPDM ist der empfohlene Werkstoff für Phosphat-Ester-Hydraulik.", { effect: "NONE" }),
    "fkm": r("C", "FKM-Standard mässig in Phosphat-Ester. Spezielle FKM-Compounds verfügbar.", { effect: "SWELLING" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "polyurethane": r("D", "PU greift an.", { effect: "ATTACK_NETWORK" }),
  },
  // ═══ Borsäure / Borate ═══
  "boric-acid": {
    "nbr": r("A", "Borsäure verträglich mit NBR.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "silicone-vmq": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("D", "Borsäure hydrolysiert PU bei höherer Konzentration und Temperatur.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "borate-salt": {
    "nbr": r("A", "Borate verträglich.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("C", "Bei hoher Konzentration / pH > 9 Hydrolyse möglich.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  // ═══ Biozide / Formaldehyd ═══
  bronopol: {
    "nbr": r("C", "Bei Langzeitexposition Versprödung durch Formaldehyd-Freisetzung.", { effect: "HARDENING" }),
    "epdm": r("B", "EPDM relativ resistent.", { effect: "NONE" }),
    "fkm": r("B", "FKM verträgt Formaldehyd-Donatoren.", { effect: "NONE" }),
    "polyurethane": r("D", "PU-Versprödung durch Formaldehyd.", { effect: "EMBRITTLEMENT" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "hexahydro-triazine": {
    "nbr": r("C", "Triazin/Grotan: Langzeit-Versprödung NBR.", { effect: "HARDENING" }),
    "epdm": r("B", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("C", "Mässig.", { effect: "HARDENING" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "dmdm-hydantoin": {
    "nbr": r("C", "Langzeit-Versprödung.", { effect: "HARDENING" }),
    "epdm": r("B", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("D", "PU-Versprödung.", { effect: "EMBRITTLEMENT" }),
  },
  "mit-bit-isothiazolinones": {
    "nbr": r("B", "Niedrige Konzentration, materialverträglich.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("B", "Materialverträglich, aber Hauptrisiko Hautsensibilisierung Operator.", { effect: "NONE" }),
  },
  // ═══ EP-Additive ═══
  "chlorinated-paraffin": {
    "nbr": r("B", "NBR verträgt Chlorparaffine gut.", { effect: "SWELLING", swellMin: 3, swellMax: 8 }),
    "epdm": r("D", "EPDM quillt stark.", { effect: "SWELLING" }),
    "fkm": r("A", "FKM hervorragend.", { effect: "NONE" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "polyurethane": r("B", "PU verträglich.", { effect: "NONE" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  "sulfur-ep": {
    "nbr": r("A", "Schwefelträger sind dichtungsverträglich.", { effect: "NONE" }),
    "epdm": r("C", "Mässig — abhängig von Trägeröl.", { effect: "SWELLING" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  // ═══ Glykolether ═══
  "butyl-glycol": {
    "nbr": r("D", "Butylglykol quellt NBR stark.", { effect: "SWELLING", swellMin: 30, swellMax: 60 }),
    "epdm": r("B", "EPDM verträglich.", { effect: "NONE" }),
    "fkm": r("A", "FKM gut.", { effect: "NONE" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "polyurethane": r("C", "Mässige Quellung.", { effect: "SWELLING" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
  // ═══ Tensid ═══
  "anionic-surfactant": {
    "nbr": r("B", "Bei normaler Dosierung verträglich.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("B", "Verträglich.", { effect: "NONE" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
    "pp": r("C", "Stress-Cracking-Risiko bei hoher Tensid-Konzentration und mechanischer Spannung.", { effect: "EMBRITTLEMENT" }),
    "pe-hd": r("C", "Wie PP — Stress-Cracking.", { effect: "EMBRITTLEMENT" }),
  },
  // ═══ Wasser heiß ═══
  "water-hot": {
    "nbr": r("B", "NBR < 80°C OK, darüber Hydrolyse-Tendenz.", { effect: "HARDENING" }),
    "hnbr": r("A", "HNBR robust bis 150°C.", { effect: "NONE" }),
    "epdm": r("A", "EPDM ist Standard für Heißwasser/Dampf bis 150°C.", { effect: "NONE" }),
    "fkm": r("D", "Standard-FKM (bisphenolisch) versagt > 100°C in Heißwasser.", { effect: "ATTACK_NETWORK", src: "O-Ring Prüflabor Richter" }),
    "fkm-peroxide": r("A", "Peroxidisch vernetztes FKM verträgt Heißwasser bis 200°C.", { effect: "NONE" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "silicone-vmq": r("A", "Top für Heißwasser/Dampf.", { effect: "NONE" }),
    "polyurethane": r("D", "PU hydrolysiert irreversibel in heißem Wasser — innerhalb Wochen Totalverlust.", { effect: "ATTACK_NETWORK" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
    "pa6": r("D", "PA hydrolysiert — Versprödung.", { effect: "EMBRITTLEMENT" }),
    "pom": r("D", "POM hydrolysiert bei pH > 9.", { effect: "ATTACK_NETWORK" }),
    "pp": r("A", "PP top.", { effect: "NONE" }),
    "pe-hd": r("A", "PE-HD top.", { effect: "NONE" }),
  },
  // ═══ Korrosionsinhibitoren ═══
  "carboxylic-acid": {
    "nbr": r("B", "Schwache organische Säuren verträglich.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("C", "FKM mässig — niedermolekulare Säuren können quellen.", { effect: "SWELLING" }),
    "ffkm": r("A", "Universal.", { effect: "NONE" }),
    "polyurethane": r("C", "Bei pH < 7 PU-Hydrolyse möglich.", { effect: "ATTACK_NETWORK" }),
  },
  "btn-mbt-tolyltriazole": {
    "nbr": r("A", "Niedrige Konzentration, verträglich.", { effect: "NONE" }),
    "epdm": r("A", "Verträglich.", { effect: "NONE" }),
    "fkm": r("A", "Verträglich.", { effect: "NONE" }),
    "polyurethane": r("A", "Verträglich.", { effect: "NONE" }),
    "ptfe": r("A", "Inert.", { effect: "NONE" }),
  },
};

// ────────────────────────────────────────────────────────────────────────────
// 4) Seeder
// ────────────────────────────────────────────────────────────────────────────
function mapRating(r: RatingABCD) {
  switch (r) {
    case "A":
      return "RECOMMENDED";
    case "B":
      return "COMPATIBLE";
    case "C":
      return "CAUTION";
    case "D":
      return "UNSUITABLE";
  }
}

function mapEffect(e?: string) {
  if (!e) return undefined;
  if (e === "NONE") return "NONE";
  return e as "SWELLING" | "SHRINKAGE" | "HARDENING" | "EMBRITTLEMENT" | "EXTRACTION" | "ATTACK_NETWORK" | "NONE";
}

async function main() {
  console.log("==> Materials");
  let m_created = 0;
  let m_updated = 0;
  for (const m of MATERIALS) {
    const existing = await prisma.material.findUnique({ where: { slug: m.slug } });
    await prisma.material.upsert({
      where: { slug: m.slug },
      create: m,
      update: m,
    });
    if (existing) m_updated++;
    else m_created++;
  }
  console.log(`    Materials: ${m_created} neu, ${m_updated} aktualisiert`);

  console.log("==> Ingredients");
  let i_created = 0;
  let i_updated = 0;
  for (const i of INGREDIENTS) {
    const existing = await prisma.ingredient.findUnique({ where: { slug: i.slug } });
    await prisma.ingredient.upsert({
      where: { slug: i.slug },
      create: i,
      update: i,
    });
    if (existing) i_updated++;
    else i_created++;
  }
  console.log(`    Ingredients: ${i_created} neu, ${i_updated} aktualisiert`);

  console.log("==> Compatibility matrix");
  // Bestehende Verträglichkeits-Einträge komplett ersetzen — diese sind aus DB-Sicht
  // immer aus der MATRIX-Quelle ableitbar.
  await prisma.ingredientMaterialCompatibility.deleteMany({});

  const materialMap = new Map(
    (await prisma.material.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]),
  );
  const ingredientMap = new Map(
    (await prisma.ingredient.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]),
  );

  let matrixCount = 0;
  for (const [ingredientSlug, materialMap1] of Object.entries(MATRIX)) {
    const ingredientId = ingredientMap.get(ingredientSlug);
    if (!ingredientId) {
      console.warn(`    ! Unknown ingredient slug: ${ingredientSlug}`);
      continue;
    }
    for (const [materialSlug, compat] of Object.entries(materialMap1)) {
      const materialId = materialMap.get(materialSlug);
      if (!materialId) {
        console.warn(`    ! Unknown material slug: ${materialSlug}`);
        continue;
      }
      await prisma.ingredientMaterialCompatibility.create({
        data: {
          ingredientId,
          materialId,
          rating: mapRating(compat.rating) as "RECOMMENDED" | "COMPATIBLE" | "CAUTION" | "UNSUITABLE",
          effectType: mapEffect(compat.effect),
          swellPctMin: compat.swellMin,
          swellPctMax: compat.swellMax,
          note: compat.note,
          sourceLabel: compat.src ?? "ISM Compatibility Chart (Dec 2018)",
          sourceUrl: "https://www.industrialspec.com/images/files/elastomers-chemical-compatibility-chart-from-ism.pdf",
          confidence: "indikativ",
        },
      });
      matrixCount++;
    }
  }
  console.log(`    Compatibility-Pairs: ${matrixCount}`);

  const totalI = await prisma.ingredient.count();
  const totalM = await prisma.material.count();
  const totalC = await prisma.ingredientMaterialCompatibility.count();
  console.log(`\nFertig. DB-Stand: ${totalM} Materialien, ${totalI} Inhaltsstoffe, ${totalC} Verträglichkeits-Pairs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
