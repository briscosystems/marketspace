// Anwendungs-Facetten — verbinden die Freitext-Angabe `Listing.applicationArea`
// (z. B. "CNC-Fräsen", "Hydraulik / Gleitbahn-Mischanwendung") mit den
// strukturierten `machiningOperations`-IDs (z. B. "fraesen", "tieflochbohren").
// Genutzt vom Facetten-Filter auf /listings und vom Anwendungs-Einstieg auf der
// Startseite ("Ich fräse Aluminium" → passende Angebote).

export type ApplicationFacet = {
  id: string;
  label: string;
  /** Kleingeschriebene Teilstrings, die in applicationArea ODER machiningOperations matchen. */
  match: string[];
};

export const APPLICATION_FACETS: ApplicationFacet[] = [
  { id: "fraesen", label: "Fräsen", match: ["fräs", "fraes"] },
  { id: "drehen", label: "Drehen", match: ["dreh"] },
  { id: "bohren", label: "Bohren", match: ["bohr"] },
  { id: "gewindeschneiden", label: "Gewindeschneiden", match: ["gewinde"] },
  { id: "schleifen", label: "Schleifen", match: ["schleif"] },
  { id: "saegen", label: "Sägen/Trennen", match: ["säg", "saeg", "trenn"] },
  { id: "umformen", label: "Umformen/Stanzen", match: ["umform", "stanz", "zieh", "press"] },
  { id: "hydraulik", label: "Hydraulik", match: ["hydraulik"] },
  { id: "gleitbahn", label: "Gleitbahn", match: ["gleitbahn", "bettbahn"] },
  { id: "getriebe", label: "Getriebe", match: ["getriebe"] },
];

export function getApplicationFacet(id: string): ApplicationFacet | undefined {
  return APPLICATION_FACETS.find((f) => f.id === id);
}

/** Passt ein Angebot (applicationArea + machiningOperations) zu dieser Facette? */
export function listingMatchesApplication(
  facet: ApplicationFacet,
  applicationArea: string | null | undefined,
  machiningOperations: string[],
): boolean {
  const area = (applicationArea ?? "").toLowerCase();
  if (facet.match.some((m) => area.includes(m))) return true;
  return machiningOperations.some((op) => {
    const lower = op.toLowerCase();
    return facet.match.some((m) => lower.includes(m));
  });
}
