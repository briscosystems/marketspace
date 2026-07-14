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

const adbCss = `
.adb{position:relative;display:flex;align-items:center;gap:24px;overflow:hidden;
  border-radius:16px;padding:20px 24px;border:1px solid #26363c;
  font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#eef4f3;
  background:linear-gradient(120deg,#132227 0%,#0d1519 70%)}
.adb-glow{position:absolute;inset:-40% -10% auto auto;width:50%;height:160%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(47,211,196,.18),transparent);filter:blur(10px)}
.adb-media{position:relative;flex:none;width:210px;height:130px;border-radius:12px;background:#eef0ec;
  display:grid;place-items:center;padding:10px;box-shadow:0 10px 26px rgba(0,0,0,.35)}
.adb-media img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.adb-body{position:relative;flex:1;min-width:0}
.adb-eyebrow{font-size:13px;font-weight:700;letter-spacing:.02em;color:#9fb3b9;text-transform:uppercase}
.adb-title{margin-top:5px;font-size:clamp(19px,2.4vw,24px);font-weight:800;letter-spacing:-.02em;line-height:1.12;color:#fff}
.adb-chips{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}
.adb-pill{white-space:nowrap;font-size:12.5px;color:#c3d0d3;background:rgba(255,255,255,.04);
  border:1px solid #2c3d43;border-radius:999px;padding:5px 11px}
.adb-pill b{color:#c7e94a;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;letter-spacing:-.02em}
.adb-action{position:relative;flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.adb-cta{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#abd91a;color:#06120a;
  font-weight:700;font-size:14px;border-radius:999px;padding:11px 20px;text-decoration:none;
  box-shadow:0 8px 20px rgba(171,217,26,.22)}
.adb-cta:hover{background:#bfe45c}
.adb-origin{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10.5px;letter-spacing:.06em;color:#7f939a}
@media (max-width:720px){
  .adb{flex-wrap:wrap;gap:16px;padding:18px}
  .adb-media{width:150px;height:96px}
  .adb-action{flex-direction:row;align-items:center;gap:14px;width:100%;justify-content:space-between}
  .adb-origin{order:-1}
}
`;
