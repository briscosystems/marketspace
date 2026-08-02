/**
 * Produkt-Erweiterung 2026-08-02: unterversorgte Produktgruppen auffüllen —
 * 15 Gleitbahnöle (SLIDEWAY_OIL), 14 Umform-/Drahtziehprodukte (FORMING_OIL),
 * 14 Additive/Systempflege (ADDITIVE). Alle Daten von Hersteller-Websites
 * verifiziert (Web-Recherche 2026-08-02), inkl. TDS-/SDS-Links wo auffindbar.
 *
 * IDEMPOTENT: Upsert über (manufacturerId, slug) — läuft gefahrlos bei jedem
 * Deploy. Legt KEINE Hersteller an (alle 16 existieren bereits) und
 * überschreibt keine bestehenden Produkte mit gleichem Slug.
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import type { ProductCategory } from "@prisma/client";

type NeuProdukt = {
  manufacturer: string;
  name: string;
  productFamily: string | null;
  category: ProductCategory;
  viscosityIso: string | null;
  viscosityKv40: number | null;
  densityGcm3: number | null;
  flashpointC: number | null;
  description: string;
  applicationAreas: string[];
  suitableMaterials: string[];
  certifications: string[];
  sourceUrl: string | null;
  dataSheetUrl: string | null;
  sdsUrl: string | null;
};

const PRODUKTE: NeuProdukt[] = [
  {
    "manufacturer": "Mobil",
    "name": "Mobil Vactra Oil No. 1",
    "productFamily": "Vactra",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "32",
    "viscosityKv40": 32,
    "densityGcm3": null,
    "flashpointC": 216,
    "description": "Premium-Gleitbahnöl der ISO VG 32 für horizontale Gleitbahnen an kleinen bis mittleren Werkzeugmaschinen. Kontrollierte Reibeigenschaften auf Stahl/Stahl- und Stahl/Kunststoff-Paarungen reduzieren Stick-Slip und Rattern. Gute Verträglichkeit und Abscheidung gegenüber wassergemischten Kühlschmierstoffen sowie Korrosionsschutz.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen",
      "Umlaufschmierung"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kunststoffbeschichtete Führungen"
    ],
    "certifications": [
      "Fives Cincinnati P-53"
    ],
    "sourceUrl": "https://www.mobil.com/en/sap/lubricants/product-series/mobil-vactra-oil-numbered-series",
    "dataSheetUrl": "https://www.mobil.com/en-us/industrial/pds/gl-xx-mobil-vactra-oil-numbered-series",
    "sdsUrl": null
  },
  {
    "manufacturer": "Mobil",
    "name": "Mobil Vactra Oil No. 2",
    "productFamily": "Vactra",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": null,
    "flashpointC": 228,
    "description": "Der Industriestandard unter den Bettbahnölen (ISO VG 68) für horizontale Gleitbahnen an kleinen bis mittleren Werkzeugmaschinen. Ausgewogenes Additivpaket für kontrollierte Reibung, sehr gute Abscheidung von wassergemischten Kühlschmierstoffen und zuverlässigen Korrosionsschutz. Reduziert Stick-Slip auf vielen Bahnwerkstoffen inkl. Stahl auf Polymer; auch als Hydrauliköl für moderate Anforderungen einsetzbar.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen",
      "Hydraulik (moderat)",
      "Umlaufschmierung"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kunststoffbeschichtete Führungen"
    ],
    "certifications": [
      "Fives Cincinnati P-47"
    ],
    "sourceUrl": "https://www.mobil.com/en/lubricants/for-businesses/industrial/lubricants/products/products/mobil-vactra-oil-no-2",
    "dataSheetUrl": "https://www.mobil.com/en-us/industrial/pds/gl-xx-mobil-vactra-oil-numbered-series",
    "sdsUrl": null
  },
  {
    "manufacturer": "Mobil",
    "name": "Mobil Vactra Oil No. 4",
    "productFamily": "Vactra",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "220",
    "viscosityKv40": 221,
    "densityGcm3": null,
    "flashpointC": 240,
    "description": "Hochviskoses Gleitbahnöl (ISO VG 220) für große Werkzeugmaschinen mit hohen Flächenpressungen sowie für vertikale und geneigte Bahnen. Sehr gute Haftung verhindert Ablaufen von senkrechten Führungen; reduziert Stick-Slip für hohe Positioniergenauigkeit. Gute Abscheidung gegenüber wassergemischten Kühlschmierstoffen.",
    "applicationAreas": [
      "Gleitbahnen",
      "Vertikale Führungen",
      "Großwerkzeugmaschinen"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kunststoffbeschichtete Führungen"
    ],
    "certifications": [
      "Fives Cincinnati P-50"
    ],
    "sourceUrl": "https://www.mobil.com/en/sap/lubricants/product-series/mobil-vactra-oil-numbered-series",
    "dataSheetUrl": "https://www.mobil.com/en-us/industrial/pds/gl-xx-mobil-vactra-oil-numbered-series",
    "sdsUrl": null
  },
  {
    "manufacturer": "Castrol",
    "name": "Castrol Magnaglide D 68",
    "productFamily": "Magnaglide D / Magna SW D",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": 0.88,
    "flashpointC": 232,
    "description": "Gleitbahnöl vom Typ CGLP auf Basis hochraffinierter Mineralöle mit Oiliness- und EP-Additiven sowie Haftvermittler. Überwindet Stick-Slip bei langsam bewegten Maschinenteilen und eignet sich für horizontale und vertikale Gleitbahnen, wo ein gut demulgierendes Öl gefordert ist. Typische Einsätze: Hobel-, Schleif-, Bohr- und Fräsmaschinen. Wird von Castrol heute auch unter dem Namen Magna SW D geführt.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [],
    "certifications": [
      "DIN 51502 CGLP",
      "Cincinnati Lamb P-47",
      "DIN 51524-2"
    ],
    "sourceUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/53AC56A6A08A16BD802585CA004E175D/$File/wepp-bsr4pk.pdf",
    "dataSheetUrl": "http://www.salube.net/downloads/tds/magnaglide-d68-slideway-oil.pdf",
    "sdsUrl": "https://hascooil.com/wp-content/uploads/2016/11/Magnaglide-D-68-sds.pdf"
  },
  {
    "manufacturer": "Castrol",
    "name": "Castrol Magnaglide D 220",
    "productFamily": "Magnaglide D / Magna SW D",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "220",
    "viscosityKv40": 220,
    "densityGcm3": 0.89,
    "flashpointC": 249,
    "description": "Hochviskoses Gleitbahnöl (ISO VG 220) der Magnaglide-D-Reihe für stark belastete, insbesondere vertikale Gleit- und Führungsbahnen. Haftfähig und demulgierend, mit Oiliness- und EP-Additiven gegen Stick-Slip bei langsamen Verfahrbewegungen. Für Werkzeugmaschinen wie Hobel-, Bohr- und Fräswerke.",
    "applicationAreas": [
      "Gleitbahnen",
      "Vertikale Führungen",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [],
    "certifications": [
      "DIN 51502 CGLP",
      "Cincinnati Lamb P-50"
    ],
    "sourceUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/53AC56A6A08A16BD802585CA004E175D/$File/wepp-bsr4pk.pdf",
    "dataSheetUrl": "http://www.salube.net/downloads/tds/magnaglide-d68-slideway-oil.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Fuchs",
    "name": "RENEP CGLP 68",
    "productFamily": "RENEP CGLP",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": 0.879,
    "flashpointC": null,
    "description": "Universell einsetzbares Bettbahnöl nach DIN 51502 (CGLP) für Werkzeugmaschinen, besonders mit kunststoffbeschichteten Führungen. Sehr gutes Demulgierverhalten und ausgezeichnete chemische Verträglichkeit mit wassermischbaren Kühlschmierstoffen (u. a. ECOCOOL), extrem niedrige Reibwerte gegen Stick-Slip. Auch als Hydraulik-, Getriebe- und Umlauföl verwendbar; HELLER-Freigabe.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Linearführungen",
      "Werkzeugmaschinen",
      "Hydraulik"
    ],
    "suitableMaterials": [
      "Kunststoffbeschichtete Führungen",
      "Grauguss/Stahl"
    ],
    "certifications": [
      "DIN 51502 CGLP",
      "HELLER-Freigabe"
    ],
    "sourceUrl": "https://www.fuchs.com/de/en/product/product/148739-RENEP-CGLP-68/",
    "dataSheetUrl": "https://www.fuchs.com/fileadmin/in/Company/FUCHS-RENEP-Slideway-Oils.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Fuchs",
    "name": "RENEP CGLP 220",
    "productFamily": "RENEP CGLP",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "220",
    "viscosityKv40": 220,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Hochviskoses Bettbahnöl (ISO VG 220) der RENEP-CGLP-Reihe für stark belastete, auch vertikale Gleit- und Führungsbahnen an Werkzeugmaschinen. Demulgierend, mit Reibwertverbesserern und EP-Additiven gegen Stick-Slip; sehr gute Verträglichkeit mit wassermischbaren Kühlschmierstoffen. Guter Korrosions- und Verschleißschutz.",
    "applicationAreas": [
      "Gleitbahnen",
      "Vertikale Führungen",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [
      "Kunststoffbeschichtete Führungen",
      "Grauguss/Stahl"
    ],
    "certifications": [
      "DIN 51502 CGLP"
    ],
    "sourceUrl": "https://www.fuchs.com/de/en/product/product/148737-RENEP-CGLP-220/",
    "dataSheetUrl": "https://www.fuchs.com/fileadmin/in/Company/FUCHS-RENEP-Slideway-Oils.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Shell",
    "name": "Shell Tonna S3 M 68",
    "productFamily": "Tonna",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": 0.879,
    "flashpointC": 225,
    "description": "Premium-Gleitbahnöl für Schlitten, Tische und Vorschubmechanismen von Werkzeugmaschinen, speziell gegen Stick-Slip bei langsamen Bewegungen entwickelt. Haftet gut auf der Bahn, widersteht dem Abwaschen durch Kühlschmierstoffe und trennt sich leicht von wassermischbaren KSS (Abskimmen möglich). Auch für kombinierte Hydraulik-/Bahnschmiersysteme sowie Getriebe geeignet.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen",
      "Kombinierte Hydraulik-/Bahnschmierung",
      "Getriebe"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kunststoffbeschichtete Führungen"
    ],
    "certifications": [
      "MAG IAS (Cincinnati Machine) P-47",
      "ISO 19378 / ISO 6743-13 GA und GB",
      "DIN 51517-3 CLP",
      "ISO 11158 / ISO 6743-4 HM und HG",
      "ISO 12925-1 CKC"
    ],
    "sourceUrl": "https://www.shell.us/business/fuels-and-lubricants/lubricants-for-business/products/shell-tonna-slideways-oils.html",
    "dataSheetUrl": "https://hand.net.pl/wp-content/uploads/2014/02/GPCDOC_GTDS_Shell_Tonna_S3_M_68_en_TDS.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Shell",
    "name": "Shell Tonna S3 M 220",
    "productFamily": "Tonna",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "220",
    "viscosityKv40": 220,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Hochviskoses Gleitbahnöl (ISO VG 220) der Tonna-S3-M-Reihe, laut Shell für vertikale Gleitbahnen vorgesehen. Erhöhte Haftfähigkeit und Stick-Slip-Verhalten für präzise Positionierung; trennt sich gut von wassermischbaren Kühlschmierstoffen und schützt vor Korrosion und Verschleiß.",
    "applicationAreas": [
      "Gleitbahnen",
      "Vertikale Führungen",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kunststoffbeschichtete Führungen"
    ],
    "certifications": [
      "MAG IAS (Cincinnati Machine) P-50",
      "ISO 6743-13 GA und GB",
      "DIN 51517-3 CLP"
    ],
    "sourceUrl": "https://www.shell.us/business/fuels-and-lubricants/lubricants-for-business/products/shell-tonna-slideways-oils.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "TotalEnergies",
    "name": "DROSERA MS 68",
    "productFamily": "Drosera MS",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": 0.885,
    "flashpointC": 240,
    "description": "Zinkfreies, multifunktionales Werkzeugmaschinenöl, das Gleitbahnen, Spindeln, Hydraulik und Getriebe mit einem Öl abdeckt. Ausgezeichnete EP- und Anti-Stick-Slip-Eigenschaften, sehr niedriger Reibungskoeffizient, gute Filtrierbarkeit sowie Schutz gegen Rost und Verschleiß. Erfüllt DIN 51502 CGLP und ISO 6743-13 GA.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Hydraulik",
      "Getriebe",
      "Spindeln",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [],
    "certifications": [
      "DIN 51502 CGLP 68",
      "ISO 6743-13 GA 68",
      "ISO 6743-4 HG",
      "DIN 51517-3 CLP"
    ],
    "sourceUrl": "https://lubricants.catalog.totalenergies.com/catalog-us/en_UK/316_drosera-ms-68",
    "dataSheetUrl": "https://www.permausa.com/_Resources/Lubricants/Total/DROSERA_MS_TDS_en.pdf",
    "sdsUrl": "https://rilcoinc.com/wp-content/uploads/2020/01/drosera-ms-68-sds-apr-2015.pdf"
  },
  {
    "manufacturer": "Klüber Lubrication",
    "name": "LAMORA D 68",
    "productFamily": "LAMORA D",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Bettbahnöl für Gleit- und Führungsbahnen an Bearbeitungszentren, Fräs- und Drehmaschinen, besonders bewährt bei kunststoffbeschichteten Bahnen und niedrigen Vorschubgeschwindigkeiten. Sehr gutes Benetzungs- und Haftvermögen, ermöglicht stick-slip-freien Lauf. Gutes Demulgierverhalten bei Kontakt mit wassermischbaren Kühlschmierstoffen.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Bearbeitungszentren",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [
      "Kunststoffbeschichtete Führungen",
      "Grauguss/Stahl"
    ],
    "certifications": [
      "ISO 6743-13 GA und GB"
    ],
    "sourceUrl": "https://www.klueber.com/us/en/products-service/products/lamora-d-68/9957/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Motorex",
    "name": "SUPERGLISS 68 K",
    "productFamily": "Supergliss K",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 67,
    "densityGcm3": 0.88,
    "flashpointC": 226,
    "description": "Chlorfreies Schweizer Gleitbahnöl für horizontale und vertikale Führungen mit und ohne Kunststoffbeschichtung; bildet einen druckfesten, haftenden Schmierfilm ohne Tropfenbildung, ideal auch an senkrechten Bahnen. Reduziert Stick-Slip und bietet sehr gutes Demulgiervermögen sowie optimale Verträglichkeit mit wassermischbaren Kühlschmierstoffen. Sehr guter Korrosions- und Verschleißschutz.",
    "applicationAreas": [
      "Gleitbahnen",
      "Vertikale Führungen",
      "Führungen",
      "Werkzeugmaschinentische"
    ],
    "suitableMaterials": [
      "Kunststoffbeschichtete Führungen",
      "Grauguss/Stahl"
    ],
    "certifications": [],
    "sourceUrl": "https://motorex.com/en-us/supergliss-68-k--34614",
    "dataSheetUrl": "https://motorex.com/Pdf/TI/Motorex/Gleitbahnenoel/SUPERGLISS-68-K/SUPERGLISS-68-K_1017072_EN_20240131-085644.pdf",
    "sdsUrl": "https://www.motorexoil.com.au/wp-content/uploads/2024/05/MSDS_SUPERGLISS_68_K_EN_AU.pdf"
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Divinol T 7 EP ISO 68",
    "productFamily": "Divinol T EP",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Führungs- und Gleitbahnöl für Werkzeugmaschinen, einsetzbar mit öligen und wassermischbaren Kühlschmierstoffen. Sehr niedrige Haft- und Gleitreibwerte für leichtgängige Schlittenbewegung auch nach längerem Stillstand; ausgezeichnetes Haft- und Ablaufverhalten. Sehr gutes Demulgierverhalten — Gemische aus Emulsion und Bettbahnöl trennen sich schnell; optimal abgestimmt auf die ZUBORA-KSS von Zeller+Gmelin.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.zeller-gmelin.de/zgSite/de/Industrieschmierstoffe/Maschinenschmierung/F%C3%BChrungs--und-Gleitbahn%C3%B6le/Divinol-T-7-EP-ISO-68/p/21660",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Addinol",
    "name": "ADDINOL Gleitbahnöl XG 68",
    "productFamily": "Gleitbahnöl XG",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Gleit- und Bettbahnöl aus hochwertigen Mineralölraffinaten mit aschefreien Spezialadditiven gegen Stick-Slip-Effekte. Ausgezeichnetes Wasserabscheidevermögen, sehr gute Alterungsstabilität und hervorragender Korrosionsschutz. Für horizontale und vertikale Gleitbahnen mittlerer Belastung (Fräs-, Dreh-, Bohr- und Schleifmaschinen) sowie kunststoffbeschichtete Führungen; auch als aschefreies Hydrauliköl einsetzbar.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen",
      "Hydraulik"
    ],
    "suitableMaterials": [
      "Kunststoffbeschichtete Führungen",
      "Grauguss/Stahl"
    ],
    "certifications": [
      "DIN 51502 CGLP",
      "DIN 51517-3 CLP",
      "DIN 51524-2 HLP",
      "ISO 6743-13 GA/GB",
      "ISO 6743-4 HG",
      "ISO 11158 HG"
    ],
    "sourceUrl": "https://addinol.de/en/products/product-finder/addinol-gleitbahnoel-xg-68/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Eni",
    "name": "Eni Exidia HG 68",
    "productFamily": "Exidia HG",
    "category": "SLIDEWAY_OIL",
    "viscosityIso": "68",
    "viscosityKv40": 68,
    "densityGcm3": 0.886,
    "flashpointC": 222,
    "description": "Premium-Gleitbahnöl für hochbelastete Bahnen in Umlauf- und Verlustschmiersystemen mit exzellenten Anti-Stick-Slip-, Verschleißschutz- und Rostschutzeigenschaften. Sehr gute Wasserabscheidung (Demulsibility 25 min bei 54 °C) und verträglich mit Schneidölen; nicht korrosiv gegenüber Eisen, Kupfer und dessen Legierungen. Auch als Hydraulikfluid geeignet, wenn — etwa bei Schleifmaschinen — ein Öl für Führungen und Hydraulik gemeinsam genutzt wird.",
    "applicationAreas": [
      "Gleitbahnen",
      "Führungen",
      "Werkzeugmaschinen",
      "Hydraulik",
      "Schleifmaschinen"
    ],
    "suitableMaterials": [
      "Grauguss/Stahl",
      "Kupferlegierungen"
    ],
    "certifications": [
      "DIN 51502 CGLP",
      "ISO 6743-13 GA und GB",
      "ISO 11158 HG",
      "Stanimuc GA/GB",
      "Deckel"
    ],
    "sourceUrl": "https://oilproducts.eni.com/en_BX/areas/lubricants/industrial-lubricants/slideway-oils/eni-exidia-hg/eni-exidia-hg-68",
    "dataSheetUrl": "https://ligaco.com/assets/eni/files/manager_files/ENI/for_production/hydraulic_oils/mineral_oils/EXIDIA_HG68/ENI%20EXIDIA%20HG%2068.pdf",
    "sdsUrl": "https://alppetro.co.id/dist/assets/files/msds/msds_D22C662FB4D1A823AB10168EE3BE385AS.pdf"
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Multidraw KTL N 20",
    "productFamily": "Multidraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Zieh- und Stanzöl für die spanlose Umformung von Aluminium, Stahl, verzinkten Blechen und höherfesten Stählen bei mittleren bis schweren Umformgraden, überwiegend in der Automobilindustrie. Bietet sehr guten Korrosionsschutz und hohe Alterungsstabilität; Auftrag manuell oder über Rollen-/Sprühbeöler mit ca. 1,5–3 g/m² je nach Umformgrad. Auch als Zusatzbeölung nach Vorbehandlung mit Multidraw PL 61 einsetzbar.",
    "applicationAreas": [
      "Tiefziehen",
      "Stanzen",
      "Blechumformung"
    ],
    "suitableMaterials": [
      "Stahl",
      "Höherfeste Stähle",
      "Verzinkte Bleche",
      "Aluminium"
    ],
    "certifications": [],
    "sourceUrl": "https://zeller-gmelin.de/products/multidraw-ktl-n-20/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Multidraw ALM 250",
    "productFamily": "Multidraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Nicht wassermischbares Spezial-Ziehöl zum Drahtziehen von Aluminium und dessen Legierungen im Grob- und Mittelzug, speziell in Tauchmaschinen. Durch besondere Wirkstoffe zusätzlich sehr gut für das Tiefziehen von Aluminiumblechen geeignet, etwa für Karosserieteile.",
    "applicationAreas": [
      "Drahtziehen",
      "Tiefziehen"
    ],
    "suitableMaterials": [
      "Aluminium",
      "Aluminiumlegierungen"
    ],
    "certifications": [],
    "sourceUrl": "https://zeller-gmelin.de/products/multidraw-alm-250/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Multidraw CU MFE",
    "productFamily": "Multidraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Wassermischbares Nass-Ziehmittel für Kupfer auf Inline-Lackdrahtanlagen im Mittel- und Feinstzugbereich bis 0,07 mm Drahtdurchmesser. Hält die Drahtoberfläche sauber und stört die nachfolgende Lackierung (Emaillierung) nicht; lange Emulsionsstandzeit und kompatibel mit üblicher Papierbandfiltration.",
    "applicationAreas": [
      "Drahtziehen",
      "Feinstdrahtzug",
      "Lackdrahtherstellung"
    ],
    "suitableMaterials": [
      "Kupfer"
    ],
    "certifications": [],
    "sourceUrl": "https://zeller-gmelin.de/en/products/multidraw-cu-mfe/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Multidraw Drylube E 1",
    "productFamily": "Multidraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": 0.867,
    "flashpointC": null,
    "description": "Trockenschmierstoff (Hotmelt) zur Coil-Beschichtung für alle Blechwerkstoffe — Stahl, verzinkte und vorphosphatierte Bleche, Aluminium und Edelstahl. Wird bei ca. 70 °C meist per Elektrostatik-Beöler im Walzwerk aufgetragen und hinterlässt einen grifftrockenen, gleitfähigen Film für schwierige Umformoperationen. Erfüllt die Leistungsvorgaben (VDA) der deutschen Automobilhersteller.",
    "applicationAreas": [
      "Tiefziehen",
      "Blechumformung",
      "Coil-Beschichtung"
    ],
    "suitableMaterials": [
      "Stahl",
      "Verzinkte Bleche",
      "Aluminium",
      "Edelstahl"
    ],
    "certifications": [],
    "sourceUrl": "https://zeller-gmelin.de/en/products/multidraw-drylube-e-1/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Carl Bechem",
    "name": "Berudraw 3955",
    "productFamily": "Berudraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Wassermischbare Ziehpaste auf Basis nativer Ester und Tenside für das Nassziehen von Stahldraht — im Ziehkasten sowie als wässrige Lösung in Tauchziehmaschinen. Mineralölfrei, PFAS-frei, ohne aktive Schwefel- und Chlorverbindungen, ohne Komplexbildner und Silikone; gut abwaschbar.",
    "applicationAreas": [
      "Drahtziehen",
      "Nasszug"
    ],
    "suitableMaterials": [
      "Stahl",
      "NE-Metalle"
    ],
    "certifications": [],
    "sourceUrl": "https://www.bechem.com/de/produkte/umformschmierstoffe/berudraw-3955.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Carl Bechem",
    "name": "Berudraw 2291-1",
    "productFamily": "Berudraw",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Chlor- und schwermetallfreie, wassermischbare Ziehpaste für das Ziehen von Stahldraht. Wird unverdünnt im Einzelzug nach Trägerbeschichtung oder als Seifenlösung im letzten Ziehkasten für Polierzüge eingesetzt. PFAS-frei, gutes Spülverhalten und guter Korrosionsschutz.",
    "applicationAreas": [
      "Drahtziehen",
      "Polierzug"
    ],
    "suitableMaterials": [
      "Stahl",
      "NE-Metalle"
    ],
    "certifications": [],
    "sourceUrl": "https://www.bechem.com/de/produkte/umformschmierstoffe/berudraw-2291-1.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Carl Bechem",
    "name": "Beruforge 100",
    "productFamily": "Beruforge",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": 1.2,
    "flashpointC": null,
    "description": "MoS2-haltiger Beschichtungsschmierstoff (wässrige Festschmierstoff-Suspension) für die Kaltmassivumformung komplexer Bauteile ohne Zinkphosphatierung. Ermöglicht hohe Umformgrade und glatte Bauteiloberflächen; Verdünnung 1:1 bis 1:4, PFAS-frei. Dichte ca. 1,20 g/cm³ bei 20 °C.",
    "applicationAreas": [
      "Kaltmassivumformung",
      "Kaltfließpressen"
    ],
    "suitableMaterials": [
      "Stahl",
      "Edelstahl",
      "Titan"
    ],
    "certifications": [],
    "sourceUrl": "https://www.bechem.com/de/produkte/umformschmierstoffe/beruforge-100.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Castrol",
    "name": "Iloform FST 8",
    "productFamily": "Iloform",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": 168,
    "densityGcm3": 1,
    "flashpointC": 175,
    "description": "Chlorfreies, nicht wassermischbares Umformöl mittlerer Viskosität mit extrem leistungsstarkem Additivpaket, frei von Schwermetallen wie Barium. Speziell für mittlere Feinschneidoperationen von Stahlteilen (Getriebe- und Fahrwerkskomponenten, Bremsbelagträger) sowie mittelschwere Tiefzieh- und Stanzoperationen; Blechdicken bis 10 mm. Wird unverdünnt eingesetzt; nicht für Buntmetalle geeignet, gut alkalisch oder mit Lösemittel entfernbar.",
    "applicationAreas": [
      "Feinschneiden",
      "Tiefziehen",
      "Stanzen"
    ],
    "suitableMaterials": [
      "Stahl"
    ],
    "certifications": [],
    "sourceUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/3DF1E96601B3758280257D27003E0AB2/$File/BPXE-8KMMTL_0.pdf",
    "dataSheetUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/3DF1E96601B3758280257D27003E0AB2/$File/BPXE-8KMMTL_0.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Castrol",
    "name": "Iloform TDN 81",
    "productFamily": "Iloform",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": 140,
    "densityGcm3": 1.16,
    "flashpointC": 220,
    "description": "Hochchloriertes Hochleistungs-Umformöl (EP-Vollöl) auf Basis chlorierter Paraffine, Neutralfette und aromatenarmen Mineralöls für schwerste Umformoperationen. Einsatz beim Tiefziehen aller Stahlgüten, Feinschneiden von Baustahl bis Edelstahl, Kaltstauchen von Edelstahlschrauben, Stangen- und Rohrziehen sowie Kaltpilgern von legierten und rostfreien Stählen; auch für Aluminium und Kupferlegierungen. Verhindert Aufschweißungen, minimiert Werkzeugverschleiß und ist alkalisch gut entfettbar.",
    "applicationAreas": [
      "Tiefziehen",
      "Feinschneiden",
      "Rohrziehen",
      "Stangenziehen",
      "Kaltstauchen",
      "Kaltpilgern"
    ],
    "suitableMaterials": [
      "Stahl",
      "Edelstahl",
      "Aluminium",
      "Kupferlegierungen"
    ],
    "certifications": [],
    "sourceUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/FEDE1F9BE50A779780257796002FE8DF/$File/Iloform%20TDN%2081.pdf",
    "dataSheetUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/FEDE1F9BE50A779780257796002FE8DF/$File/Iloform%20TDN%2081.pdf",
    "sdsUrl": "https://msdspds.castrol.com/ussds/amersdsf.nsf/Files/5ABE80D81AE03CF880258A2A0042B1D1/$File/3023980.pdf"
  },
  {
    "manufacturer": "Fuchs",
    "name": "RENOFORM MZAN 51",
    "productFamily": "Renoform",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": 100,
    "densityGcm3": 1.18,
    "flashpointC": 180,
    "description": "Nicht wassermischbares Hochleistungs-Umformöl für alle Umformoperationen wie Feinschneiden und Tiefziehen, insbesondere für sehr schwierige Operationen. Geeignet für Stahl und hochlegierte Stähle im Stanz- und Tiefziehbereich. Kinematische Viskosität 100 mm²/s bei 40 °C, Dichte 1,18 g/cm³ bei 15 °C, Flammpunkt 180 °C.",
    "applicationAreas": [
      "Feinschneiden",
      "Tiefziehen",
      "Stanzen"
    ],
    "suitableMaterials": [
      "Stahl",
      "Hochlegierte Stähle"
    ],
    "certifications": [],
    "sourceUrl": "https://www.fuchs.com/fi/en/product/product/136809-RENOFORM-MZAN-51/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Condat",
    "name": "VICAFIL SENJA",
    "productFamily": "Vicafil",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Trockenziehmittel (Ziehseife) für das Hochgeschwindigkeits-Mehrfachziehen von Stahldraht, speziell Steelcord, phosphatierten Spannbetondraht (PC-Draht) und Schweißdraht. Die Formulierung bietet erhöhte Scher- und Temperaturbeständigkeit und hält den Schmierfilm auch bei sehr hohen Ziehgeschwindigkeiten stabil. Borax-arm und nitritfrei; wird oft mit VICAFIL TN 1548 in den ersten Zügen kombiniert.",
    "applicationAreas": [
      "Drahtziehen",
      "Trockenzug"
    ],
    "suitableMaterials": [
      "Stahl",
      "Kohlenstoffstahl"
    ],
    "certifications": [],
    "sourceUrl": "https://condatcorp.com/press-article/higher-drawing-stability-vicafil-senja",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Quaker Houghton",
    "name": "FERROCOTE 6130",
    "productFamily": "Ferrocote",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Ölbasierter Zieh- und Umformschmierstoff mit EP- und polaren Additiven für Platinenwaschen, Ausschneiden, Stanzen und Biegen von Eisen- und NE-Metallen. Bietet Korrosionsschutz im Prozess und am fertigen Teil (bis 15 Tage im JAN-H-792-Feuchtschrank); Auftrag per Fluten, Tauchen, Wischen, Elektrostatik oder Sprühen. Erfüllt SCAQMD Rule 1144 (2012) und ASTM E1868-10 (TGA).",
    "applicationAreas": [
      "Stanzen",
      "Blechumformung",
      "Biegen",
      "Ziehen"
    ],
    "suitableMaterials": [
      "Stahl",
      "NE-Metalle"
    ],
    "certifications": [
      "SCAQMD Rule 1144",
      "ASTM E1868-10"
    ],
    "sourceUrl": "https://store.quakerhoughton.com/ferrocote-6130-na",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "TotalEnergies",
    "name": "MARTOL EP 100 CF",
    "productFamily": "Martol",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Chlorfreies, nicht wassermischbares Umformöl auf Mineralölbasis für schwere Umformoperationen wie Tiefziehen, Stangenziehen und Kaltstauchen. Sehr gutes Spreitverhalten des Ölfilms und starke Verschleißschutz-Eigenschaften reduzieren Werkzeugverschleiß und verbessern die Oberflächengüte. Rückstände sind mit üblichen Lösemitteln oder heißen alkalischen Reinigern entfernbar.",
    "applicationAreas": [
      "Tiefziehen",
      "Stangenziehen",
      "Kaltstauchen"
    ],
    "suitableMaterials": [
      "Stahl",
      "NE-Metalle"
    ],
    "certifications": [],
    "sourceUrl": "https://lubricants.catalog.totalenergies.com/corporate/en_UK/qe8_martol-ep-100-cf",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "TotalEnergies",
    "name": "MARTOL VB 68",
    "productFamily": "Martol",
    "category": "FORMING_OIL",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Nicht wassermischbares Umformöl für Kaltumformoperationen an Eisen- und NE-Metallen. Enthält ein spezielles chlorfreies Additiv mit hoher Extreme-Pressure-Leistung zum Schutz von Werkzeugen und Matrizen; zusätzlich verbesserter Rostschutz (besteht ASTM D 665 Verfahren B mit synthetischem Meerwasser) und neutral gegenüber Kupfer und Kupferlegierungen.",
    "applicationAreas": [
      "Kaltumformung",
      "Tiefziehen",
      "Stanzen"
    ],
    "suitableMaterials": [
      "Stahl",
      "NE-Metalle",
      "Kupfer"
    ],
    "certifications": [],
    "sourceUrl": "https://lubricants.catalog.totalenergies.com/corporate/en_UK/a4d_martol-vb-68",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Blaser Swisslube",
    "name": "Blasoclean AF",
    "productFamily": "Blasoclean",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Systemreiniger von Blaser Swisslube zur Reinigung von KSS-Kreisläufen vor der Neubefüllung. Wird mit 2-3 Vol.-% der alten Emulsion zugegeben und zirkuliert, kann danach 4-8 Wochen als Nachfüllkonzentrat weiterverwendet werden. Enthält alle relevanten Bestandteile eines Kühlschmierstoffs (EP-Additive, Korrosionsschutz, Schaumkontrolle), sodass während der Reinigung weiter produziert werden kann.",
    "applicationAreas": [
      "Systemreinigung",
      "Korrosionsschutz",
      "Schaumbekämpfung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://blaser.com/de/systemreiniger-fuer-gute-startbedingungen/",
    "dataSheetUrl": "https://blaser.com/wp-content/uploads/Blaser_College_Wassermischbare_KSS_Reinigung_Befu%CC%88llung_von-Maschinen_de-2.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Oemeta",
    "name": "ADDI-PROX LC",
    "productFamily": "ADDI-PROX",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Dispergier-Additiv aus dem ADDI-PROX-Pflegeadditiv-Programm von Oemeta zur Reinigung verrohrter KSS-Systeme im laufenden Betrieb. Löst Ablagerungen und Rückstände in Leitungssystemen und hält sie in Schwebe, damit sie ausgetragen werden können. Optimal auf die Oemeta-Kühlschmierstoffe (z.B. HYCUT, NOVAMET) abgestimmt.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.oemeta.com/us/products-services/control-additives",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Rhenus Lub",
    "name": "rhenus ZC 948",
    "productFamily": "rhenus Pflegeprodukte",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Systemreiniger für mineralölhaltige wassergemischte Kühlschmierstoffe (Emulsionen). Wird mindestens 8 Stunden vor der Entleerung der KSS-Anlage in die laufende Emulsion dosiert, löst Ablagerungen aus schwer zugänglichen Stellen und ermöglicht längere Standzeiten und bessere Hygiene der Neubefüllung.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.rhenuslub.de/wp-content/uploads/2022/06/Pflegemassnahmen_KSS_bei_langen_Anlagenstillstaenden.pdf",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Rhenus Lub",
    "name": "rhenus ZC 944",
    "productFamily": "rhenus Pflegeprodukte",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Systemreiniger speziell für mineralölfreie, vollsynthetische wassermischbare Kühlschmierstoffe (Syntheten/Lösungen). Zugabe mindestens 8 Stunden vor der Entleerung; reinigt den KSS-Kreislauf vor der Neubefüllung und verbessert die Hygiene und Standzeit der frischen Füllung.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.rhenuslub.de/wp-content/uploads/2022/06/Pflegemassnahmen_KSS_bei_langen_Anlagenstillstaenden.pdf",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Rhenus Lub",
    "name": "rhenus ZI 923",
    "productFamily": "rhenus Pflegeprodukte",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Konservierungs-Additiv zur Stabilisierung wassergemischter Kühlschmierstoffe bei langen Anlagenstillständen. Dosierung 0,15 % des Umlaufvolumens in Zentralanlagen bzw. Einzelmaschinen über 1000 Liter; schützt die Emulsion zusammen mit angehobener Konzentration und pH-Wert (mind. 9,3) vor mikrobiellem Befall.",
    "applicationAreas": [
      "Konservierung",
      "Emulsionspflege",
      "pH-Stabilisierung"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.rhenuslub.de/wp-content/uploads/2022/06/Pflegemassnahmen_KSS_bei_langen_Anlagenstillstaenden.pdf",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Rhenus Lub",
    "name": "rhenus ZW 977",
    "productFamily": "rhenus Pflegeprodukte",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Mineralölfreier Entschäumer auf Basis organomodifizierter Siloxane für alle mineralölhaltigen und mineralölfreien Kühlschmierstoffe. Wirkt schon bei sehr geringer Dosierung gegen prozessstörenden Schaum in der Zerspanung und besitzt ausgeprägt schaumdämpfende Eigenschaften.",
    "applicationAreas": [
      "Schaumbekämpfung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.rhenuslub.de/produktfinder/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Motorex",
    "name": "CS-CLEANER",
    "productFamily": "SWISSCARE",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": 1.066,
    "flashpointC": 65,
    "description": "Neutraler Systemreiniger (pH 7,9) für Kühlmittelkreisläufe und Spindelkühlsysteme von Werkzeugmaschinen; entfernt Restschlamm, Fett, Öl und Pilzbefall. Dosierung 3 % des Systemvolumens 48 Stunden (stark verschmutzt bis 72 h) vor dem KSS-Wechsel, die Produktion kann dabei ohne Unterbruch weiterlaufen. Dank biozidfreier Additiv-Formulierung kein Biozidprodukt und weltweit einsetzbar; VOC-frei, verträglich mit Kunststoffen, Lacken und Metallen.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://motorex.com/en-us/cs-cleaner--17854",
    "dataSheetUrl": "https://motorex.com/Pdf/TI/Motorex/Additive/SWISSCARE/CS-CLEANER/CS-CLEANER_EN.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Motorex",
    "name": "SWISSCARE ANTIFOAM WATER",
    "productFamily": "SWISSCARE",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Öliger Entschäumer für wassergemischte Kühlschmierstoffe aus der Motorex Industrial Line. Vollständig silikonfrei und verursacht dadurch keine unerwünschten Nebenwirkungen wie Phasentrennung der Emulsion oder Benetzungsstörungen auf Metalloberflächen. Wird bei akuter Schaumbildung direkt in den KSS-Kreislauf dosiert.",
    "applicationAreas": [
      "Schaumbekämpfung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://motorex.com/en/swisscare-antifoam-water--53810",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Zeller+Gmelin",
    "name": "Zubora RF",
    "productFamily": "Zubora",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Reinigungs- und Spülkonzentrat aus dem Zubora-Programm von Zeller+Gmelin für die Reinigung und Spülung von KSS-Umlaufsystemen. Wird beim Kühlschmierstoff-Wechsel eingesetzt, um Anlagen, Leitungen und Maschinen vor der Neubefüllung von Ablagerungen zu befreien.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://zeller-gmelin.de/en/products/zubora-rf/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Fuchs",
    "name": "RENOCLEAN SMC",
    "productFamily": "RENOCLEAN",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Hochwirksamer Systemreiniger für alle Versorgungssysteme wassergemischter Bearbeitungsflüssigkeiten und Kühlschmierstoffe in Zentralanlagen oder einzelbefüllten Maschinen. Wird der Altemulsion vor dem Wechsel zudosiert und reinigt den gesamten Kreislauf; die Variante SMC+ ist frei von Formaldehydabspaltern.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.fuchs.com/de-de/at/produkt/product/56573-renoclean-smc/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Fuchs",
    "name": "RENOCLEAN FXM 4005",
    "productFamily": "RENOCLEAN",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Biozid- und fungizidfreier Systemreiniger für KSS-Versorgungssysteme. Einwirkzeit 8-24 Stunden in der laufenden Emulsion; bei Bedarf kann ein Bakterizid separat zudosiert werden. Geeignet für Betriebe, die Reinigung und Biozideinsatz bewusst entkoppeln wollen.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.fuchs.com/de/de/produkt/product/148847-RENOCLEAN-FXM-4005/",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Castrol",
    "name": "Techniclean MTC 43",
    "productFamily": "Techniclean",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Maschinen- und Systemreiniger auf Lösemittelbasis für Werkzeugmaschinen und KSS-Systeme. Entfernt eine Vielzahl von Verunreinigungen inklusive Fettablagerungen in Rohrleitungen und Bodenkanälen und kann bei laufendem Betrieb direkt ins Kühlmittelsystem gegeben werden, mit minimaler Produktionsunterbrechung.",
    "applicationAreas": [
      "Systemreinigung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.castrol.com/en_us/united-states/home/products/industrial/metalworking/cleaners.html",
    "dataSheetUrl": "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/14A56E0E968AF61280257FFF00520BC3/$File/BPXE-ACJ4VV.pdf",
    "sdsUrl": null
  },
  {
    "manufacturer": "Castrol",
    "name": "Techniclean XBC",
    "productFamily": "Techniclean",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Wasserbasierter Reiniger für die Präzisionsreinigung zerspanter Bauteile in Spritz-, Flut- und Hochdruckanlagen. Speziell auf volle Verträglichkeit mit den Castrol-Kühlschmierstoffen Alusol und Hysol XBB ausgelegt: Am Ende seiner Reinigungs-Standzeit kann er in das KSS-System zurückgeführt werden, ohne die Kühlschmierstoff-Leistung zu beeinträchtigen. Sehr gutes Demulgierverhalten (Fremdöl leicht abskimmbar), niedrige Reinigungstemperaturen, reduziert Wasser- und Entsorgungskosten.",
    "applicationAreas": [
      "Teilereinigung",
      "Emulsionspflege",
      "Tramp-Oil-Abtrennung"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://www.castrol.com/en_us/united-states/home/products/our-brands/industrial/techniclean-xbc.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  },
  {
    "manufacturer": "Carl Bechem",
    "name": "Entschäumer FB",
    "productFamily": "BECHEM KSS-Pflegeprodukte",
    "category": "ADDITIVE",
    "viscosityIso": null,
    "viscosityKv40": null,
    "densityGcm3": null,
    "flashpointC": null,
    "description": "Emulgierbares Entschäumerkonzentrat von Carl Bechem zur Entschäumung wassermischbarer Kühlschmierstoffe. Hochkonzentriertes, helles Produkt auf Basis ausgewählter Polymere und Wachse; die erprobte Wirkstoffkombination sorgt für beste Emulsionsverträglichkeit ohne Destabilisierung der Emulsion.",
    "applicationAreas": [
      "Schaumbekämpfung",
      "Emulsionspflege"
    ],
    "suitableMaterials": [],
    "certifications": [],
    "sourceUrl": "https://pdf.directindustry.de/pdf/carl-bechem/kuehlschmierstoffe/37339-308005.html",
    "dataSheetUrl": null,
    "sdsUrl": null
  }
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Spielt die neuen Produkte ein. Liefert eine Kurz-Zusammenfassung. */
export async function applyProduktErweiterung2026_08_02(): Promise<string> {
  const manufacturers = await prisma.manufacturer.findMany({ select: { id: true, name: true } });
  // Exakter Name zuerst (verhindert Shell/AeroShell-Verwechslung), sonst startsWith.
  const byName = new Map(manufacturers.map((m) => [m.name.toLowerCase(), m.id]));
  const resolve = (name: string): string | null => {
    const exact = byName.get(name.toLowerCase());
    if (exact) return exact;
    const hit = manufacturers.find((m) => m.name.toLowerCase().startsWith(name.toLowerCase()));
    return hit?.id ?? null;
  };

  let neu = 0, vorhanden = 0, ohneHersteller = 0;
  for (const p of PRODUKTE) {
    const manufacturerId = resolve(p.manufacturer);
    if (!manufacturerId) { ohneHersteller++; continue; }
    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({
      where: { manufacturerId_slug: { manufacturerId, slug } },
      select: { id: true },
    });
    if (existing) { vorhanden++; continue; }
    await prisma.product.create({
      data: {
        manufacturerId,
        name: p.name,
        slug,
        productFamily: p.productFamily,
        category: p.category,
        description: p.description,
        applicationAreas: p.applicationAreas,
        suitableMaterials: p.suitableMaterials,
        certifications: p.certifications,
        viscosityIso: p.viscosityIso,
        viscosityKv40: p.viscosityKv40,
        densityGcm3: p.densityGcm3,
        flashpointC: p.flashpointC,
        sourceUrl: p.sourceUrl,
        dataSheetUrl: p.dataSheetUrl,
        sdsUrl: p.sdsUrl,
        sourceConfidence: "verifiziert",
        searchTokens: buildSearchTokens({ productName: p.name, manufacturer: p.manufacturer }),
      },
    });
    neu++;
  }
  return `${neu} neu angelegt, ${vorhanden} schon vorhanden, ${ohneHersteller} ohne Hersteller-Match`;
}

// Standalone-Ausführung: npx tsx prisma/add-produkte-2026-08-02.ts
if (process.argv[1]?.includes("add-produkte-2026-08-02")) {
  applyProduktErweiterung2026_08_02()
    .then((r) => { console.log("Ergebnis:", r); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
