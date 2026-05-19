import { brandColors } from "@/lib/branding";

type Packaging = "DRUM" | "IBC" | "TANK" | "CANISTER" | "BULK" | "OTHER";

const sizeMap = {
  xs: "h-12 w-12",
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-36 w-36",
  xl: "h-56 w-56",
};

export function ProductImage({
  manufacturer,
  productName,
  packaging = "DRUM",
  size = "md",
  className = "",
}: {
  manufacturer: string;
  productName: string;
  packaging?: Packaging;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const colors = brandColors(manufacturer);
  const wrap = `relative shrink-0 aspect-square ${sizeMap[size]} ${className}`;
  const gid = `pi-${packaging}-${Math.abs(hash(`${manufacturer}-${productName}-${packaging}`))}`;
  return (
    <div className={wrap} aria-label={`${manufacturer} ${productName} (${packaging})`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {renderPackaging(packaging, colors, manufacturer, productName, gid)}
      </svg>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function renderPackaging(
  packaging: Packaging,
  colors: ReturnType<typeof brandColors>,
  brand: string,
  productName: string,
  gid: string,
) {
  switch (packaging) {
    case "IBC":
      return renderIbc(colors, brand, gid);
    case "CANISTER":
      return renderCanister(colors, brand, productName, gid);
    case "TANK":
      return renderTank(colors, brand, gid);
    case "BULK":
      return renderBulk(colors, brand, gid);
    case "OTHER":
    case "DRUM":
    default:
      return renderDrum(colors, brand, productName, gid);
  }
}

function shortName(productName: string): string {
  return productName
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map((p) => (/^[0-9]+$/.test(p) ? p : /^[A-Z]+[0-9]+/i.test(p) ? p.toUpperCase() : p[0]?.toUpperCase()))
    .join("")
    .slice(0, 6);
}

// ============================================================================
// Gemeinsame Gradient-Defs
// ============================================================================
function CommonDefs({ gid, primary }: { gid: string; primary: string }) {
  return (
    <defs>
      {/* Zylinder-Schattierung — vier Stops für weichere Rundung */}
      <linearGradient id={`${gid}-cyl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
        <stop offset="8%" stopColor="#000" stopOpacity="0.28" />
        <stop offset="35%" stopColor="#fff" stopOpacity="0.0" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="65%" stopColor="#fff" stopOpacity="0.0" />
        <stop offset="92%" stopColor="#000" stopOpacity="0.30" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.60" />
      </linearGradient>
      {/* Schmaler vertikaler Lichtstreifen für stärkeren Glanz */}
      <linearGradient id={`${gid}-shine`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      {/* Vertikale Tiefen-Schattierung mit kräftigem Schatten am unteren Drittel */}
      <linearGradient id={`${gid}-vert`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity="0.20" />
        <stop offset="15%" stopColor="#000" stopOpacity="0.04" />
        <stop offset="65%" stopColor="#000" stopOpacity="0.04" />
        <stop offset="85%" stopColor="#000" stopOpacity="0.20" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
      </linearGradient>
      {/* Stahl-Verlauf für Ringe und Deckel */}
      <linearGradient id={`${gid}-steel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="60%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      {/* Label-Hintergrund */}
      <linearGradient id={`${gid}-label`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
      {/* Boden-Schatten als radial verlaufendes Gauß-Profil */}
      <radialGradient id={`${gid}-ground`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
        <stop offset="40%" stopColor="#000" stopOpacity="0.28" />
        <stop offset="80%" stopColor="#000" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {/* Weicher Boden-Schatten-Filter (Gauß-Blur) */}
      <filter id={`${gid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
    </defs>
  );
}

/**
 * Weicher Boden-Schatten — wird unter dem Objekt platziert und wirkt durch
 * radialen Gradient + Gauß-Blur natürlich/diffus statt als harte Ellipse.
 */
function GroundShadow({
  cx,
  cy,
  rx,
  ry,
  gid,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gid: string;
}) {
  return (
    <g filter={`url(#${gid}-blur)`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${gid}-ground)`} />
    </g>
  );
}

// ============================================================================
// DRUM — realistisches 200-L-Stahlfass
// Proportionen 200L Fass: ~88 cm hoch × 58 cm Ø → ratio 1.52:1
// ============================================================================
function renderDrum(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  productName: string,
  gid: string,
) {
  const cx = 50;
  const top = 12;
  const bottom = 88;
  const rx = 25; // Halb-Breite → Breite 50, Höhe 76, Ratio 1.52 ✓
  const ryLid = 4.2;
  const bodyH = bottom - top;

  // Drei Stahlring-Y-Positionen
  const r1y = top + bodyH * 0.18;
  const r2y = top + bodyH * 0.5;
  const r3y = top + bodyH * 0.82;

  // Label-Band-Bereich
  const labelTop = r1y + 3;
  const labelBot = r3y - 3;

  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />

      {/* Weicher Boden-Schatten — radialer Verlauf mit Gauß-Blur, läuft nach
          außen aus wie auf dem Foto-Beispiel */}
      <GroundShadow cx={cx} cy={95} rx={rx + 8} ry={4.5} gid={gid} />
      <GroundShadow cx={cx} cy={94} rx={rx + 2} ry={2.5} gid={gid} />

      {/* Boden hinten (sichtbar als dunkle Ellipse) */}
      <ellipse cx={cx} cy={bottom + 0.5} rx={rx} ry={ryLid} fill="#000" opacity="0.55" />

      {/* Korpus-Grundfarbe */}
      <rect x={cx - rx} y={top} width={rx * 2} height={bodyH} fill={colors.primary} />

      {/* Vertikale Tiefen-Schattierung (oben/unten leicht dunkler) */}
      <rect x={cx - rx} y={top} width={rx * 2} height={bodyH} fill={`url(#${gid}-vert)`} />

      {/* Label-Band (Mitte) in Secondary-Color für den Shell-typischen
          rot-gelb-rot Look */}
      <rect
        x={cx - rx}
        y={labelTop - 1}
        width={rx * 2}
        height={labelBot - labelTop + 2}
        fill={colors.secondary}
      />

      {/* Zylinder-Schattierung über das ganze Fass für Rundungsillusion */}
      <rect x={cx - rx} y={top} width={rx * 2} height={bodyH} fill={`url(#${gid}-cyl)`} />

      {/* Vertikaler Glanzstreifen leicht links der Mitte */}
      <rect x={cx - rx + 4} y={top + 2} width="5" height={bodyH - 4} fill={`url(#${gid}-shine)`} />

      {/* Drei Stahlringe — realistischer mit Highlight + Schatten */}
      <SteelRing cx={cx} rx={rx} y={r1y} h={3.2} gid={gid} />
      <SteelRing cx={cx} rx={rx} y={r2y} h={3.2} gid={gid} />
      <SteelRing cx={cx} rx={rx} y={r3y} h={3.2} gid={gid} />

      {/* Etikett-Karte */}
      <g transform={`translate(${cx - rx + 4}, ${labelTop + 2})`}>
        <rect
          x="0"
          y="0"
          width={rx * 2 - 8}
          height={labelBot - labelTop - 4}
          rx="1.5"
          fill={`url(#${gid}-label)`}
        />
        {/* Subtiler Schatten unter dem Etikett */}
        <rect
          x="0"
          y={labelBot - labelTop - 4}
          width={rx * 2 - 8}
          height="0.5"
          fill="#000"
          opacity="0.18"
        />
        {/* Brand-Color-Streifen oben */}
        <rect x="0" y="0" width={rx * 2 - 8} height="3" fill={colors.primary} />
        <text
          x={(rx * 2 - 8) / 2}
          y={(labelBot - labelTop - 4) / 2 - 1}
          textAnchor="middle"
          fontSize="6"
          fontWeight="800"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill={colors.primary}
          letterSpacing="0.4"
        >
          {brand.toUpperCase().slice(0, 9)}
        </text>
        <text
          x={(rx * 2 - 8) / 2}
          y={(labelBot - labelTop - 4) / 2 + 5}
          textAnchor="middle"
          fontSize="4.2"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="#475569"
        >
          {shortName(productName)}
        </text>
        <text
          x={(rx * 2 - 8) / 2}
          y={labelBot - labelTop - 6}
          textAnchor="middle"
          fontSize="3.2"
          fontFamily="ui-monospace, monospace"
          fill="#94a3b8"
        >
          200 L
        </text>
      </g>

      {/* Oberer Deckel — Stahlring um die Öffnung */}
      {/* Äußerer Schatten unter dem Deckel */}
      <ellipse cx={cx} cy={top + 1.2} rx={rx} ry={ryLid} fill="#000" opacity="0.4" />
      {/* Stahl-Deckel */}
      <ellipse cx={cx} cy={top} rx={rx} ry={ryLid} fill={`url(#${gid}-steel)`} />
      {/* Vertiefte Oberfläche */}
      <ellipse cx={cx} cy={top + 0.3} rx={rx - 1.8} ry={ryLid - 1.3} fill="#64748b" />
      <ellipse cx={cx} cy={top + 0.3} rx={rx - 1.8} ry={ryLid - 1.3} fill={`url(#${gid}-steel)`} opacity="0.7" />
      {/* Spundloch (2") versetzt nach rechts */}
      <ellipse cx={cx + rx * 0.45} cy={top + 0.4} rx="1.6" ry="0.7" fill="#000" opacity="0.7" />
      <ellipse cx={cx + rx * 0.45} cy={top + 0.4} rx="1.2" ry="0.5" fill="#1e293b" />
      {/* Spundloch 3/4" versetzt nach links */}
      <ellipse cx={cx - rx * 0.45} cy={top + 0.4} rx="1.0" ry="0.45" fill="#000" opacity="0.7" />
    </>
  );
}

function SteelRing({
  cx,
  rx,
  y,
  h,
  gid,
}: {
  cx: number;
  rx: number;
  y: number;
  h: number;
  gid: string;
}) {
  return (
    <g>
      {/* Dunkler Schatten oberhalb */}
      <rect x={cx - rx - 0.4} y={y - h / 2 - 0.6} width={rx * 2 + 0.8} height="0.8" fill="#000" opacity="0.55" />
      {/* Stahlring-Korpus */}
      <rect
        x={cx - rx - 0.5}
        y={y - h / 2}
        width={rx * 2 + 1}
        height={h}
        fill={`url(#${gid}-steel)`}
      />
      {/* Helle Highlight-Linie auf der Oberseite */}
      <rect x={cx - rx - 0.5} y={y - h / 2} width={rx * 2 + 1} height="0.5" fill="#fff" opacity="0.7" />
      {/* Tiefer Schatten unten */}
      <rect x={cx - rx - 0.5} y={y + h / 2 - 0.5} width={rx * 2 + 1} height="0.5" fill="#000" opacity="0.5" />
      {/* Zylinder-Wölbung über den Ring (subtle, damit der Ring rund wirkt) */}
      <rect
        x={cx - rx - 0.5}
        y={y - h / 2}
        width={rx * 2 + 1}
        height={h}
        fill={`url(#${gid}-cyl)`}
        opacity="0.6"
      />
    </g>
  );
}

// ============================================================================
// IBC — isometrische 3D-Box mit Gitterkäfig (realistischer als vorher)
// ============================================================================
function renderIbc(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  gid: string,
) {
  const fx = 14,
    fy = 28,
    fw = 60,
    fh = 60;
  const dx = 14,
    dy = -10;

  const topPoly = [
    [fx, fy],
    [fx + fw, fy],
    [fx + fw + dx, fy + dy],
    [fx + dx, fy + dy],
  ]
    .map((p) => p.join(","))
    .join(" ");
  const rightPoly = [
    [fx + fw, fy],
    [fx + fw + dx, fy + dy],
    [fx + fw + dx, fy + fh + dy],
    [fx + fw, fy + fh],
  ]
    .map((p) => p.join(","))
    .join(" ");

  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />

      {/* Weicher Boden-Schatten */}
      <GroundShadow cx={50} cy={96} rx={46} ry={5} gid={gid} />

      {/* Holzpalette (Vorderkante) */}
      <rect x={fx - 2} y="89" width={fw + dx + 4} height="5" fill="#a78b6e" />
      <rect x={fx - 2} y="89" width={fw + dx + 4} height="1.5" fill="#000" opacity="0.25" />
      <rect x={fx + 2} y="89" width="3" height="5" fill="#000" opacity="0.5" />
      <rect x={fx + fw / 2 - 1.5} y="89" width="3" height="5" fill="#000" opacity="0.5" />
      <rect x={fx + fw - 5} y="89" width="3" height="5" fill="#000" opacity="0.5" />
      {/* Palette Tiefe (rechts) */}
      <polygon
        points={`${fx + fw + 2},89 ${fx + fw + dx + 2},${89 + dy * 0.3} ${fx + fw + dx + 2},${94 + dy * 0.3} ${fx + fw + 2},94`}
        fill="#7c6650"
      />

      {/* Rechte Seitenfläche (dunkler) */}
      <polygon points={rightPoly} fill={colors.primary} />
      <polygon points={rightPoly} fill="#000" opacity="0.35" />

      {/* Oberfläche */}
      <polygon points={topPoly} fill={colors.primary} />
      <polygon points={topPoly} fill="#000" opacity="0.18" />
      {/* Einfüllstutzen oben */}
      <ellipse
        cx={fx + fw / 2 + dx / 2}
        cy={fy + dy / 2}
        rx="6"
        ry="2.2"
        fill="#475569"
      />
      <ellipse
        cx={fx + fw / 2 + dx / 2}
        cy={fy + dy / 2}
        rx="6"
        ry="2.2"
        fill={`url(#${gid}-steel)`}
        opacity="0.7"
      />
      <ellipse
        cx={fx + fw / 2 + dx / 2}
        cy={fy + dy / 2 + 0.5}
        rx="3.8"
        ry="1.2"
        fill="#1e293b"
      />

      {/* Vorderfläche */}
      <rect x={fx} y={fy} width={fw} height={fh} fill={colors.primary} />
      <rect x={fx} y={fy} width={fw} height={fh} fill={`url(#${gid}-cyl)`} opacity="0.7" />
      <rect x={fx} y={fy} width={fw} height={fh} fill={`url(#${gid}-vert)`} opacity="0.6" />

      {/* Käfig-Gitter (Front) */}
      <g stroke="#334155" strokeWidth="0.8" opacity="0.9" fill="none">
        <rect x={fx} y={fy} width={fw} height={fh} />
        <line x1={fx} y1={fy + fh / 4} x2={fx + fw} y2={fy + fh / 4} />
        <line x1={fx} y1={fy + fh / 2} x2={fx + fw} y2={fy + fh / 2} />
        <line x1={fx} y1={fy + (fh * 3) / 4} x2={fx + fw} y2={fy + (fh * 3) / 4} />
        <line x1={fx + fw / 4} y1={fy} x2={fx + fw / 4} y2={fy + fh} />
        <line x1={fx + fw / 2} y1={fy} x2={fx + fw / 2} y2={fy + fh} />
        <line x1={fx + (fw * 3) / 4} y1={fy} x2={fx + (fw * 3) / 4} y2={fy + fh} />
      </g>
      {/* Käfig auf der Seitenfläche */}
      <g stroke="#334155" strokeWidth="0.6" opacity="0.85" fill="none">
        <line x1={fx + fw} y1={fy + fh / 4} x2={fx + fw + dx} y2={fy + fh / 4 + dy} />
        <line x1={fx + fw} y1={fy + fh / 2} x2={fx + fw + dx} y2={fy + fh / 2 + dy} />
        <line x1={fx + fw} y1={fy + (fh * 3) / 4} x2={fx + fw + dx} y2={fy + (fh * 3) / 4 + dy} />
        <line x1={fx + fw} y1={fy} x2={fx + fw + dx} y2={fy + dy} />
        <line x1={fx + fw} y1={fy + fh} x2={fx + fw + dx} y2={fy + fh + dy} />
      </g>

      {/* Ablassventil unten Mitte */}
      <rect x={fx + fw / 2 - 4} y={fy + fh - 1.5} width="8" height="4" fill="#475569" rx="0.5" />
      <circle cx={fx + fw / 2} cy={fy + fh + 0.5} r="1.5" fill="#1e293b" />
      <rect x={fx + fw / 2 - 1} y={fy + fh + 2.5} width="2" height="4" fill="#334155" />

      {/* Etikett vorne */}
      <g transform={`translate(${fx + 5}, ${fy + fh / 2 - 11})`}>
        <rect x="0" y="0" width={fw - 10} height="22" fill={`url(#${gid}-label)`} rx="1.2" />
        <rect x="0" y="0" width={fw - 10} height="3.5" fill={colors.primary} />
        <text
          x={(fw - 10) / 2}
          y="12"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="800"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill={colors.primary}
        >
          {brand.toUpperCase().slice(0, 9)}
        </text>
        <text
          x={(fw - 10) / 2}
          y="19"
          textAnchor="middle"
          fontSize="3.6"
          fontFamily="ui-monospace, monospace"
          fill="#64748b"
        >
          IBC · 1000 L
        </text>
      </g>
    </>
  );
}

// ============================================================================
// CANISTER — 20L Kanister mit Griff
// ============================================================================
function renderCanister(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  productName: string,
  gid: string,
) {
  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />
      <GroundShadow cx={50} cy={94} rx={26} ry={4} gid={gid} />

      {/* Schulter (oben) */}
      <path
        d="M 30 22 L 30 18 Q 30 14 34 14 L 66 14 Q 70 14 70 18 L 70 22 Z"
        fill={colors.primary}
      />
      <path
        d="M 30 22 L 30 18 Q 30 14 34 14 L 66 14 Q 70 14 70 18 L 70 22 Z"
        fill="#000"
        opacity="0.25"
      />

      {/* Korpus */}
      <rect x="30" y="22" width="40" height="68" fill={colors.primary} rx="2.5" />
      <rect x="30" y="22" width="40" height="68" fill={`url(#${gid}-cyl)`} />
      <rect x="30" y="22" width="40" height="68" fill={`url(#${gid}-vert)`} opacity="0.5" />
      {/* Glanzstreifen */}
      <rect x="34" y="24" width="3" height="62" fill={`url(#${gid}-shine)`} opacity="0.6" />

      {/* Verschluss-Kappe */}
      <rect x="54" y="6" width="14" height="8" fill={colors.secondary} rx="1.5" />
      <rect x="54" y="6" width="14" height="8" fill={`url(#${gid}-cyl)`} />
      <ellipse cx="61" cy="6.5" rx="6.5" ry="1.6" fill="#000" opacity="0.35" />

      {/* Griff */}
      <path
        d="M 38 14 L 38 4 Q 38 1 41 1 L 49 1 Q 52 1 52 4 L 52 14"
        fill="none"
        stroke={colors.primary}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <path
        d="M 38 14 L 38 4 Q 38 1 41 1 L 49 1 Q 52 1 52 4 L 52 14"
        fill="none"
        stroke="#000"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Etikett */}
      <g transform="translate(33, 36)">
        <rect x="0" y="0" width="34" height="44" fill={`url(#${gid}-label)`} rx="1.5" />
        <rect x="0" y="0" width="34" height="3.5" fill={colors.primary} />
        <text x="17" y="15" textAnchor="middle" fontSize="6" fontWeight="800" fontFamily="ui-sans-serif, system-ui, sans-serif" fill={colors.primary}>
          {brand.toUpperCase().slice(0, 8)}
        </text>
        <text x="17" y="24" textAnchor="middle" fontSize="4.6" fontFamily="ui-sans-serif, system-ui, sans-serif" fill="#475569">
          {shortName(productName)}
        </text>
        <text x="17" y="40" textAnchor="middle" fontSize="3.4" fontFamily="ui-monospace, monospace" fill="#94a3b8">
          20 L
        </text>
      </g>
    </>
  );
}

// ============================================================================
// TANK — horizontaler 3D-Tank
// ============================================================================
function renderTank(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  gid: string,
) {
  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />
      <GroundShadow cx={50} cy={89} rx={44} ry={4} gid={gid} />

      {/* Hinterer Deckel (links, leicht verschattet) */}
      <ellipse cx="14" cy="63" rx="6" ry="21" fill={colors.primary} />
      <ellipse cx="14" cy="63" rx="6" ry="21" fill="#000" opacity="0.4" />

      {/* Hauptzylinder */}
      <rect x="14" y="42" width="72" height="42" fill={colors.primary} rx="14" />
      <rect x="14" y="42" width="72" height="42" fill={`url(#${gid}-cyl)`} rx="14" />
      <rect x="14" y="42" width="72" height="42" fill={`url(#${gid}-vert)`} rx="14" opacity="0.6" />

      {/* Vorderer Deckel (rechts) */}
      <ellipse cx="86" cy="63" rx="6" ry="21" fill={colors.primary} />
      <ellipse cx="86" cy="63" rx="6" ry="21" fill="#fff" opacity="0.18" />

      {/* Mannloch oben */}
      <rect x="42" y="32" width="16" height="12" fill={`url(#${gid}-steel)`} rx="2" />
      <ellipse cx="50" cy="32" rx="8" ry="2.2" fill="#000" opacity="0.45" />
      <circle cx="50" cy="38" r="2" fill="#1e293b" />

      {/* Standfüße */}
      <rect x="20" y="83" width="6" height="7" fill="#475569" rx="1" />
      <rect x="74" y="83" width="6" height="7" fill="#475569" rx="1" />
      <rect x="20" y="89" width="6" height="1.5" fill="#000" opacity="0.4" />
      <rect x="74" y="89" width="6" height="1.5" fill="#000" opacity="0.4" />

      {/* Etikett */}
      <g transform="translate(24, 56)">
        <rect x="0" y="0" width="52" height="18" fill={`url(#${gid}-label)`} rx="1.2" />
        <rect x="0" y="0" width="52" height="3.2" fill={colors.primary} />
        <text x="26" y="11" textAnchor="middle" fontSize="6.5" fontWeight="800" fontFamily="ui-sans-serif, system-ui, sans-serif" fill={colors.primary}>
          {brand.toUpperCase().slice(0, 9)}
        </text>
        <text x="26" y="16" textAnchor="middle" fontSize="3.4" fontFamily="ui-monospace, monospace" fill="#64748b">
          TANK
        </text>
      </g>
    </>
  );
}

// ============================================================================
// BULK — Trichter
// ============================================================================
function renderBulk(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  gid: string,
) {
  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />
      <GroundShadow cx={50} cy={92} rx={40} ry={4} gid={gid} />
      <path d="M 14 84 L 50 28 L 86 84 Z" fill={colors.primary} />
      <path d="M 14 84 L 50 28 L 86 84 Z" fill={`url(#${gid}-cyl)`} />
      <circle cx="50" cy="40" r="5" fill={colors.secondary} />
      <circle cx="50" cy="40" r="5" fill={`url(#${gid}-steel)`} opacity="0.3" />
      <g transform="translate(34, 62)">
        <rect x="0" y="0" width="32" height="14" fill={`url(#${gid}-label)`} rx="1.2" />
        <rect x="0" y="0" width="32" height="3" fill={colors.primary} />
        <text x="16" y="10" textAnchor="middle" fontSize="6" fontWeight="800" fontFamily="ui-sans-serif, system-ui, sans-serif" fill={colors.primary}>
          {brand.toUpperCase().slice(0, 9)}
        </text>
      </g>
    </>
  );
}
