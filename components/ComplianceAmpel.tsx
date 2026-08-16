import { AMPEL_META, type AmpelErgebnis } from "@/lib/compliance-ampel";

/**
 * Anzeige der Compliance-Ampel: farbiges Siegel mit Punkt, darunter (auf
 * Detailseiten) die Klartext-Gründe und der Pflicht-Disclaimer.
 */
export function ComplianceAmpel({
  ergebnis,
  kompakt = false,
}: {
  ergebnis: AmpelErgebnis;
  /** true = nur das kleine Siegel (für Karten/Listen). */
  kompakt?: boolean;
}) {
  const meta = AMPEL_META[ergebnis.level];

  if (kompakt) {
    return (
      <span
        title={meta.label}
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.cls}`}
      >
        <span className={`h-2 w-2 rounded-full ${meta.punkt}`} />
        {meta.kurz}
      </span>
    );
  }

  return (
    <div className={`rounded-xl p-4 ring-1 ${meta.cls}`}>
      <p className="flex items-center gap-2 font-semibold">
        <span className={`h-3 w-3 rounded-full ${meta.punkt}`} />
        Compliance-Ampel: {meta.label}
      </p>
      {ergebnis.flags.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {ergebnis.flags.map((f) => (
            <li key={f.code} className="flex items-start gap-1.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  f.sev === "RED" ? "bg-red-500" : "bg-amber-400"
                }`}
              />
              {f.text}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs opacity-75">
        Automatischer Hinweis aus dem hinterlegten Sicherheitsdatenblatt — keine Rechtsberatung.
        Maßgeblich ist das aktuelle Sicherheitsdatenblatt des Herstellers.
      </p>
    </div>
  );
}
