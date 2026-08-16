/**
 * Compliance-Ampel (Betreiber 2026-08-16, Konzept vom 2026-07-21 in
 * marketing/konzept-compliance-ampel.md).
 *
 * Jedes Produkt bekommt eine Ampel: ROT / GELB / GRÜN / UNBEKANNT — berechnet
 * zur Laufzeit aus den vorhandenen SDS- und Produktfeldern, KEIN neuer
 * Datenbestand (v1 laut Konzept).
 *
 * Grundsätze:
 *  - Die harte Einstufung (CMR-H-Sätze, SVHC) schlägt die Heuristik-Flags.
 *  - GRÜN gibt es nur, wenn die kritischen Felder AUSDRÜCKLICH mit false
 *    belegt sind. Fehlende Daten sind UNBEKANNT — niemals fälschlich grün.
 *  - Die Ampel ist ein Hinweis, keine Rechtsberatung; maßgeblich bleibt das
 *    SDS des Herstellers (steht als Disclaimer daneben).
 */

export type AmpelStufe = "RED" | "YELLOW" | "GREEN" | "UNKNOWN";

export type AmpelFlag = {
  sev: "RED" | "YELLOW";
  code: string;
  /** Klartext in der Sprache der Einkäufer. */
  text: string;
};

export type AmpelErgebnis = {
  level: AmpelStufe;
  flags: AmpelFlag[];
};

type SdsFelder = {
  hStatements?: string[] | null;
  svhcSubstances?: string[] | null;
  containsChlorinatedParaffins?: boolean | null;
  containsBoron?: boolean | null;
  containsFormaldehydeReleaser?: boolean | null;
  containsSecondaryAmines?: boolean | null;
  containsPrimaryAromaticAmines?: boolean | null;
  reachCompliant?: boolean | null;
  wgkClass?: string | null;
  signalWord?: string | null;
  ghsPictograms?: string[] | null;
};

type ProduktFelder = {
  containsBor?: boolean | null;
  containsFormaldehydeDepot?: boolean | null;
  containsChlorine?: boolean | null;
};

/** CMR: reproduktionstoxisch / karzinogen / mutagen. */
const CMR_SAETZE = ["H360", "H360F", "H360D", "H360FD", "H360Df", "H360Fd", "H350", "H350i", "H340"];

export function berechneAmpel(sds?: SdsFelder | null, produkt?: ProduktFelder | null): AmpelErgebnis {
  if (!sds && !produkt) return { level: "UNKNOWN", flags: [] };
  const flags: AmpelFlag[] = [];

  const h = sds?.hStatements ?? [];
  if (h.some((satz) => CMR_SAETZE.some((cmr) => satz.startsWith(cmr)))) {
    flags.push({ sev: "RED", code: "CMR", text: "CMR-Einstufung (H340/H350/H360)" });
  }
  if ((sds?.svhcSubstances?.length ?? 0) > 0) {
    flags.push({ sev: "RED", code: "SVHC", text: "Besonders besorgniserregender Stoff (SVHC) enthalten" });
  }
  if (sds?.containsChlorinatedParaffins === true || produkt?.containsChlorine === true) {
    flags.push({ sev: "RED", code: "CP", text: "Chlorparaffine (REACH Anhang XVII)" });
  }
  const gefahrMitGhs08 =
    (sds?.signalWord === "Gefahr" || sds?.signalWord === "Danger") &&
    (sds?.ghsPictograms ?? []).some((p) => p.includes("GHS08"));
  if (gefahrMitGhs08 && !flags.some((f) => f.code === "CMR")) {
    flags.push({ sev: "RED", code: "GHS08", text: "Signalwort Gefahr mit Gesundheitsgefahr-Piktogramm (GHS08)" });
  }

  if (sds?.containsBoron === true || produkt?.containsBor === true) {
    flags.push({ sev: "YELLOW", code: "BORON", text: "Enthält Bor — prüfen, ob > 0,3 % (H360)" });
  }
  if (sds?.containsFormaldehydeReleaser === true || produkt?.containsFormaldehydeDepot === true) {
    flags.push({ sev: "YELLOW", code: "FORM", text: "Formaldehyd-Abspalter (Biozid)" });
  }
  if (sds?.containsSecondaryAmines === true) {
    flags.push({ sev: "YELLOW", code: "AMINE", text: "Sekundäre Amine — Nitrosamin-Risiko (TRGS 611)" });
  }
  if (sds?.containsPrimaryAromaticAmines === true) {
    flags.push({ sev: "YELLOW", code: "PAA", text: "Primäre aromatische Amine" });
  }
  if (sds?.reachCompliant === false) {
    flags.push({ sev: "YELLOW", code: "REACH", text: "REACH-Konformität nicht bestätigt" });
  }
  if (sds?.wgkClass === "3") {
    flags.push({ sev: "YELLOW", code: "WGK", text: "WGK 3 — stark wassergefährdend" });
  }

  if (flags.some((f) => f.sev === "RED")) return { level: "RED", flags };
  if (flags.some((f) => f.sev === "YELLOW")) return { level: "YELLOW", flags };

  // Grün nur bei ausdrücklich bekannter, unauffälliger Datenlage.
  const bekannt =
    !!sds &&
    sds.containsBoron === false &&
    sds.containsFormaldehydeReleaser === false &&
    sds.containsSecondaryAmines === false &&
    sds.containsChlorinatedParaffins === false;
  return { level: bekannt ? "GREEN" : "UNKNOWN", flags: [] };
}

export const AMPEL_META: Record<AmpelStufe, { label: string; kurz: string; cls: string; punkt: string }> = {
  RED: {
    label: "Kritische Inhaltsstoffe belegt",
    kurz: "kritisch",
    cls: "bg-red-50 text-red-800 ring-red-200",
    punkt: "bg-red-500",
  },
  YELLOW: {
    label: "Prüfen — einschränkende Inhaltsstoffe",
    kurz: "prüfen",
    cls: "bg-amber-50 text-amber-900 ring-amber-200",
    punkt: "bg-amber-400",
  },
  GREEN: {
    label: "Unauffällig laut Sicherheitsdatenblatt",
    kurz: "unauffällig",
    cls: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    punkt: "bg-emerald-500",
  },
  UNKNOWN: {
    label: "Keine Angabe — Sicherheitsdatenblatt fehlt oder unvollständig",
    kurz: "keine Angabe",
    cls: "bg-slate-100 text-slate-600 ring-slate-200",
    punkt: "bg-slate-400",
  },
};
