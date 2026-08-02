import { withBasePath } from "@/lib/base-path";

// Datengetriebene Anzeige-Ansicht (Banner). Gestaltung orientiert an üblichen
// Sponsored-Placements: klares Produktbild mit Luft, kurze Schlagzeile,
// lesbare Vorteils-Pills, ein klarer CTA. Eigenständig gestaltet (.adb-*).
export type AdBannerData = {
  eyebrow?: string | null;
  headline: string;
  chips?: string[];
  image: string; // "/pfad" (ausgeliefert) oder "data:…"-URI (Upload)
  ctaLabel?: string | null;
  ctaUrl: string;
  origin?: string | null;
};

function imgSrc(image: string): string {
  return image.startsWith("data:") ? image : withBasePath(image);
}

// Ersten Token fett setzen, wenn er wie eine Kennzahl aussieht (−25 %, 2–3×).
function renderChip(text: string) {
  const m = text.match(/^(\S+)(\s+.*)?$/);
  if (m && /[\d%×–—−]/.test(m[1]) && m[2]) {
    return (
      <>
        <b>{m[1]}</b>
        {m[2]}
      </>
    );
  }
  return text;
}

export function AdBannerView({ ad }: { ad: AdBannerData }) {
  return (
    <div className="adb">
      <style>{adbCss}</style>
      <div className="adb-glow" />

      <div className="adb-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc(ad.image)} alt={ad.eyebrow ?? ad.headline} />
      </div>

      <div className="adb-body">
        {ad.eyebrow ? <div className="adb-eyebrow">{ad.eyebrow}</div> : null}
        <div className="adb-title">{ad.headline}</div>
        {ad.chips && ad.chips.length > 0 ? (
          <div className="adb-chips">
            {ad.chips.map((c, i) => (
              <span key={i} className="adb-pill">
                {renderChip(c)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="adb-action">
        <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer nofollow" className="adb-cta">
          {ad.ctaLabel || "Mehr erfahren"} →
        </a>
        {ad.origin ? <span className="adb-origin">{ad.origin}</span> : null}
      </div>
    </div>
  );
}

/* Bewusst kompakt: die Anzeige ist ein schmaler Streifen, kein Hero —
   sie darf die eigentlichen Inhalte der Seite nicht verdrängen. */
const adbCss = `
.adb{position:relative;display:flex;align-items:center;gap:16px;overflow:hidden;
  border-radius:12px;padding:10px 16px;border:1px solid #26363c;
  font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#eef4f3;
  background:linear-gradient(120deg,#132227 0%,#0d1519 70%)}
.adb-glow{position:absolute;inset:-40% -10% auto auto;width:50%;height:160%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(47,211,196,.14),transparent);filter:blur(10px)}
.adb-media{position:relative;flex:none;width:96px;height:60px;border-radius:8px;background:#eef0ec;
  display:grid;place-items:center;padding:6px;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.adb-media img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.adb-body{position:relative;flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.adb-eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.02em;color:#9fb3b9;text-transform:uppercase;width:100%}
.adb-title{font-size:clamp(14px,1.7vw,17px);font-weight:800;letter-spacing:-.02em;line-height:1.15;color:#fff}
.adb-chips{display:flex;flex-wrap:wrap;gap:6px}
.adb-pill{white-space:nowrap;font-size:11px;color:#c3d0d3;background:rgba(255,255,255,.04);
  border:1px solid #2c3d43;border-radius:999px;padding:2.5px 8px}
.adb-pill b{color:#c7e94a;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;letter-spacing:-.02em}
.adb-action{position:relative;flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.adb-cta{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;background:#abd91a;color:#06120a;
  font-weight:700;font-size:12.5px;border-radius:999px;padding:7px 14px;text-decoration:none;
  box-shadow:0 5px 14px rgba(171,217,26,.2)}
.adb-cta:hover{background:#bfe45c}
.adb-origin{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.06em;color:#7f939a}
@media (max-width:720px){
  .adb{flex-wrap:wrap;gap:10px;padding:10px 12px}
  .adb-media{width:80px;height:50px}
  .adb-action{flex-direction:row;align-items:center;gap:10px;width:100%;justify-content:space-between}
  .adb-origin{order:-1}
}
`;
