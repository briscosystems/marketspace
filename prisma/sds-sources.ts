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
];
