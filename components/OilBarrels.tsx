// Ölfässer für die Startseite (Vektor, kein externes Bild).
//
// Zweite Fassung (Betreiber 2026-08-12): „Die Fässer müssen klarer dargestellt
// sein, so dass man tatsächlich erkennt, dass es sich um Fässer handelt." Die
// erste Fassung hatte feine Sicken und weiche Verläufe — bei 44 px sahen sie
// aus wie Zylinder. Jetzt: kräftige dunkle Umrisse, breite Spannringe, ein
// deutlich abgesetzter Deckel mit Falzring und zwei Spundlöchern — die Merkmale,
// an denen man ein Fass auch klein erkennt.
export function OilBarrels({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 62" className={className} role="img" aria-label="Ölfässer" fill="none">
      <defs>
        <linearGradient id="obG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#26242a" />
          <stop offset=".38" stopColor="#6b6870" />
          <stop offset=".5" stopColor="#8d8a92" />
          <stop offset=".62" stopColor="#57545b" />
          <stop offset="1" stopColor="#201e23" />
        </linearGradient>
        <linearGradient id="obL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f5409" />
          <stop offset=".38" stopColor="#94bd18" />
          <stop offset=".5" stopColor="#b7dd3c" />
          <stop offset=".62" stopColor="#7ba014" />
          <stop offset="1" stopColor="#38490a" />
        </linearGradient>
        <linearGradient id="obS" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6a6f72" />
          <stop offset=".38" stopColor="#b6bbbe" />
          <stop offset=".5" stopColor="#e3e7e9" />
          <stop offset=".62" stopColor="#9ca1a4" />
          <stop offset="1" stopColor="#63686b" />
        </linearGradient>
      </defs>

      {/* Bodenschatten */}
      <ellipse cx="66" cy="57.5" rx="50" ry="3.2" fill="#000" opacity=".13" />

      {/* Fass links: graphit */}
      <g transform="translate(3 12)">
        <path d="M1,6 L1,40 A15,3.6 0 0 0 31,40 L31,6 Z" fill="url(#obG)" stroke="#141317" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Spannringe: breit und dunkel — das Fass-Merkmal schlechthin */}
        <path d="M1,14.5 A15,3.4 0 0 0 31,14.5 L31,18 A15,3.4 0 0 1 1,18 Z" fill="#141317" opacity=".85" />
        <path d="M1,28 A15,3.4 0 0 0 31,28 L31,31.5 A15,3.4 0 0 1 1,31.5 Z" fill="#141317" opacity=".85" />
        <ellipse cx="16" cy="6" rx="15" ry="3.6" fill="#4c4950" stroke="#141317" strokeWidth="1.6" />
        <ellipse cx="16" cy="6" rx="11.5" ry="2.5" fill="none" stroke="#141317" strokeWidth="1.1" opacity=".8" />
        <ellipse cx="10.5" cy="5.4" rx="2" ry=".9" fill="#26242a" stroke="#8f8c94" strokeWidth=".5" />
        <ellipse cx="8" cy="24" rx="1.8" ry="12" fill="#fff" opacity=".1" />
      </g>

      {/* Fass rechts: stahl */}
      <g transform="translate(97 12)">
        <path d="M1,6 L1,40 A15,3.6 0 0 0 31,40 L31,6 Z" fill="url(#obS)" stroke="#3f4447" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M1,14.5 A15,3.4 0 0 0 31,14.5 L31,18 A15,3.4 0 0 1 1,18 Z" fill="#3f4447" opacity=".8" />
        <path d="M1,28 A15,3.4 0 0 0 31,28 L31,31.5 A15,3.4 0 0 1 1,31.5 Z" fill="#3f4447" opacity=".8" />
        <ellipse cx="16" cy="6" rx="15" ry="3.6" fill="#cfd4d6" stroke="#3f4447" strokeWidth="1.6" />
        <ellipse cx="16" cy="6" rx="11.5" ry="2.5" fill="none" stroke="#3f4447" strokeWidth="1.1" opacity=".75" />
        <ellipse cx="10.5" cy="5.4" rx="2" ry=".9" fill="#9ca1a4" stroke="#f4f7f7" strokeWidth=".5" />
        <ellipse cx="8" cy="24" rx="1.8" ry="12" fill="#fff" opacity=".22" />
      </g>

      {/* Fass Mitte: lime, größer und vorn */}
      <g transform="translate(44 5)">
        <path d="M1,7 L1,47 A18,4.2 0 0 0 37,47 L37,7 Z" fill="url(#obL)" stroke="#2b3907" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M1,17.5 A18,4 0 0 0 37,17.5 L37,21.6 A18,4 0 0 1 1,21.6 Z" fill="#2b3907" opacity=".85" />
        <path d="M1,33 A18,4 0 0 0 37,33 L37,37.1 A18,4 0 0 1 1,37.1 Z" fill="#2b3907" opacity=".85" />
        <ellipse cx="19" cy="7" rx="18" ry="4.2" fill="#a8cf2a" stroke="#2b3907" strokeWidth="1.8" />
        <ellipse cx="19" cy="7" rx="13.8" ry="3" fill="none" stroke="#2b3907" strokeWidth="1.2" opacity=".8" />
        <ellipse cx="12.5" cy="6.3" rx="2.4" ry="1.1" fill="#78a013" stroke="#e6f6ac" strokeWidth=".5" />
        <ellipse cx="26" cy="5.8" rx="1.6" ry=".8" fill="#78a013" stroke="#e6f6ac" strokeWidth=".45" />
        <ellipse cx="9" cy="27" rx="2.2" ry="14" fill="#fff" opacity=".14" />
      </g>
    </svg>
  );
}

