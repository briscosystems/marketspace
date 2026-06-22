// Ölfässer-Icon für die Startseite — ersetzt das frühere 📦-Emoji auf der
// "Anbieten"-Karte. Reines SVG (kein externes Bild), skaliert über className.
export function OilBarrels({ className }: { className?: string }) {
  // Ein einzelnes Fass: Mantel, oberer Deckel und zwei Spannringe.
  function Barrel({ x }: { x: number }) {
    return (
      <g transform={`translate(${x} 0)`}>
        {/* Fasskörper */}
        <rect x="0" y="6" width="18" height="34" rx="3" fill="#d97706" stroke="#7c3a06" strokeWidth="1.5" />
        {/* Deckel */}
        <ellipse cx="9" cy="6" rx="9" ry="3.2" fill="#f59e0b" stroke="#7c3a06" strokeWidth="1.5" />
        {/* Spannringe */}
        <rect x="0" y="15" width="18" height="3" fill="#b45309" />
        <rect x="0" y="28" width="18" height="3" fill="#b45309" />
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 64 44"
      className={className}
      role="img"
      aria-label="Ölfässer"
      fill="none"
    >
      {/* Hinteres Fass leicht versetzt, davor zwei nebeneinander */}
      <g opacity="0.85">
        <Barrel x={22} />
      </g>
      <Barrel x={4} />
      <Barrel x={40} />
    </svg>
  );
}
