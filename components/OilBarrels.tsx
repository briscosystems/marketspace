// Realitätsnahe Ölfässer für die Startseite (Vektor, kein externes Bild):
// Metall-Verläufe, Sicken mit Licht-/Schattenkante, Deckel mit Falzring und
// Spundloch — gleiche Bildsprache wie im Fact Sheet. Skaliert über className.
export function OilBarrels({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 62" className={className} role="img" aria-label="Ölfässer" fill="none">
      <defs>
        {/* Graphit */}
        <linearGradient id="obG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#232122" />
          <stop offset=".16" stopColor="#3f3d3e" />
          <stop offset=".34" stopColor="#636162" />
          <stop offset=".46" stopColor="#8d8b8c" />
          <stop offset=".52" stopColor="#636162" />
          <stop offset=".82" stopColor="#312f30" />
          <stop offset="1" stopColor="#1d1b1c" />
        </linearGradient>
        <radialGradient id="obGc" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#8f8d8b" />
          <stop offset="1" stopColor="#3a3839" />
        </radialGradient>
        {/* Lime (Brisco-Akzent) */}
        <linearGradient id="obL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#41560a" />
          <stop offset=".16" stopColor="#6f9310" />
          <stop offset=".34" stopColor="#a6d21e" />
          <stop offset=".46" stopColor="#cbe95f" />
          <stop offset=".52" stopColor="#a6d21e" />
          <stop offset=".82" stopColor="#54700b" />
          <stop offset="1" stopColor="#3a4e08" />
        </linearGradient>
        <radialGradient id="obLc" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d2ed74" />
          <stop offset="1" stopColor="#7c9f13" />
        </radialGradient>
        {/* Stahl */}
        <linearGradient id="obS" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5d6264" />
          <stop offset=".16" stopColor="#8e9395" />
          <stop offset=".34" stopColor="#bfc4c5" />
          <stop offset=".46" stopColor="#eef1f1" />
          <stop offset=".52" stopColor="#bfc4c5" />
          <stop offset=".82" stopColor="#787d7f" />
          <stop offset="1" stopColor="#575c5e" />
        </linearGradient>
        <radialGradient id="obSc" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f0f3f3" />
          <stop offset="1" stopColor="#9fa4a6" />
        </radialGradient>
      </defs>

      {/* Bodenschatten */}
      <ellipse cx="66" cy="58" rx="52" ry="3.4" fill="#000" opacity=".14" />

      {/* Fass links: graphit */}
      <g transform="translate(2 8)">
        <path d="M0,6 L0,44 A16,3.4 0 0 0 32,44 L32,6 Z" fill="url(#obG)" />
        <path d="M0,17 A16,3.2 0 0 0 32,17" stroke="#141314" strokeWidth="1.4" />
        <path d="M0,16.2 A16,3.2 0 0 0 32,16.2" stroke="#9b999a" strokeWidth=".5" opacity=".5" />
        <path d="M0,33 A16,3.2 0 0 0 32,33" stroke="#141314" strokeWidth="1.4" />
        <path d="M0,32.2 A16,3.2 0 0 0 32,32.2" stroke="#9b999a" strokeWidth=".5" opacity=".5" />
        <ellipse cx="10" cy="25" rx="2.4" ry="16" fill="#fff" opacity=".1" />
        <ellipse cx="16" cy="6" rx="16" ry="3.4" fill="url(#obGc)" stroke="#232122" strokeWidth=".7" />
        <ellipse cx="16" cy="6.1" rx="12.6" ry="2.6" fill="none" stroke="#161516" strokeWidth=".5" opacity=".7" />
        <ellipse cx="10.5" cy="5.6" rx="2" ry=".85" fill="#2c2a2b" stroke="#8a8889" strokeWidth=".3" />
      </g>

      {/* Fass rechts: stahl */}
      <g transform="translate(98 8)">
        <path d="M0,6 L0,44 A16,3.4 0 0 0 32,44 L32,6 Z" fill="url(#obS)" />
        <path d="M0,17 A16,3.2 0 0 0 32,17" stroke="#54595b" strokeWidth="1.4" />
        <path d="M0,16.2 A16,3.2 0 0 0 32,16.2" stroke="#fdfefe" strokeWidth=".5" opacity=".7" />
        <path d="M0,33 A16,3.2 0 0 0 32,33" stroke="#54595b" strokeWidth="1.4" />
        <path d="M0,32.2 A16,3.2 0 0 0 32,32.2" stroke="#fdfefe" strokeWidth=".5" opacity=".7" />
        <ellipse cx="10" cy="25" rx="2.4" ry="16" fill="#fff" opacity=".2" />
        <ellipse cx="16" cy="6" rx="16" ry="3.4" fill="url(#obSc)" stroke="#6f7476" strokeWidth=".7" />
        <ellipse cx="16" cy="6.1" rx="12.6" ry="2.6" fill="none" stroke="#63686a" strokeWidth=".5" opacity=".7" />
        <ellipse cx="10.5" cy="5.6" rx="2" ry=".85" fill="#b9bec0" stroke="#fdfefe" strokeWidth=".3" />
      </g>

      {/* Fass Mitte: lime, leicht größer und vorn */}
      <g transform="translate(45 2)">
        <path d="M0,7 L0,50 A19,4 0 0 0 38,50 L38,7 Z" fill="url(#obL)" />
        <path d="M0,20 A19,3.8 0 0 0 38,20" stroke="#2f3f07" strokeWidth="1.6" />
        <path d="M0,19.1 A19,3.8 0 0 0 38,19.1" stroke="#d8f08a" strokeWidth=".6" opacity=".6" />
        <path d="M0,38 A19,3.8 0 0 0 38,38" stroke="#2f3f07" strokeWidth="1.6" />
        <path d="M0,37.1 A19,3.8 0 0 0 38,37.1" stroke="#d8f08a" strokeWidth=".6" opacity=".6" />
        <ellipse cx="12" cy="28" rx="2.8" ry="19" fill="#fff" opacity=".14" />
        <ellipse cx="19" cy="7" rx="19" ry="4" fill="url(#obLc)" stroke="#4e6b09" strokeWidth=".8" />
        <ellipse cx="19" cy="7.1" rx="15" ry="3.1" fill="none" stroke="#48620a" strokeWidth=".6" opacity=".75" />
        <ellipse cx="12.5" cy="6.5" rx="2.3" ry="1" fill="#7ea315" stroke="#e2f3a4" strokeWidth=".35" />
        <ellipse cx="26" cy="5.9" rx="1.5" ry=".7" fill="#7ea315" stroke="#e2f3a4" strokeWidth=".3" />
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