/**
 * Realitätsnahe „Suchen"-Grafik: Lupe über einem stilisierten Kanister —
 * gleiche Bildsprache wie die Fässer (Metall-/Glasverläufe statt Emoji).
 */
export function SearchCanister({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} role="img" aria-label="Produkt suchen" fill="none">
      <defs>
        <linearGradient id="scC" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a4d0b" />
          <stop offset=".3" stopColor="#d97706" />
          <stop offset=".5" stopColor="#f2a641" />
          <stop offset=".7" stopColor="#d97706" />
          <stop offset="1" stopColor="#8a4d0b" />
        </linearGradient>
        <radialGradient id="scGlass" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#eaf6ff" stopOpacity=".95" />
          <stop offset=".6" stopColor="#cfe8f7" stopOpacity=".7" />
          <stop offset="1" stopColor="#9fc9e4" stopOpacity=".55" />
        </radialGradient>
      </defs>

      {/* Kanister */}
      <g transform="translate(6 8)">
        <ellipse cx="17" cy="40" rx="17" ry="2.6" fill="#000" opacity=".14" />
        <rect x="2" y="6" width="30" height="34" rx="3.5" fill="url(#scC)" stroke="#7c3a06" strokeWidth="1" />
        <rect x="6.5" y="14" width="21" height="14" rx="2" fill="#fff" opacity=".92" />
        <rect x="6.5" y="14" width="21" height="14" rx="2" fill="none" stroke="#00000022" strokeWidth=".6" />
        <path d="M9 18 h16 M9 21.5 h12 M9 25 h14" stroke="#a8a29e" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="8" y="1.5" width="8" height="6" rx="1.5" fill="#b45309" stroke="#7c3a06" strokeWidth="1" />
        <ellipse cx="9" cy="22" rx="1.8" ry="12" fill="#fff" opacity=".22" />
      </g>

      {/* Lupe */}
      <g transform="translate(30 12)">
        <circle cx="13" cy="13" r="11.5" fill="url(#scGlass)" stroke="#475569" strokeWidth="3" />
        <circle cx="13" cy="13" r="11.5" fill="none" stroke="#94a3b8" strokeWidth="1" opacity=".6" />
        <path d="M9 8.5 a6.5 6.5 0 0 1 5-1.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".85" />
        <rect x="20.6" y="20.3" width="12" height="5" rx="2.5" transform="rotate(45 20.6 20.3)" fill="#334155" />
        <rect x="21.6" y="21.6" width="9.5" height="2.2" rx="1.1" transform="rotate(45 21.6 21.6)" fill="#64748b" />
      </g>
    </svg>
  );
}
