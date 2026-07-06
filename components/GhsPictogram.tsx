/**
 * GHS-/CLP-Gefahrenpiktogramme als eigenständige SVG-Symbole (keine externen
 * Bild-Assets nötig). Die rote Warnraute ist die gesetzlich standardisierte Form
 * der CLP-Verordnung (EG 1272/2008) im Rahmen von REACH.
 *
 * Eingabe ist der GHS-Code (z.B. "GHS07"), wie er in SafetyDataSheet.ghsPictograms
 * gespeichert ist. Unbekannte Codes werden robust ignoriert.
 */

export const GHS_NAMES: Record<string, string> = {
  GHS01: "Explosiv",
  GHS02: "Entzündbar",
  GHS03: "Brandfördernd (oxidierend)",
  GHS04: "Gase unter Druck",
  GHS05: "Ätzend / korrosiv",
  GHS06: "Giftig (akut toxisch)",
  GHS07: "Reizend / gesundheitsschädlich",
  GHS08: "Gesundheitsgefahr (CMR)",
  GHS09: "Umweltgefährlich (gewässergefährdend)",
};

const RED = "#d9251d";

// Symbol-Innenteil (schwarz) je Code. Zeichenfläche: 100×100-Raute, Motiv grob in
// x/y 26…74. Vereinfachte, aber eindeutig erkennbare Vektor-Motive.
const SYMBOLS: Record<string, React.ReactNode> = {
  GHS01: (
    // Explodierende Kugel — Berstlinien + zentrale Kugel
    <g fill="#000">
      <path d="M50 24 l4 12 8-8-3 12 12-3-9 8 12 4-13 1 7 10-11-6 1 12-6-11-6 11 1-12-11 6 7-10-13-1 12-4-9-8 12 3-3-12 8 8z" />
      <circle cx="50" cy="52" r="8" />
    </g>
  ),
  GHS02: (
    // Flamme über Grundlinie
    <g fill="#000">
      <path d="M53 27c5 9-4 12 1 19 6-3 5-11 1-16 8 7 11 19 4 28-4 6-14 6-19 0-6-7-2-16 4-19-2 6 1 9 4 5 3-5-3-10-1-16 3 4 5 3 1-1z" />
      <rect x="30" y="70" width="40" height="4" rx="2" />
    </g>
  ),
  GHS03: (
    // Flamme über Kreis mit Grundlinie (oxidierend)
    <g fill="#000">
      <path d="M52 26c4 7-3 10 1 15 5-2 4-9 1-13 6 6 9 15 3 22-3 5-11 5-15 0-5-6-2-13 3-15-1 5 1 7 3 4 3-4-2-8-1-13 3 3 4 2 1 0z" />
      <path d="M32 60 A18 12 0 0 0 68 60" fill="none" stroke="#000" strokeWidth="4" />
      <rect x="30" y="70" width="40" height="4" rx="2" />
    </g>
  ),
  GHS04: (
    // Gasflasche (Druckgas)
    <g fill="#000">
      <rect x="43" y="28" width="14" height="8" rx="2" />
      <path d="M40 36h20a4 4 0 0 1 4 4v26a6 6 0 0 1-6 6H42a6 6 0 0 1-6-6V40a4 4 0 0 1 4-4z" />
    </g>
  ),
  GHS05: (
    // Zwei Reagenzgläser tropfen auf eine Fläche (links) und eine Hand (rechts) — Korrosion
    <g fill="#000">
      {/* linkes Reagenzglas, nach rechts-unten geneigt, gießt aus */}
      <g transform="rotate(38 38 36)">
        <rect x="34" y="24" width="8" height="22" rx="1.5" />
      </g>
      {/* rechtes Reagenzglas, nach links-unten geneigt, gießt aus */}
      <g transform="rotate(-38 62 36)">
        <rect x="58" y="24" width="8" height="22" rx="1.5" />
      </g>
      {/* Tropfen */}
      <path d="M35 50 l2.5 5h-5z" />
      <path d="M65 50 l2.5 5h-5z" />
      {/* linke Fläche mit Ätz-Kerbe */}
      <path d="M24 62h22l-4 5-3-4-3 4-4-4-4 4z" />
      {/* rechte Hand, von Säure angegriffen (Kerbe) */}
      <path d="M52 68c-1-4 1-7 4-8l1-6 3 1-1 5 2-0 1-6 3 1-1 5 2 1 1-4 3 1-1 5c2 2 2 5 1 8z" />
    </g>
  ),
  GHS06: (
    // Totenkopf mit gekreuzten Knochen
    <g fill="#000">
      <path d="M30 68 l40-24M30 44 l40 24" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      <circle cx="46" cy="46" r="4" fill="#fff" />
      <circle cx="46" cy="46" r="4" />
      <path d="M50 30c-11 0-19 7-19 17 0 6 3 10 6 12v5h4v-3h4v3h4v-3h4v3h4v-3h4v3h4v-5c3-2 6-6 6-12 0-10-8-17-19-17z" fill="#000" />
      <circle cx="43" cy="48" r="3.5" fill="#fff" />
      <circle cx="57" cy="48" r="3.5" fill="#fff" />
      <path d="M50 54 l-3 6h6z" fill="#fff" />
    </g>
  ),
  GHS07: (
    // Ausrufezeichen
    <g fill="#000">
      <rect x="46" y="30" width="8" height="26" rx="4" />
      <circle cx="50" cy="66" r="5" />
    </g>
  ),
  GHS08: (
    // Rumpf-Silhouette mit Stern-Aufbruch auf der Brust (systemische Gefahr)
    <g fill="#000">
      <path d="M50 26c-9 0-16 7-16 16v20a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6V42c0-9-7-16-16-16z" />
      <path d="M50 40 l3 7 7-2-4 6 5 5-7 1-1 7-3-6-6 3 2-7-6-3 7-2z" fill="#fff" />
    </g>
  ),
  GHS09: (
    // Umwelt: Wasserlinie, toter Baum, Fisch
    <g fill="#000">
      <path d="M28 58 q6-4 12 0 t12 0 12 0 8 0" fill="none" stroke="#000" strokeWidth="4" />
      <path d="M40 56V34m0 4l-7-6m7 12l7-7" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 66c6 0 12-4 14-7-2-3-8-7-14-7-4 0-7 2-9 4 3 1 3 5 0 6 2 2 5 4 9 4z" />
      <path d="M66 59l6-4v8z" />
      <circle cx="56" cy="57" r="1.4" fill="#fff" />
    </g>
  ),
};

/** Ein einzelnes Piktogramm (rote Raute mit schwarzem Motiv). */
export function GhsPictogram({
  code,
  size = 40,
  title,
}: {
  code: string;
  size?: number;
  title?: string;
}) {
  const symbol = SYMBOLS[code];
  if (!symbol) return null;
  const label = title ?? GHS_NAMES[code] ?? code;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <title>{label}</title>
      {/* Weiße Raute mit rotem Rand */}
      <polygon points="50,3 97,50 50,97 3,50" fill="#fff" stroke={RED} strokeWidth="8" strokeLinejoin="round" />
      {symbol}
    </svg>
  );
}

/** Reihe von Piktogrammen aus einer Liste von GHS-Codes. */
export function GhsPictogramRow({
  codes,
  size = 40,
}: {
  codes: string[];
  size?: number;
}) {
  const valid = codes.filter((c) => SYMBOLS[c]);
  if (valid.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {valid.map((c) => (
        <GhsPictogram key={c} code={c} size={size} />
      ))}
    </div>
  );
}
