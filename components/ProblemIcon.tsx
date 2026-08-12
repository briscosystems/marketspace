/**
 * Sinnbild für „Problem klären": ein Kopf/Gehirn mit Fragezeichen und drei
 * Belegen, die hineinfließen (Foto, Datenblatt, Laborbericht).
 *
 * Warum kein Fotoapparat mehr (Betreiber 2026-08-12): Die Problemklärung ist
 * mehr als ein Bild — Text, Sicherheitsdatenblatt, Datenblatt, Laborbericht,
 * Forenbeitrag und Erfahrungen anderer gehören dazu. Das Symbol muss das
 * Denken zeigen, nicht die Kamera.
 */
export function BrainQuestion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Problem klären" fill="none">
      {/* Gehirn: zwei Hälften mit Windungen */}
      <path
        d="M20.5 9.5c-3.4 0-5.6 1.9-6.2 4.2-2.6.4-4.4 2.4-4.4 4.9 0 1.3.5 2.5 1.3 3.4-.9.9-1.4 2-1.4 3.3 0 2.3 1.6 4.2 3.9 4.8.2 2.7 2.6 4.7 5.7 4.7 1.2 0 2.2-.3 3-.8V9.9c-.6-.3-1.2-.4-1.9-.4Z"
        fill="currentColor"
        opacity=".18"
      />
      <path
        d="M20.5 9.5c-3.4 0-5.6 1.9-6.2 4.2-2.6.4-4.4 2.4-4.4 4.9 0 1.3.5 2.5 1.3 3.4-.9.9-1.4 2-1.4 3.3 0 2.3 1.6 4.2 3.9 4.8.2 2.7 2.6 4.7 5.7 4.7 1.2 0 2.2-.3 3-.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.4 9.9v29.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".55"
      />
      <path
        d="M14.3 13.7c1.6.5 2.7 1.6 3.2 3.1M11.2 22c1.8.6 3.6.3 5-.9M13.7 30.1c1.5-.9 2.7-2.3 3.2-3.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".7"
      />
      {/* rechte Hälfte, offen für das Fragezeichen */}
      <path
        d="M24.6 9.9c1.1-.4 2.4-.5 3.6-.2 2.6.6 4.3 2.4 4.7 4.4 2.5.5 4.2 2.4 4.2 4.8 0 1.2-.4 2.3-1.2 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fragezeichen */}
      <path
        d="M27.6 20.4c0-2.2 1.8-3.9 4-3.9s4 1.7 4 3.7c0 1.7-1 2.6-2.4 3.5-1.2.8-1.9 1.5-1.9 3v.6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31.3" cy="31.6" r="1.6" fill="currentColor" />
      {/* Belege, die hineinfließen */}
      <rect x="4" y="36.5" width="7.5" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.8 41.4l1.6-1.8 1.6 1.8 1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="14.5" y="36.5" width="7.5" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.3 38.6h4M16.3 40.4h4M16.3 42.1h2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="25" y="36.5" width="7.5" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M26.8 41.9l1.7-2.4 1.5 1.4 1.3-1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
