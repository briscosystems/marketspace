/**
 * Verdichtet ein geparstes Sicherheitsdatenblatt (ParsedSds) zu einer kompakten,
 * KI-tauglichen Zusammenfassung. Bewusst KLEIN: es geht nur die strukturierte
 * Essenz an die KI, nicht der ganze PDF-Volltext (Token-Schutz).
 */
import type { ParsedSds } from "@/lib/sds-parser";

export function summarizeParsedSds(p: ParsedSds, productName?: string | null): string {
  const parts: string[] = [];
  if (productName) parts.push(`Produkt: ${productName}`);
  if (p.supplierName) parts.push(`Lieferant: ${p.supplierName}`);
  if (p.signalWord) parts.push(`Signalwort: ${p.signalWord}`);
  if (p.hStatements.length) parts.push(`H-Sätze: ${p.hStatements.join(", ")}`);
  if (p.ghsPictograms.length) parts.push(`GHS-Piktogramme: ${p.ghsPictograms.join(", ")}`);

  const critical: string[] = [];
  if (p.containsBoron === true) critical.push("enthält Bor/Borsäure");
  if (p.containsFormaldehydeReleaser === true) critical.push("Formaldehyd-Abspalter");
  if (p.containsSecondaryAmines === true) critical.push("sekundäre Amine");
  if (p.containsChlorinatedParaffins === true) critical.push("Chlorparaffine");
  if (p.containsPrimaryAromaticAmines === true) critical.push("primäre aromatische Amine");
  if (p.containsMineralOil === true) critical.push("mineralöl-basiert");
  if (critical.length) parts.push(`Kritische Inhaltsstoffe: ${critical.join(", ")}`);

  const free: string[] = [];
  if (p.containsBoron === false) free.push("borfrei");
  if (p.containsChlorinatedParaffins === false) free.push("chlorparaffinfrei");
  if (p.containsFormaldehydeReleaser === false) free.push("formaldehydfrei");
  if (p.containsMineralOil === false) free.push("mineralölfrei");
  if (free.length) parts.push(`Ausdrücklich frei von: ${free.join(", ")}`);

  if (p.svhcSubstances.length) parts.push(`SVHC: ${p.svhcSubstances.join(", ")}`);
  if (p.biocidalActives.length) parts.push(`Biozid-Wirkstoffe: ${p.biocidalActives.join(", ")}`);
  if (p.reachCompliant === false) parts.push("REACH: nicht bestätigt");

  const phys: string[] = [];
  if (p.flashpointC != null) phys.push(`Flammpunkt ${p.flashpointC} °C`);
  if (p.phValue != null) phys.push(`pH ${p.phValue}${p.phContext ? ` (${p.phContext})` : ""}`);
  if (p.viscosityKv40 != null) phys.push(`Viskosität ${p.viscosityKv40} mm²/s @40 °C`);
  if (p.densityGcm3 != null) phys.push(`Dichte ${p.densityGcm3} g/cm³`);
  if (phys.length) parts.push(`Physik: ${phys.join(", ")}`);

  if (p.casNumbers.length) parts.push(`CAS-Nummern: ${p.casNumbers.slice(0, 12).join(", ")}`);

  return parts.length ? parts.join("\n") : "Keine strukturierten Angaben aus dem SDB erkennbar.";
}

/** Kurze Ampel-Chips fürs UI (nur die aussagekräftigen Funde). */
export function sdsFlagChips(flags: {
  hStatements?: string[];
  containsBoron?: boolean | null;
  containsFormaldehydeReleaser?: boolean | null;
  containsSecondaryAmines?: boolean | null;
  containsChlorinatedParaffins?: boolean | null;
}): { label: string; tone: "red" | "amber" | "green" }[] {
  const chips: { label: string; tone: "red" | "amber" | "green" }[] = [];
  if ((flags.hStatements ?? []).some((h) => /^H3[456]0/.test(h))) chips.push({ label: "CMR-Einstufung", tone: "red" });
  if (flags.containsChlorinatedParaffins === true) chips.push({ label: "Chlorparaffine", tone: "red" });
  if (flags.containsBoron === true) chips.push({ label: "Bor", tone: "amber" });
  if (flags.containsFormaldehydeReleaser === true) chips.push({ label: "Formaldehyd-Abspalter", tone: "amber" });
  if (flags.containsSecondaryAmines === true) chips.push({ label: "sek. Amine", tone: "amber" });
  if (flags.containsBoron === false) chips.push({ label: "borfrei", tone: "green" });
  return chips;
}
