// Compliance-Badges — kleine Siegel direkt an Produktkarte/-seite, damit
// Einkäufer auf einen Blick sehen, ob ein Produkt ihre Vorschriften erfüllt
// (ohne ins Datenblatt zu schauen). Abgeleitet aus den strukturierten
// Produktfeldern; ein "frei von"-Badge erscheint nur, wenn das Feld explizit
// mit `false` belegt ist (nicht bei unbekannter Datenlage).

export type ComplianceTone = "emerald" | "sky" | "violet" | "amber";

export type ComplianceBadgeDef = {
  id: string;
  label: string;
  title: string;
  tone: ComplianceTone;
};

export type ComplianceSource = {
  containsBor?: boolean | null;
  containsFormaldehydeDepot?: boolean | null;
  containsChlorine?: boolean | null;
  containsMineralOil?: boolean | null;
  certifications?: string[];
};

export function complianceBadges(p: ComplianceSource): ComplianceBadgeDef[] {
  const badges: ComplianceBadgeDef[] = [];
  const certs = (p.certifications ?? []).join(" · ");

  if (p.containsBor === false) {
    badges.push({
      id: "bor-frei",
      label: "borfrei",
      title: "Ohne Borverbindungen — relevant für TRGS 611 und viele Betriebsvorschriften",
      tone: "emerald",
    });
  }
  if (p.containsFormaldehydeDepot === false) {
    badges.push({
      id: "formaldehyd-frei",
      label: "formaldehydfrei",
      title: "Ohne Formaldehyd-Depotstoffe (Bakterizide, die Formaldehyd abspalten)",
      tone: "emerald",
    });
  }
  if (p.containsChlorine === false) {
    badges.push({
      id: "chlor-frei",
      label: "chlorfrei",
      title: "Ohne Chlorparaffine/Chlorverbindungen — entsorgungsfreundlich",
      tone: "emerald",
    });
  }
  if (p.containsMineralOil === false) {
    badges.push({
      id: "mineraloel-frei",
      label: "mineralölfrei",
      title: "Ohne Mineralöl — vollsynthetische Basis",
      tone: "emerald",
    });
  }
  if (/\b(nsf|fda)\b|h1\b/i.test(certs)) {
    badges.push({
      id: "h1",
      label: "NSF/FDA H1",
      title: "Freigabe für Lebensmittel-/Getränkeindustrie (zufälliger Produktkontakt)",
      tone: "sky",
    });
  }
  if (/trgs\s*611/i.test(certs)) {
    badges.push({
      id: "trgs611",
      label: "TRGS 611",
      title: "Konform zur TRGS 611 (Einschränkungen für nitrosaminbildende KSS)",
      tone: "violet",
    });
  }

  return badges;
}
