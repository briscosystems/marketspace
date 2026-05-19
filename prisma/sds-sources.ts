import type { SdsCategory, SdsLanguage } from "@prisma/client";

export type SdsSource = {
  manufacturer: string;
  productName: string;
  category: SdsCategory;
  language: SdsLanguage;
  sourceUrl: string;
};

export const SDS_SOURCES: SdsSource[] = [
  // ============ CASTROL — wassermischbare KSS ============
  {
    manufacturer: "Castrol",
    productName: "Hysol SL 37 XBB",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/44FB365B487EF8FC80258B9700530A02/$file/3118901.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hysol SL 50 XBB",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/E67F5296812C2E5180258C61005370FF/$file/3174094.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Variocut B 30",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/2223BC0309216BFA80257F8E00326565/$File/BPXE-8K7KVE_0.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Variocut G 101",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/D5A1D23473D6F5B18025883D00536AC0/$file/2845428.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hysol R",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/9CF948F6CB91E7D280257796002FC981/$File/Hysol%20R.pdf",
  },

  // ============ CASTROL — Öle (nicht-wassermischbar) ============
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWS 32 HX",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/E5838973D41DB8EC80258A230073A642/$file/3016419.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWS 46 HX",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/C942BD93FEC0AA1880258A2200741A08/$file/3012653.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWS 68 HX",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://msdspds.castrol.com/ussds/amersdsf.nsf/0/4612CA6BDD8F0AD480258A230073A9AF/$file/3016344.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Variocut C 429",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/FCBCE6CBC996C5258025779600305C0C/$File/Variocut%20C%20429.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Variocut D 734",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl:
      "https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/0923DAB078E69C8A8025779600305CC4/$File/Variocut%20D%20734.pdf",
  },

  // ============ FUCHS — wassermischbare KSS ============
  {
    manufacturer: "Fuchs",
    productName: "Ecocool R 2030",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://shop.schusterundsohn.de/wp-content/uploads/2023/01/SDB-Fuchs-Ecocool-R-2030.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Ecocool XEP",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl: "https://2017erp.com/app/webroot/download/msdspdf/250_ecocool.pdf",
  },

  // ============ FUCHS — Öle ============
  {
    manufacturer: "Fuchs",
    productName: "Renolin B 32 HVI",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://stiglechner.at/files/sdb/Schmiermittel_IQ-Fuchs/RENOLIN%20B%2032%20HVI.MSDS.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin Unisyn CLP 68",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl:
      "https://www.uvp-verbund.de/documents-ige-ng/igc_nw/5b39207c-2039-4ec6-a222-387feaa1b893/D0935423_2.0_de_Sicherheitsdatenblatt_RENOLIN%20UNISYN%20CLP%2068_Stand%20Juli%202022%20-4.PDF",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin Unisyn CLP 460",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Sicherheitsdatenblatt/FUCHS_SDB_Renolin_Uniysn_CLP_460_2008-10.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolit RB 15",
    category: "GREASE",
    language: "DE",
    sourceUrl:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Sicherheitsdatenblatt/FUCHS_SDB_Renolit_RB_15_2006-03.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolit CXI 2",
    category: "GREASE",
    language: "DE",
    sourceUrl:
      "https://www.korb-schmierstoffe.de/datenblaetter/Fuchs/Sicherheitsdatenblatt/FUCHS_SDB_Renolit%20CXI%202.pdf",
  },

  // ============ LAEMMLE / PANOLIN — Öle ============
  //
  // Hinweis: Laemmle Chemicals (CH) vertreibt Panolin als Hauptmarke
  // für Schmierstoffe. Panolin selbst hat keine wassermischbare KSS-Linie,
  // daher hier nur Öle (HLP SYNTH / synthetische Hydrauliköle).
  {
    manufacturer: "Laemmle/Panolin",
    productName: "Panolin HLP SYNTH 22",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://shop.schusterundsohn.de/wp-content/uploads/2020/05/Panolin-HLP-SYNTH-22-SDB.pdf",
  },
  {
    manufacturer: "Laemmle/Panolin",
    productName: "Panolin HLP SYNTH 46 (Rev. 2022)",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://www.korb-schmierstoffe.de/datenblaetter/Panolin/Sicherheitsdatenbla%CC%88tter/HLP%20SYNTH%2046%20-%20SDB%20-%20Deutsch%2020220413.pdf",
  },
  {
    manufacturer: "Laemmle/Panolin",
    productName: "Panolin HLP SYNTH 46 (Schuster, Rev. 2020)",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://shop.schusterundsohn.de/wp-content/uploads/2020/05/Panolin-HLP-SYNTH-46-SDB.pdf",
  },
  {
    manufacturer: "Laemmle/Panolin",
    productName: "Panolin HLP SYNTH (Saugbagger-Doku)",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "http://www.saugbagger-betriebe.de/dokumente/BSB_Panolin-Datenblatt.pdf",
  },
];
