import { brandColors } from "@/lib/branding";
import { getLogoPath } from "@/lib/brand-logo-registry";
import { withBasePath } from "@/lib/base-path";

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
  const rawLogo = getLogoPath(manufacturer);
  const logoPath = rawLogo ? withBasePath(rawLogo) : null;
  return (
    <div className={wrap} aria-label={`${manufacturer} ${productName} (${packaging})`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {renderPackaging(packaging, colors, manufacturer, gid, logoPath)}
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
  gid: string,
  logoPath: string | null,
) {
  switch (packaging) {
    case "IBC":
      return renderIbc(colors, brand, gid, logoPath);
    case "CANISTER":
      return renderCanister(colors, brand, gid, logoPath);
    case "TANK":
      return renderTank(colors, brand, gid, logoPath);
    case "BULK":
      return renderBulk(colors, brand, gid, logoPath);
    case "OTHER":
    case "DRUM":
    default:
      return renderDrum(colors, brand, gid, logoPath);
  }
}

/**
 * Etikett-Inhalt: echtes Logo wenn unter /brand-logos/<slug>.png hinterlegt,
 * sonst stilisiertes Wordmark in Marken-Primärfarbe.
 */
function LabelContent({
  width,
  height,
  brand,
  logoPath,
  primary,
}: {
  width: number;
  height: number;
  brand: string;
  logoPath: string | null;
  primary: string;
}) {
  if (logoPath) {
    // Einbettung des echten Logos. preserveAspectRatio meet → Logo zentriert
    // und vollständig sichtbar, mit kleinem Padding.
    const pad = Math.min(width, height) * 0.08;
    return (
      <image
        href={logoPath}
        x={pad}
        y={pad}
        width={width - pad * 2}
        height={height - pad * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }
  return (
    <text
      x={width / 2}
      y={height / 2 + 3}
      textAnchor="middle"
      fontSize={Math.min(11, Math.max(7, width / brandFitLength(brand)))}
      fontWeight="800"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fill={primary}
      letterSpacing="0.4"
    >
      {brand.toUpperCase()}
    </text>
  );
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
  gid: string,
  logoPath: string | null,
) {
  const cx = 50;
  const top = 12;
  const bottom = 88;
  const rx = 25; // Halb-Breite → Breite 50, Höhe 76, Ratio 1.52 ✓
  const ryLid = 4.2;
  const bodyH = bottom - top;

  // Zwei Sicken (gerollte Rippen) — wie beim echten 200-L-Fass bei ~1/3 und ~2/3
  const r1y = top + bodyH * 0.3;
  const r3y = top + bodyH * 0.7;

  // Label-Band-Bereich zwischen den Sicken
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

      {/* Zwei Sicken (Rippen) in Fassfarbe — wie beim Original gerollt */}
      <BodyRib cx={cx} rx={rx} y={r1y} gid={gid} color={colors.primary} />
      <BodyRib cx={cx} rx={rx} y={r3y} gid={gid} color={colors.primary} />

      {/* Etikett — großes weißes Mittelband mit Logo oder Wordmark.
          Produktname steht ohnehin neben dem Bild, deshalb keine doppelte
          Beschriftung auf dem Fass. */}
      <g transform={`translate(${cx - rx + 4}, ${labelTop + 2})`}>
        <rect
          x="0"
          y="0"
          width={rx * 2 - 8}
          height={labelBot - labelTop - 4}
          rx="1"
          fill="#ffffff"
        />
        <rect
          x="0"
          y={labelBot - labelTop - 4}
          width={rx * 2 - 8}
          height="0.6"
          fill="#000"
          opacity="0.20"
        />
        <LabelContent
          width={rx * 2 - 8}
          height={labelBot - labelTop - 4}
          brand={brand}
          logoPath={logoPath}
          primary={colors.primary}
        />
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

/**
 * Sicke — gerollte Rippe in Fassfarbe, wie beim echten 200-L-Stahlfass.
 * Wirkt über schmale Licht-/Schattenkanten plastisch, ohne Fremdfarbe.
 */
function BodyRib({
  cx,
  rx,
  y,
  gid,
  color,
}: {
  cx: number;
  rx: number;
  y: number;
  gid: string;
  color: string;
}) {
  return (
    <g>
      {/* Rippen-Korpus: minimal über die Fasskante hinaus */}
      <rect x={cx - rx - 0.7} y={y - 1.6} width={rx * 2 + 1.4} height="3.2" rx="1.4" fill={color} />
      {/* Lichtkante oben */}
      <rect x={cx - rx - 0.7} y={y - 1.6} width={rx * 2 + 1.4} height="0.9" rx="0.45" fill="#fff" opacity="0.35" />
      {/* Schattenkante unten */}
      <rect x={cx - rx - 0.7} y={y + 0.8} width={rx * 2 + 1.4} height="0.8" rx="0.4" fill="#000" opacity="0.35" />
      {/* Schattenwurf unterhalb der Sicke auf dem Korpus */}
      <rect x={cx - rx} y={y + 1.7} width={rx * 2} height="0.7" fill="#000" opacity="0.18" />
      {/* Zylinder-Wölbung über die Rippe */}
      <rect x={cx - rx - 0.7} y={y - 1.6} width={rx * 2 + 1.4} height="3.2" rx="1.4" fill={`url(#${gid}-cyl)`} opacity="0.8" />
    </g>
  );
}

// ============================================================================
// IBC — originalgetreu: weiße HDPE-Blase im verzinkten Rohr-Gitterkäfig auf
// Palette, Deckel-Stutzen oben, Auslaufventil unten, Etikett als Schild vorn.
// ============================================================================
function renderIbc(
  colors: ReturnType<typeof brandColors>,
  brand: string,
  gid: string,
  logoPath: string | null,
) {
  // Frontfläche des Käfigs
  const fx = 15,
    fy = 26,
    fw = 62,
    fh = 56;
  // Isometrische Tiefe nach rechts-oben
  const dx = 12,
    dy = -9;

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

  // Gitter: 6 Spalten × 4 Reihen (wie beim Original-Käfig)
  const cols = 6,
    rowsN = 4;
  const colXs = Array.from({ length: cols - 1 }, (_, i) => fx + ((i + 1) * fw) / cols);
  const rowYs = Array.from({ length: rowsN - 1 }, (_, i) => fy + ((i + 1) * fh) / rowsN);

  const palletTop = fy + fh; // 82

  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />
      <defs>
        {/* Naturweißes HDPE mit leichter Transluzenz-Schattierung */}
        <linearGradient id={`${gid}-hdpe`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cfd6dd" />
          <stop offset="18%" stopColor="#eef1f4" />
          <stop offset="45%" stopColor="#fafbfc" />
          <stop offset="75%" stopColor="#e4e8ec" />
          <stop offset="100%" stopColor="#b9c2cb" />
        </linearGradient>
        {/* Verzinktes Rohr */}
        <linearGradient id={`${gid}-zinc`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#8fa0b3" />
        </linearGradient>
      </defs>

      {/* Weicher Boden-Schatten */}
      <GroundShadow cx={50} cy={95} rx={45} ry={4.5} gid={gid} />

      {/* ---------- Palette (Kunststoff/Holz-Mix wie beim Original) ---------- */}
      {/* Deckbrett */}
      <rect x={fx - 3} y={palletTop} width={fw + 6} height="3.2" fill="#ab8763" />
      <rect x={fx - 3} y={palletTop} width={fw + 6} height="0.9" fill="#fff" opacity="0.25" />
      {/* Tiefe des Deckbretts */}
      <polygon
        points={`${fx + fw + 3},${palletTop} ${fx + fw + dx + 3},${palletTop + dy * 0.35} ${fx + fw + dx + 3},${palletTop + dy * 0.35 + 3.2} ${fx + fw + 3},${palletTop + 3.2}`}
        fill="#8a6c4e"
      />
      {/* Klötze + Bodenbrett */}
      {[fx - 2, fx + fw / 2 - 3.5, fx + fw - 4].map((bx, i) => (
        <rect key={i} x={bx} y={palletTop + 3.2} width="7" height="5.4" fill="#7d6247" />
      ))}
      {[fx - 2, fx + fw / 2 - 3.5, fx + fw - 4].map((bx, i) => (
        <rect key={i} x={bx} y={palletTop + 3.2} width="7" height="1" fill="#000" opacity="0.25" />
      ))}
      <rect x={fx - 3} y={palletTop + 8.6} width={fw + 6} height="2.4" fill="#93714f" />

      {/* ---------- HDPE-Blase (hinter dem Gitter sichtbar) ---------- */}
      {/* Oberseite der Blase */}
      <polygon points={topPoly} fill="#dfe4e9" />
      <polygon points={topPoly} fill="#fff" opacity="0.35" />
      {/* rechte Seite der Blase */}
      <polygon points={rightPoly} fill={`url(#${gid}-hdpe)`} />
      <polygon points={rightPoly} fill="#000" opacity="0.22" />
      {/* Front der Blase — leicht hinter den Käfig zurückgesetzt */}
      <rect x={fx + 0.8} y={fy + 0.8} width={fw - 1.6} height={fh - 1.6} rx="2.5" fill={`url(#${gid}-hdpe)`} />
      {/* Füllstand-Andeutung: Öl schimmert unten leicht durch */}
      <rect x={fx + 0.8} y={fy + fh * 0.55} width={fw - 1.6} height={fh * 0.45 - 0.8} rx="2.5" fill={colors.primary} opacity="0.10" />

      {/* Einfüll-Deckel oben (schwarzer Schraubdeckel) */}
      <ellipse cx={fx + fw / 2 + dx / 2} cy={fy + dy / 2} rx="6.5" ry="2.4" fill="#0f172a" />
      <ellipse cx={fx + fw / 2 + dx / 2} cy={fy + dy / 2 - 0.7} rx="6.5" ry="2.4" fill="#1e293b" />
      <ellipse cx={fx + fw / 2 + dx / 2} cy={fy + dy / 2 - 0.7} rx="4.2" ry="1.5" fill="#475569" />

      {/* ---------- Verzinkter Rohr-Gitterkäfig ---------- */}
      {/* horizontale Rohre (Front) */}
      {[fy, ...rowYs, fy + fh].map((y, i) => (
        <g key={`h${i}`}>
          <rect x={fx - 1} y={y - 1.1} width={fw + 2} height="2.2" rx="1.1" fill={`url(#${gid}-zinc)`} />
          <rect x={fx - 1} y={y - 1.1} width={fw + 2} height="0.7" rx="0.35" fill="#fff" opacity="0.55" />
        </g>
      ))}
      {/* vertikale Rohre (Front) */}
      {[fx, ...colXs, fx + fw].map((x, i) => (
        <g key={`v${i}`}>
          <rect x={x - 1.1} y={fy - 1} width="2.2" height={fh + 2} rx="1.1" fill={`url(#${gid}-zinc)`} />
          <rect x={x - 1.1} y={fy - 1} width="0.7" height={fh + 2} rx="0.35" fill="#fff" opacity="0.45" />
        </g>
      ))}
      {/* Käfig-Tiefe: obere + seitliche Kanten */}
      <g stroke="#aab6c2" strokeWidth="1.6" strokeLinecap="round">
        <line x1={fx} y1={fy} x2={fx + dx} y2={fy + dy} />
        <line x1={fx + fw} y1={fy} x2={fx + fw + dx} y2={fy + dy} />
        <line x1={fx + dx} y1={fy + dy} x2={fx + fw + dx} y2={fy + dy} />
        <line x1={fx + fw + dx} y1={fy + dy} x2={fx + fw + dx} y2={fy + fh + dy} />
        <line x1={fx + fw + dx} y1={fy + fh + dy} x2={fx + fw} y2={fy + fh} />
      </g>
      {/* seitliche Gitterrohre (angedeutet) */}
      <g stroke="#aab6c2" strokeWidth="1" opacity="0.9" strokeLinecap="round">
        {rowYs.map((y, i) => (
          <line key={i} x1={fx + fw} y1={y} x2={fx + fw + dx} y2={y + dy} />
        ))}
      </g>

      {/* ---------- Auslaufventil unten Mitte ---------- */}
      <rect x={fx + fw / 2 - 4.5} y={fy + fh - 4} width="9" height="5" rx="1" fill="#dc2626" />
      <rect x={fx + fw / 2 - 4.5} y={fy + fh - 4} width="9" height="1.4" rx="0.7" fill="#fff" opacity="0.3" />
      <rect x={fx + fw / 2 - 1.6} y={fy + fh + 1} width="3.2" height="2.6" fill="#1e293b" />

      {/* ---------- Etikett als Schild am Käfig (oben links, wie Original) ---------- */}
      <g transform={`translate(${fx + 4.5}, ${fy + 4.5})`}>
        <rect x="0" y="0" width="26" height="15" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
        <LabelContent
          width={26}
          height={15}
          brand={brand}
          logoPath={logoPath}
          primary={colors.primary}
        />
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
  gid: string,
  logoPath: string | null,
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

      {/* Etikett — Logo oder Wordmark */}
      <g transform="translate(33, 40)">
        <rect x="0" y="0" width="34" height="34" fill="#ffffff" rx="1.5" />
        <LabelContent
          width={34}
          height={34}
          brand={brand}
          logoPath={logoPath}
          primary={colors.primary}
        />
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
  logoPath: string | null,
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

      {/* Etikett — Logo oder Wordmark */}
      <g transform="translate(24, 54)">
        <rect x="0" y="0" width="52" height="20" fill="#ffffff" rx="1.2" />
        <LabelContent
          width={52}
          height={20}
          brand={brand}
          logoPath={logoPath}
          primary={colors.primary}
        />
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
  logoPath: string | null,
) {
  return (
    <>
      <CommonDefs gid={gid} primary={colors.primary} />
      <GroundShadow cx={50} cy={92} rx={40} ry={4} gid={gid} />
      <path d="M 14 84 L 50 28 L 86 84 Z" fill={colors.primary} />
      <path d="M 14 84 L 50 28 L 86 84 Z" fill={`url(#${gid}-cyl)`} />
      <circle cx="50" cy="40" r="5" fill={colors.secondary} />
      <circle cx="50" cy="40" r="5" fill={`url(#${gid}-steel)`} opacity="0.3" />
      <g transform="translate(30, 60)">
        <rect x="0" y="0" width="40" height="18" fill="#ffffff" rx="1.2" />
        <LabelContent
          width={40}
          height={18}
          brand={brand}
          logoPath={logoPath}
          primary={colors.primary}
        />
      </g>
    </>
  );
}

/**
 * Heuristik: wieviel Platz braucht der Markenname relativ zur Label-Breite?
 * Kurze Marken (FUCHS, BP) bekommen größere Schrift, lange (BANTLEON,
 * HOUGHTON QUAKER) eine entsprechend kleinere.
 */
function brandFitLength(brand: string): number {
  return Math.max(4, brand.length * 0.7);
}
