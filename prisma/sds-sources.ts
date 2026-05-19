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

  // ============ BLASER SWISSLUBE — KSS / Schneidöl ============
  {
    manufacturer: "Blaser Swisslube",
    productName: "Synergy 905",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.hsk.com/fileadmin/user_upload/Downloads/Kataloge/EU_11905-04_Sicherheitsdatenblatt_-EN.PDF",
  },
  {
    manufacturer: "Blaser Swisslube",
    productName: "Vasco 5000",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://www.robfin.com/wp-content/uploads/2017/08/SDS_Vasco_5000_02850-05_USA.pdf",
  },
  {
    manufacturer: "Blaser Swisslube",
    productName: "Blasocut 2000 Universal",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www.precisebits.com/PDF/MSDS-2800-01_us.pdf",
  },

  // ============ CIMCOOL — wassermischbare KSS ============
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 60C-HFP",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://msdsdigital.com/system/files/CIMSTAR_60C-HFP_SDS.pdf",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 540",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www.msdsdigital.com/system/files/CIMSTAR_540_SDS_0.pdf",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 540 BLUE",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "http://cimcool.com/sds/uploads/SDS%20US%20English%20-%20CIMSTAR%20540%20BLUE_US.pdf",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 10-570-HFP",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "http://www1.mscdirect.com/MSDS/MSDS00058/43072677-20181017.PDF",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 60XLZ",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "http://www.cimcool.com/sds/extract/pdf/SDS%20US%20English%20-%20CIMSTAR%2060XLZ_US.pdf",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 40B PINK",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://cdn.grovesindustrial.com/pdf/sds/MCR_662504-893-05.pdf",
  },

  // ============ OEMETA — KSS / Schleiföl ============
  {
    manufacturer: "Oemeta",
    productName: "Hycut CF 21",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.industrialsalesgroupllc.com/uploads/6/4/1/3/64138289/hycut_cf_21_40701460__us___en-us__oemeta_sds.pdf",
  },
  {
    manufacturer: "Oemeta",
    productName: "Hycut ET 68",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.industrialsalesgroupllc.com/uploads/6/4/1/3/64138289/hycut_et_68_4070116__us___en__oemeta_sds.pdf",
  },
  {
    manufacturer: "Oemeta",
    productName: "Hycut SE 32",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.industrialsalesgroupllc.com/uploads/6/4/1/3/64138289/hycut_se_32_4070125__us___en__oemeta_sds.pdf",
  },
  {
    manufacturer: "Oemeta",
    productName: "Hycut SE 12 EP",
    category: "GREASE",
    language: "EN",
    sourceUrl: "http://www.actequipment.com/msds/oemeta/OEMETA_Hycut_SE12_EP.pdf",
  },
  {
    manufacturer: "Oemeta",
    productName: "Hytap",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://trimsds.wordpress.com/wp-content/uploads/2014/11/oemeta-hytap.pdf",
  },
  {
    manufacturer: "Oemeta",
    productName: "Novamet 900",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://www.hemlytool.com/content/documents/NOVAMET-900-SDS.pdf",
  },

  // ============ PETROFER ============
  {
    manufacturer: "Petrofer",
    productName: "IsoCut Fluid",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://www.buehler.com/assets/SDS/US/1337873_A_IsoCut-Fluid_EN.PDF",
  },

  // ============ MASTER FLUID SOLUTIONS — TRIM ============
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM SOL",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www.msdsdigital.com/system/files/Trimsol.pdf",
  },
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM MicroSol 685",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://bostwick-pim.s3.us-east-2.amazonaws.com/Damroot/Original/10002/Master_Fluid_Solutions_MICROSOL_685_D_SDS_1.pdf",
  },
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM E206",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://msdsdigital.com/system/files/Trim%20E206.pdf",
  },
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM SC520",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "http://www1.mscdirect.com/MSDS/MSDS00028/72761703-20100219.PDF",
  },
  {
    manufacturer: "Master Fluid Solutions",
    productName: "Master STAGES CLEAN 2020",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www1.mscdirect.com/MSDS/MSDS00084/60972916-20190726.PDF",
  },

  // ============ RHENUS LUB ============
  {
    manufacturer: "Rhenus Lub",
    productName: "rhenus LZN 2",
    category: "GREASE",
    language: "DE",
    sourceUrl:
      "https://www.permausa.com/_Resources/Lubricants/Rhenus/rhenus_LZN_2_MSDS_de.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "rhenus LCK 2",
    category: "GREASE",
    language: "DE",
    sourceUrl:
      "https://www.perma.com.au/_Resources/Lubricants/Rhenus/rhenus_LCK_2_MSDS_de.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "rhenus LAH 2",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://g-lube.com/wp-content/uploads/2022/06/02_MSDS_EG_DE.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "rhenus r-meta TS 34",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://baseportal.de/files/schlierfmi/Sicherheitsdatenblaetter/RHENUS_LUB_r-meta_TS_34_sdb.pdf",
  },

  // ============ oelheld — EDM / Schleiföl ============
  {
    manufacturer: "oelheld",
    productName: "IonoPlus 3000",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://tri-gemini.com/wp-content/uploads/2019/04/IonoPlus_3000-US_-SDS-US-_14.pdf",
  },
  {
    manufacturer: "oelheld",
    productName: "IonoPlus IME-MH",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://sae-dental.com/files/pages/Mediathek/Dielektrikum%20IonoPlus_IME-MH_-SDS-(GB)_14_2017.pdf",
  },
  {
    manufacturer: "oelheld",
    productName: "IonoPlus IME-MH (DE)",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "https://sae-dental.com/files/pages/Mediathek/Dielektrikum%20IonoPlus_IME-MH_-SDS-(D)_15_2019.pdf",
  },
  {
    manufacturer: "oelheld",
    productName: "IonoPlus 3000 (Hirschmann)",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://www.edmsalesinc.com/wp-content/uploads/pdf/Hirschmann_IonoPlus_3000-US_(USA).pdf",
  },

  // ============ Shell ============
  {
    manufacturer: "Shell",
    productName: "FormulaShell SAE 30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://shop.sclubricants.com/pub/media/sds/shell/FormulaShell-SAE-30-Motor-Oil-MSDS.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "SSL-8721 (Makino-bezogen)",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.makino.com/makino-us/media/general/Shell-SSL-8721.pdf",
  },

  // ============ Klüber Lubrication ============
  {
    manufacturer: "Klüber Lubrication",
    productName: "Klüberoil 4 UH1-1500 N",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.konecranes.com/sites/default/files/sds_files/QB_D66402844_01_US-1.PDF",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Klüberoil 4 UH1-220 N",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl:
      "http://oilmart.com/data/products/sds/1623/SDS%20Kluber%20Kluberoil%204%20UH1-220N%2005102017%20EN.pdf",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Klübersynth UH1 6-460",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl:
      "http://oilmart.com/data/products/sds/1625/SDS%20Kluber%20Klubersynth%20UH1%206-460%2005132020%20EN.pdf",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Klüberpaste UH1 96-402",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://assets.alfalaval.com/documents/p6becf182/alfa-laval-kl%C3%BCberpaste-uh1-96-402.pdf",
  },

  // ============ Carl Bechem ============
  {
    manufacturer: "Carl Bechem",
    productName: "Avantin (BECHEM India)",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www.bechemindia.com/wp-content/uploads/2021/02/Bechem-Avantin.pdf",
  },

  // ============ OKS Spezialschmierstoffe ============
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 402",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_402_GB_EN.PDF",
  },
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 422",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_422_GB_EN.PDF",
  },
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 432",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_432_DE_EN.PDF",
  },
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 470",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_470_GB_EN.PDF",
  },
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 475",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_475_GB_EN.PDF",
  },
  {
    manufacturer: "OKS Spezialschmierstoffe",
    productName: "OKS 1110",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.oks-germany.com/product_downloads/pdf/Sicherheitsdatenblaetter/en/SDS_OKS_1110_IT_EN.PDF",
  },

  // ============ Henkel ============
  {
    manufacturer: "Henkel",
    productName: "Bonderite 594059 (Multan PL)",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://www.dillonsupply.com/UserFiles/documents/products/Bon/der/ite/Bonderite_594059_SDS.pdf",
  },

  // ============ Jokisch ============
  {
    manufacturer: "Jokisch",
    productName: "LB-100 Liquid",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://www.haskellcorp.com/SDS/Aerosols/jokisch%20lb-100%20liquid.pdf",
  },
  {
    manufacturer: "Jokisch",
    productName: "Monos Prix V4G",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl:
      "https://www.pokolm.com/media/698/download/33-MSDS-IRL-en-Jokisch%20Monos%20Prix%20V4G-2025-01-14.pdf?v=3",
  },

  // ============ Chemische Werke Kluthe ============
  {
    manufacturer: "Chemische Werke Kluthe",
    productName: "Hakupur 50-525",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "https://shop.schusterundsohn.de/wp-content/uploads/2020/05/Kluthe-Hakupur-50-525-SDB.pdf",
  },
  {
    manufacturer: "Chemische Werke Kluthe",
    productName: "Hakupur 445-1",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "http://baseportal.de/files/schlierfmi/Sicherheitsdatenblaetter/KLUTHE_Hakupur_445-1_sdb.pdf",
  },
  {
    manufacturer: "Chemische Werke Kluthe",
    productName: "Hakupur 439-1",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "http://baseportal.de/files/schlierfmi/Sicherheitsdatenblaetter/KLUTHE_Hakupur-439-1_sdb.pdf",
  },

  // ============ Zeller+Gmelin / Divinol ============
  {
    manufacturer: "Zeller+Gmelin",
    productName: "Divinol (allgemein)",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.gpsbrand.com/media/5966/divinol-sds-english.pdf",
  },
  {
    manufacturer: "Zeller+Gmelin",
    productName: "Divinol HLP ISO 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl:
      "https://mediathek-bosch-automotive.com/files/bosch_wa/data_sheets/sds_2928v3_divinol_en.pdf",
  },
  {
    manufacturer: "Zeller+Gmelin",
    productName: "Divinol Fett EP 2",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://www.permausa.com/_Resources/Lubricants/Zeller%20Gmelin/Divinol_Fett_EP_2_MSDS_en.pdf",
  },
  {
    manufacturer: "Zeller+Gmelin",
    productName: "Divinol GWA ISO 150",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://oel-engel.de/mediafiles/Sicherheitsdatenblatt/SDS_20050_GB-en.pdf",
  },
];
