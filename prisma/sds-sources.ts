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

  // ============ TotalEnergies ============
  {
    manufacturer: "TotalEnergies",
    productName: "Azolla ZS 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://fernenergy.co.nz/wp-content/uploads/2022/10/TOT-Azolla-ZS-46-2018_SDS.pdf",
  },
  {
    manufacturer: "TotalEnergies",
    productName: "Azolla ZS 46 (AU)",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl:
      "https://static1.squarespace.com/static/583398a9893fc0fa3cc8c018/t/5892d6b3579fb36678ba0c09/1486018229038/AZOLLA+ZS+46+-+MSDS.pdf",
  },
  {
    manufacturer: "TotalEnergies",
    productName: "Lactuca LT 2",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://totaloil.com.ph/sites/g/files/wompnd1871/f/atoms/files/sds_lactuca_lt_2_ap.pdf",
  },

  // ============ Motul ============
  {
    manufacturer: "Motul",
    productName: "8100 X-cess Gen2 5W40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl:
      "https://d347awuzx0kdse.cloudfront.net/motul/product-download/109910_sds.pdf",
  },
  {
    manufacturer: "Motul",
    productName: "8100 ECO-NERGY 0W30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl:
      "https://mekaconsul.com/wp-content/uploads/2022/01/Mekaconsul-MOTUL-8100-ECO-NERGY-0W30.pdf",
  },
  {
    manufacturer: "Motul",
    productName: "8100 X-clean 5W30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl:
      "https://jdmfsm.info/Auto/--General--/Articles/Oil/Motul/8100_X-clean_5W30_MSDS_(GB).pdf",
  },
  {
    manufacturer: "Motul",
    productName: "Motul SDS 102482",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://d347awuzx0kdse.cloudfront.net/motul/product-download/102482_sds.pdf",
  },
  {
    manufacturer: "Motul",
    productName: "Motul SDS 104038",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://d347awuzx0kdse.cloudfront.net/motul/product-download/104038_sds.pdf",
  },

  // ============ Petronas ============
  {
    manufacturer: "Petronas",
    productName: "Syntium 3000 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl:
      "https://www.mymesra.com.my/assets/contentMS/pdf/Passenger_SYNTIUM_3000_5W-40_SDS.pdf",
  },
  {
    manufacturer: "Petronas",
    productName: "Petronas M 500",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl:
      "https://cdn.pli-petronas.com/2022-07/SDS_M%20500_2020.pdf",
  },
  {
    manufacturer: "Petronas",
    productName: "Petronas SSIC",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.pli-petronas.com/sites/petronas/files/2019-01/1813_ssic_ENG.pdf",
  },

  // ============ Shell (mehr) ============
  {
    manufacturer: "Shell",
    productName: "Rimula Super 15W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/SHELL_RIMULA_SUP_MSDS.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus (Keller-Heartt)",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl:
      "https://s3.us-east-2.amazonaws.com/keller-heartt-assets/Data+Sheets/Shell%20Tellus/GSAP_msds_01177991.PDF",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S4 GXV 150",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl:
      "https://industrialfluidsmfg.twinoils.com/Asset/Omala%20S4%20GXV%20150%20SDS.PDF",
  },
  {
    manufacturer: "Shell",
    productName: "Gadus S3 V220C 2",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://assets.alfalaval.com/documents/pb8cd26c2/alfa-laval-shell-gadus-s3-v220c-2.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S2 G 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://avepetroleum.com/uploads/msds_docs/SHELL%20OMALA%20S2%20G%20220-msds.PDF",
  },
  {
    manufacturer: "Shell",
    productName: "Gadus S2 U1000 1",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://industrialfluidsmfg.twinoils.com/Asset/Gadus%20S2%20U1000%201%20SDS.PDF",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 M 22/32/46/68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl:
      "https://www.makino.com/makino-us/media/general/Shell-Tellus-S2-M-22-32-46-68.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S4 GX 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl:
      "https://www.qualitybearingsonline.com/content/Lubricants/MSDS%20and%20TDS%20PDFs/Shell/Shell%20Omala%20S4%20GX%20220%20MSDS.PDF",
  },
  {
    manufacturer: "Shell",
    productName: "Gadus S2 V1002",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://avepetroleum.com/uploads/msds_docs/SHELL-GADUS-S2-V1002-MSDS.PDF",
  },

  // ============ Avia / Bantleon ============
  {
    manufacturer: "Avia Bantleon",
    productName: "Avia Lithoplex 2 EP",
    category: "GREASE",
    language: "EN",
    sourceUrl:
      "https://motornimasla.bg/wp-content/uploads/2023/10/Eng-MSDS-AVIA-LITHOPLEX-2-EP.pdf",
  },

  // ============ ROWE ============
  {
    manufacturer: "ROWE",
    productName: "ROWE Hightec 20009-998-00",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "https://assets.rowegmbh.de/var/assets/brandhub/safety-data-sheets/de/20009-998-00_D-de_1,14.pdf",
  },
  {
    manufacturer: "ROWE",
    productName: "ROWE 21033",
    category: "OTHER",
    language: "DE",
    sourceUrl:
      "https://rowe-cloud.de/haendler/documents/SDB_Safety_Data_Sheet/SDB-ROWE-Deutsch-GHS/21033-SDB-DE-GHS.pdf",
  },
  {
    manufacturer: "ROWE",
    productName: "ROWE 20006",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://lichtex.de/mediafiles/Dokumente/Rowe/Sicherheitsdatenblatt/DE/20006-SDB-DE-GHS.pdf",
  },
  {
    manufacturer: "ROWE",
    productName: "ROWE 25029",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://lichtex.de/mediafiles/Dokumente/Rowe/Sicherheitsdatenblatt/EN/25029-SDB-GB-GHS.pdf",
  },

  // ============ Finke Mineralölwerk / Aviaticon ============
  {
    manufacturer: "Finke Mineralölwerk",
    productName: "Aviaticon HLPD 22",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl:
      "https://media.finke-oil.de/sicherheitsdatenblaetter/AVIATICON_HLPD_22-DE-Sicherheitsdatenblatt-63215bb9625e9.pdf",
  },
  {
    manufacturer: "Finke Mineralölwerk",
    productName: "Aviaticon EP 46",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl:
      "https://media.finke-oil.de/sicherheitsdatenblaetter/AVIATICON_EP_46-DE-Sicherheitsdatenblatt-61c57f12a310b.pdf",
  },

  // ============ Mobil (ExxonMobil) ============
  {
    manufacturer: "Mobil",
    productName: "DTE 25",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_DTE_25_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE 25 Ultra",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/Mobil_DTE_25_Ultra_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE 26 Ultra",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/Mobil_DTE_26_Ultra_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE 10 Excel 68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_DTE_10_EXCEL_68_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE Medium Oil",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_DTE_OIL_MEDIUM_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vacuoline 1409",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/mobil_vacuoline_1409_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vacuoline 537",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/Mobil_Vacuoline_537_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vacuoline 146",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://hascooil.com/wp-content/uploads/2016/11/VACUOLINE-146-sds.pdf",
  },

  // ============ Hebro Chemie (direkt vom Hersteller-Portal) ============
  {
    manufacturer: "Hebro Chemie",
    productName: "Hebro SDS 540144254",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.hebro-chemie.de/sdb/EN/GB/540144254.EN.GB.pdf",
  },
  {
    manufacturer: "Hebro Chemie",
    productName: "Hebro SDS 540133257",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.hebro-chemie.de/sdb/EN/GB/540133257.EN.GB.pdf",
  },

  // ============ Oest ============
  {
    manufacturer: "Oest",
    productName: "Gleitoel CGLP 68",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.perma.co.nz/_Resources/Lubricants/Oest/Oest_Gleitoel_CGLP_68_MSDS_en.pdf",
  },
  {
    manufacturer: "Oest",
    productName: "Hydraulikoel 22 DD",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl:
      "https://elumatec.com/upload/safety/file/Oest_Hydraulikoel_22_DD_l_EN_0004-uPdI.pdf",
  },
  {
    manufacturer: "Oest",
    productName: "Ixelon LT 200 EP",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl:
      "https://www.pellenc.com/docs/website/fiches-donnees-secu/CONSOMMABLES/115174_EN_OEST%20IXELON%20LT%20200%20EP%2042099_2020-11-11.pdf",
  },

  // ============ BASF ============
  {
    manufacturer: "BASF",
    productName: "Glysantin FC G20 ELECTRIFIED",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://download.basf.com/p1/000000000030244083_SDS_GEN_US/en_US/GLYSANTIN_FC_G20_RM50_cl_PGS_30244083_SDS_GEN_US_en_3-3.pdf",
  },
  {
    manufacturer: "BASF",
    productName: "Glysantin G48 blue-green",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://download.basf.com/p1/000000000030052793_SDS_GEN_US/en_US/GLYSANTIN_G48_bg_PGS_000000000030052793_SDS_GEN_US_en_8-1.pdf",
  },
  {
    manufacturer: "BASF",
    productName: "Glysantin G22 ELECTRIFIED",
    category: "OTHER",
    language: "EN",
    sourceUrl:
      "https://download.basf.com/p1/000000000030798170_SDS_GEN_US/en_US/GLYSANTIN_G22_RM50_cl_30798170_SDS_GEN_US_en_2-0.pdf",
  },
  {
    manufacturer: "BASF",
    productName: "Plurasafe WI 165",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.tri-iso.com/documents/BASF_Plurasafe_WI_165_SDS.pdf",
  },

  // ============ Cimcool (alternative Quellen) ============
  {
    manufacturer: "Cimcool",
    productName: "Cimstar 10-570-HFP (Squarespace)",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://static1.squarespace.com/static/601aa70ddc456378022f742a/t/6139081a6866c938e3fc7edf/1631127579249/CIMSTAR_10-570-HFP_SDS.pdf",
  },
  {
    manufacturer: "Cimcool",
    productName: "Cimstar Qual Star Pink",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.aoc.nrao.edu/engineering/ElChemInventory/Merged%20Files%20BC/Cimcool%20cimstar%20Qual%20starpink.pdf",
  },

  // ============ Master Fluid Solutions (alternative Quellen via Grainger/MSC) ============
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM MicroSol 685XT",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl:
      "https://www.grainger.com/sds/pdf/MICROSOL685XT-en-US-US-MCC-0-1__SREY_v1.pdf",
  },
  {
    manufacturer: "Master Fluid Solutions",
    productName: "TRIM MicroSol 585XT",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www1.mscdirect.com/MSDS/MSDS00028/84212240-20190907.PDF",
  },

  // ============ Welle 5 (Etappe 11) — REACH-fokussierte KSS-Erweiterung ============
  // Blaser B-Cool 755 (Art. 11755-01 / -03 / -94 — alle gleiche Rezeptur, nur Gebinde):
  // einziger öffentlich erreichbarer SDS via russischen Distributor. Blaser-Portal
  // selbst (blaser.com/safety-data-sheets/) ist JS-gated und liefert nicht direkt.
  {
    manufacturer: "Blaser Swisslube",
    productName: "B-Cool 755 (Art. 11755)",
    category: "WATER_MISCIBLE_COOLANT",
    language: "OTHER", // RU — wir nutzen "OTHER", da Enum DE/EN/FR/IT/OTHER
    sourceUrl: "https://abamet-info.ru/pdf/catalog-products/blaser/b-cool-755_sds.pdf",
  },

  // Quaker Houghton — Hocut-Serie (wassermischbar)
  {
    manufacturer: "Quaker Houghton",
    productName: "Hocut 795-H",
    category: "WATER_MISCIBLE_COOLANT",
    language: "EN",
    sourceUrl: "https://www.dynateco.gr/datafiles/HOCUT%20795-H_CLP%20SDS-EN.pdf",
  },

  // Rhenus Lub — FU-Serie (water-miscible) via egp-handel Distributor-Mirror
  {
    manufacturer: "Rhenus Lub",
    productName: "Rhenus FU 750",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://www.egp-handel.de/mediafiles/Datenblaetter/RhenusSicherheitsDatenblaetter/SIDA_rhenus%20FU%20750_15.12.2023_D_DE.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "Rhenus FU 800",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://www.egp-handel.de/mediafiles/Datenblaetter/RhenusSicherheitsDatenblaetter/SIDA_rhenus%20FU%20800_15.12.2023_D_DE.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "Rhenus FU 51",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl:
      "https://www.egp-handel.de/mediafiles/Datenblaetter/RhenusSicherheitsDatenblaetter/SIDA_rhenus%20FU%2051_15.12.2023_D_DE.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "Rhenus FU 60 TN",
    category: "WATER_MISCIBLE_COOLANT",
    language: "OTHER", // DK
    sourceUrl:
      "https://www.ok.dk/produktkatalog/rhenus/bearbejdning/vandblandbar/rhenus-fu-60_dk.msds.pdf",
  },
  {
    manufacturer: "Rhenus Lub",
    productName: "Rhenus FU 855",
    category: "WATER_MISCIBLE_COOLANT",
    language: "OTHER", // DK
    sourceUrl:
      "https://www.ok.dk/produktkatalog/rhenus/bearbejdning/vandblandbar/rhenus-fu-855_dk.msds.pdf",
  },

  // Klüber Lubrication — Klüberoil 4 UH1-1500 N (food-grade)
  {
    manufacturer: "Klüber Lubrication",
    productName: "Klüberoil 4 UH1-1500 N",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.konecranes.com/sites/default/files/sds_files/QB_D66402844_01_US-1.PDF",
  },

  // Oemeta — weitere Hycut-Varianten (CF 21 + ET 68 sind bereits oben, neu nur englische Versionen
  // falls vorhanden — überspringen, da Duplikat).

  // ============ Etappe 12 — Welle 1: Massensammlung KSS + Schmierstoffe ============
  // 127 URLs aus WebSearch + URL-Probing auf Distributor-Mirrors:
  // msdspds.bp.com (BP/Castrol/Aral/Tribol), sds.chemtel.net (Fuchs),
  // epc.shell.com (Shell), msds.exxonmobil.com (Mobil DTE/Velocite),
  // permausa.com / perma-tec.com (Bechem/Klüber/Mobil/Shell/SKF/perma),
  // q8oils.com (Q8), eniliveschmiertechnik-datenblaetter.de (Eni/Agip),
  // korb-schmierstoffe.de, cimcool.com, ppsindustries.co.nz (Quaker Houghton),
  // sinntec.de (Liqui Moly), media.kuhfussonline.com (Klüber/Henkel),
  // bremer-leguil.de (Cassida/Fuchs food grade).
  {
    manufacturer: "Avia Bantleon",
    productName: "Avilub Hydraulic DD",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://www.perma.com.au/_Resources/Lubricants/AVIA/Avilub_Hydraulic_DD_TDS_de.pdf",
  },
  {
    manufacturer: "Avia Bantleon",
    productName: "Avilub Metacool SEI 2",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl: "https://www.zgonc.at/41122_767.pdf_dl_126359",
  },
  {
    manufacturer: "Avia Bantleon",
    productName: "Avilub Metacorin 833",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl: "https://www.neff-gewindetriebe.de/fileadmin/Servicecenter/Sicherheitsdatenblatt_AVILUB_METACORIN_833_DE.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Bartran (Premium Hydraulic)",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/1E8117DFCC73457A80257796002F6F3A/$File/Bartran.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Bartran XI",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/F180EA264D8074DE80257796002F6FC0/$File/400882_XI_en.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energol HLP",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/B476946E835D9F6480257796002FA6D6/$File/Energol%20HLP.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energol HLP-HM 22",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/Files/16EC5D51FC962F5F80258614005868E7/$File/2675741.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energol HLP-HM Range (DE)",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/4BA9DA986605205180257796002FA58F/$File/Energol%20HLP-HM%20Range.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energol SHF-HV Range",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/EB20D83EFAB6023C80257796002FAADD/$File/Energol%20SHF-HV%20Range.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energol WM",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/593BEDEC0EA08C7C80257796002FABCE/$File/Energol%20WM.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease FG 00-EP",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/8644FA895DB5DD34802579AC003AEDA3/$File/BPXE-8RQHXE.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease HTG 2",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/6D5AFCF8ED1F6AF08025770C0042925F/$File/Energrease%20HTG%202.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease LS 2",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/6BC4131876A423C080257796002FAE5D/$File/Energrease%20LS%202.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease LS Range",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/22292077A9F2416B8025770C00429353/$File/Energrease%20LS%20Range.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease LS-EP 1/2/3",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/B57E12D62FF7FFA180257796002FAE3C/$File/Energrease%20LS-EP%201,%202,%203.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease LS-EP Range",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/6C4E0AC404A47D328025770C004293DE/$File/Energrease%20LS-EP%20Range.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Energrease ZS",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/bpglis/FusionPDS.nsf/Files/B2C982F4E62C859880257796002FB0B0/$File/Energrease%20ZS.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Tribol GR 1350-2.5 PD",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/95F50C241F5B179A802586D40054834E/$file/2734689.pdf",
  },
  {
    manufacturer: "BP",
    productName: "Tribol GR 3020/1000-1 PD",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/A45BD3FBDEFBD9DD802587C100590B61/$file/2806473.pdf",
  },
  {
    manufacturer: "Carl Bechem",
    productName: "Berusynth 68 H1",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Bechem/Berusynth_68_H1_MSDS_en.pdf",
  },
  {
    manufacturer: "Carl Bechem",
    productName: "Berusynth CU 250",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Bechem/Berusynth_CU_250_MSDS_en.pdf",
  },
  {
    manufacturer: "Carl Bechem",
    productName: "Berutox FE 18 EP",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Bechem/Berutox_FE_18_EP_MSDS_de.pdf",
  },
  {
    manufacturer: "Carl Bechem",
    productName: "Berutox FH 28 KN",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Bechem/Berutox_FH_28_KN_MSDS_de.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "EDGE 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/F75F5AD3CDD7B4848025875000529217/$file/2781324.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "EDGE Professional E 0W-30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/EF32FEB44D8AD2BD802584A200583041/$file/2555582.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "EDGE Professional LongLife III 5W-30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/26AA5712DE02690F802586C500743844/$file/2729030.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "GTX PRO-SPEC 15W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/E40B2A8AE3BD463D802588850052C574/$file/2860848.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWH-M 32",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/AB2EDF12A93FB42C80258AF90053677D/$file/3084847.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWH-M 68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/79A8DC3143CA4F2380257AD000580410/$file/172665Hyspin%20AWH-M%2068.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin AWS 68",
    category: "HYDRAULIC_OIL",
    language: "OTHER",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/98571EB85CDD994280258606005393DE/$file/2666103.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin HDH 7000",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/D7796A68DB4D3B4A80257BEC005294C6/$file/231926Hyspin%20HDH%207000.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin HLP-Z 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/449987452D27135080258898005396D4/$file/2864735.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Hyspin ZZ 68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/1A60325D0E87FB008025886F0052F97F/$file/2856347.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Power 1 Racing 4T 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/AE48A5FA2DE4D07080258AF9005340BD/$file/3084956.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Transmax Manual EP 80W",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/C938813910EF5561802585F30074716B/$file/2654400.pdf",
  },
  {
    manufacturer: "Castrol",
    productName: "Transmax Manual V 75W-80",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://msdspds.bp.com/ussds/amersdsf.nsf/0/5BC11441DB50B994802588640052A6CD/$file/2853742.pdf",
  },
  {
    manufacturer: "Eni",
    productName: "Agip OTE",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://www.korb-schmierstoffe.de/datenblaetter/ENI/Sicherheitsdatenbla%CC%88tter/Agip%20OTE.pdf",
  },
  {
    manufacturer: "Eni",
    productName: "Antifreeze Extra D",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://eniliveschmiertechnik-datenblaetter.de/de_DE/datasheet/sdb/2238?dl=1&pdf=true",
  },
  {
    manufacturer: "Eni",
    productName: "Arnica 46",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://eniliveschmiertechnik-datenblaetter.de/de_DE/datasheet/sdb/1947?dl=1&pdf=true",
  },
  {
    manufacturer: "Eni",
    productName: "Blasia 68",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl: "https://oel-engel.de/mediafiles/Sicherheitsdatenblatt/SDB2700_Eni_Blasia_68.pdf",
  },
  {
    manufacturer: "Eni",
    productName: "GR MU EP 0",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://eniliveschmiertechnik-datenblaetter.de/de_DE/datasheet/sdb/2128?webcode=home&page=3&pdf=true&dl=1",
  },
  {
    manufacturer: "Eni",
    productName: "OSO",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://www.korb-schmierstoffe.de/datenblaetter/ENI/Sicherheitsdatenbla%CC%88tter/OSO.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Cassida Fluid GL 220 (EN)",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Fuchs/CASSIDA_FLUID_GL_220_MSDS_en.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Cassida Fluid HF 15 (DE)",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://www.bremer-leguil.de/media/documents/CASSIDA%20FLUID%20HF%2015_DE_DE.pdf?q=d02efc9dd1d70066d59773fdcae647a5",
  },
  {
    manufacturer: "Fuchs",
    productName: "Cassida Fluid HF 15 (EN)",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://boitronthucpham.com/wp-content/uploads/2024/08/Fuchs-Cassida-Fluid-Hf-15-MSDS.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Cassida Grease EPS 2 (DE)",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Bremer%20Leguil/CASSIDA_GREASE_EPS_2_MSDS_de.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Maintain Fricofin",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_MAINTAIN%20FRICOFIN_000000000600939144_11-10-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Plantocut 10 SR (DE)",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_PLANTOCUT%2010%20SR_000000000600499853_09-12-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Plantocut 10 SR (US)",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Lubricants%20Company_PLANTOCUT%2010%20SR_R00000451666_06-17-2015_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renoclean GMO 2203",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_RENOCLEAN%20GMO%202203_CP1012049_06-01-2022_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renoclean ISO",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.fuchs.com/fileadmin/uk/Media/Data_Sheets/SDS_-_RENOCLEAN_ISO.PDF",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renoclean MSO 3004 UK",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.fuchs.com/fileadmin/uk/Media/Data_Sheets/SDS_-_RENOCLEAN_MSO_3004_UKPDF.PDF",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renoclean SMC",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.fuchs.com/fileadmin/uk/Media/SDS/SDS_RENOCLEAN_SMC.PDF",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renoclean VR 1021 CXV",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.fuchs.com/fileadmin/uk/Media/Data_Sheets/SDS_-_RENOCLEAN_VR_1021_CXV.PDF",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin B 100 HVI Plus",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Lubricants%20Company_RENOLIN%20B%20100%20HVI%20PLUS_Unknown_09-27-2021_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin CLP 320",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_RENOLIN%20CLP%20320_000000000600634339_05-09-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin CLPF 460 Super",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_RENOLIN%20CLPF%20460%20SUPER_000000000600636302_06-28-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolin PG 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_RENOLIN%20PG%20220_000000000600125158_08-29-2016_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Renolit RHF 1",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GMBH_RENOLIT%20RHF%201_000000000600657796_06-16-2016_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Stabyl TA",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Lubritech%20GMBH_STABYL%20TA_000000000601075674_09-28-2021_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan ATF 3353",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20ATF%203353_000000000600632434_08-26-2016_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan EG 5080",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20EG%205080_000000000600636494_08-03-2016_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan GT1 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20GT1%205W-40_000000000600756741_09-02-2018_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan GT1 Flex 3 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Lubricants%20Germany%20GmbH_TITAN%20GT1%20FLEX%203%205W-40_CP1008590_11-20-2020_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan GT1 Flex C2 0W-30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Lubricants%20Germany%20GmbH_TITAN%20GT1%20FLEX%20C2%200W-30_000000000602095695_10-20-2022_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan GT1 Pro C-1 5W-30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20GT1%20PRO%20C-1%205W-30_000000000600512439_08-25-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan Sintopoid LS 75W-90",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20SINTOPOID%20LS%2075W-90_000000000600746575_08-21-2017_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Titan Supergear 80W-90",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://sds.chemtel.net/docs/Fuchs%20Lubricants%20Co-0002505/Fuchs%20Schmierstoffe%20GmbH_TITAN%20SUPERGEAR%2080W-90_000000000600632854_08-31-2016_English.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Wisura S 4000355515",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://media.contorion.de/content/pdf/fuchs_wisura/at/S_4000355515_DE_20180112_de.pdf",
  },
  {
    manufacturer: "Fuchs",
    productName: "Wisura S 4000355533",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://media.contorion.de/content/pdf/fuchs_wisura/de/S_4000355533_DE_20170703_de.pdf",
  },
  {
    manufacturer: "Henkel",
    productName: "Bonderite L-MR 71-2 (Multan 71-2)",
    category: "WATER_MISCIBLE_COOLANT",
    language: "DE",
    sourceUrl: "https://www.oel-prinz.de/images/MSDS%20BONDERITE%20L-MR%2071-2%20known%20as%20Multan%2071-2.PDF",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Microlube GB 0 (DE)",
    category: "GREASE",
    language: "DE",
    sourceUrl: "http://media.kuhfussonline.com/Sicherheits-DB/Kl%C3%BCber/SDS_MICROLUBE_GB_0_020232_DE_de.pdf",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Microlube GB 00 (US)",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.allworldmachinery.com/customer/docs/skudocs/MICROLUBE%20GB%2000%20%5B25kg%5D.PDF",
  },
  {
    manufacturer: "Klüber Lubrication",
    productName: "Microlube GB 00 (Yoderoil)",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.yoderoil.com/wp-content/uploads/2015/05/Kluber-Microlube-GB00.pdf",
  },
  {
    manufacturer: "LE",
    productName: "3751 Almagard Vari-Purpose Lubricant",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/LE/3751_ALMAGARD_VARI_PURPOSE_LUBRICANT_MSDS_en.pdf",
  },
  {
    manufacturer: "LE",
    productName: "4058 H1 Quinplex Penetrating Oil",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/LE/4058_H1_QUINPLEX_PENETRATING_OIL_LUBRICANT_MSDS_en.pdf",
  },
  {
    manufacturer: "Liebherr",
    productName: "Universalfett 9900",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Liebherr/Liebherr_Universalfett_9900_MSDS_de.pdf",
  },
  {
    manufacturer: "Liqui Moly",
    productName: "11241 0008",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://www.ludwigmeister.de/mediadata/datasheets/65d6b664b43d-liqui-moli-11241_0008_31-05-2022_de.pdf",
  },
  {
    manufacturer: "Liqui Moly",
    productName: "11297 0012",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://sichdatonline.chemical-check.de/Dokumente/566/11297_0012_12-05-2020_DE.pdf",
  },
  {
    manufacturer: "Liqui Moly",
    productName: "12204 0011",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://sichdatonline.chemical-check.de/Dokumente/566/12204_0011_20-10-2020_DE.pdf",
  },
  {
    manufacturer: "Liqui Moly",
    productName: "8685",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://sinntec.de/mediafiles/Sonstiges/PDF/LiquiMoly/8685%20Sicherheitsdatenblatt.pdf",
  },
  {
    manufacturer: "Lubriplate",
    productName: "SYN 1602",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Lubriplate/SYN_1602_MSDS_us_en.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "1 5W-30",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_1_5W-30_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE 25",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.uww.edu/apps/riskmanagement/msds/mobil_dte_25_exxonmobil_oil_corporation_10.23.02.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "DTE Heavy Medium",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_DTE_HEAVY_MEDIUM_MSDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Mobilgrease 28",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Exxon%20Mobil/MOBILGREASE_28_MSDS_de.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Mobilgrease XHP 222 (ZH)",
    category: "GREASE",
    language: "OTHER",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Exxon%20Mobil/MOBILGREASE_XHP_222_MSDS_zh.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vactra No 1",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_VACTRA_1_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vactra No 2",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_VACTRA_2_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vactra No 3",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_VACTRA_3_SDS.pdf",
  },
  {
    manufacturer: "Mobil",
    productName: "Vactra No 4",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://petroleumservicecompany.com/content/pdfs/MOBIL_VACTRA_4_SDS.pdf",
  },
  {
    manufacturer: "Nils",
    productName: "GR 7000",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Nils/GR_7000_MSDS_en.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Antifreeze OAT-2",
    category: "OTHER",
    language: "DE",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2024/10/Q8-Antifreeze-OAT-2_de-1.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Formula Elite C2 0W-30",
    category: "MOTOR_OIL",
    language: "DE",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2024/01/Q8-Formula-Elite-C2-0W-30_de.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Goya 220",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2022/06/Q8-Goya-220_de.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Holst CR-46",
    category: "NEAT_CUTTING_OIL",
    language: "DE",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2022/06/Q8-Holst-CR-46_de-1.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "T 670 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2024/03/Q8-T-670-5W-40_en.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "T 750 SAE 40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2026/04/Q8-T-750-SAE-40_en.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Transformer Oil I",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2024/12/Q8-Transformer-Oil-I_en.pdf",
  },
  {
    manufacturer: "Q8Oils",
    productName: "Unishift PC Synt 75W-80",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.q8oils.com/wp-content/uploads/2024/09/Q8-Unishift-PC-Synt-75W-80_en.pdf",
  },
  {
    manufacturer: "Quaker Houghton",
    productName: "Cindol 305D",
    category: "NEAT_CUTTING_OIL",
    language: "EN",
    sourceUrl: "https://www.ppsindustries.co.nz/cdn/images/productdocument/QH-MSDS-CINDOL-305D---2019.pdf",
  },
  {
    manufacturer: "Quaker Houghton",
    productName: "Rust Veto 4242",
    category: "OTHER",
    language: "EN",
    sourceUrl: "https://www.wheeling-nipponsteel.com/images/pdf/sds/rust-veto-4242.pdf",
  },
  {
    manufacturer: "ROCOL",
    productName: "Foodlube Hi-Power Range",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.acorn-ind.co.uk/_assets/product-resources/MMEQCH/ROCOL/FOODLUBE-Hi-Power-Range__-GB-SDS.pdf",
  },
  {
    manufacturer: "ROCOL",
    productName: "Foodlube Universal",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.itwppfasia.com/en/webroot/upload/20200928/ROCOL-FOODLUBE-UNIVERSAL-000-15284-EN-MSDS.pdf",
  },
  {
    manufacturer: "SKF",
    productName: "LGET 2",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/SKF/LGET_2_MSDS_en.pdf",
  },
  {
    manufacturer: "SMW-AUTOBLOK",
    productName: "K67",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/SMW%20AUTOBLOK/K67_MSDS_de.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Gadus S3 V460D 2",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/Shell/Shell_Gadus_S3_V460D_2_MSDS_en.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S2 G 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Shell/Shell_Omala_S2_G_220_MSDS_en.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S4 GXV 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=133217379",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S4 GXV Plus 220",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=188903793",
  },
  {
    manufacturer: "Shell",
    productName: "Omala S4 WE 320",
    category: "GEAR_OIL",
    language: "DE",
    sourceUrl: "https://uvp.niedersachsen.de/documents-ige-ng/igc_ni/F825CD8D-6E07-4EF4-A5FF-C34F2FCC6D1D/11.8_08_Sicherheitsda_Shell-Omala-S4-WE-320_DE---EG-Shell-Omala-S4-WE-320_DE---EG-Sicherheitsdatenblatt-(0043-7822).pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Spirax S4 CX 10W",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=75792108",
  },
  {
    manufacturer: "Shell",
    productName: "Spirax S4 TX",
    category: "GEAR_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=76642523",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus Oil STX 32",
    category: "HYDRAULIC_OIL",
    language: "DE",
    sourceUrl: "https://www.schmierstoff-datenbank.de/uploads/7603913094a81134f95c4d.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 MA 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=75800118",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 MX 100",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=127798946&docType=.pdf",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 MX 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=130081697",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 MX 68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentManagement/BlobDocumentDownload?DocId=179991237",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 V 100",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentManagement/BlobDocumentDownload?DocId=125746779",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 VX 100",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=127799366",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 VX 32",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentManagement/BlobDocumentDownload?DocId=129875007",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S2 VX 46",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=127876436",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S3 M 68",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=76621899",
  },
  {
    manufacturer: "Shell",
    productName: "Tellus S4 VX 32",
    category: "HYDRAULIC_OIL",
    language: "EN",
    sourceUrl: "https://www.epc.shell.com/DocumentRetrieve?documentId=75795848",
  },
  {
    manufacturer: "TotalEnergies",
    productName: "Caloris 23",
    category: "GREASE",
    language: "DE",
    sourceUrl: "https://www.perma-tec.com/_Resources/Lubricants/Total/CALORIS_23_MSDS_de.pdf",
  },
  {
    manufacturer: "TotalEnergies",
    productName: "Quartz 9000 5W-40",
    category: "MOTOR_OIL",
    language: "EN",
    sourceUrl: "https://staticmi.de/media_ftp_de/documents/Oil_Warning_pdf/TOTAL_QUARTZ_9000_EN_5W40.pdf",
  },
  {
    manufacturer: "perma",
    productName: "Multi LC Syn 220 2",
    category: "GREASE",
    language: "EN",
    sourceUrl: "https://www.permausa.com/_Resources/Lubricants/PERMA/perma_MULTI_LC_SYN_220_2_SF130/perma_MULTI_LC_SYN_220_2_SF120_MSDS_us_en.pdf",
  },
];
