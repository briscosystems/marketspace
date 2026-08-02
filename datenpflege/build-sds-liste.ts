import { prisma } from "@/lib/prisma";
import fs from "fs";

const STATUS: Record<string, "login" | "bot" | "offen"> = {
  Fuchs: "login", "Klüber Lubrication": "login", "Carl Bechem": "login",
  "Zeller+Gmelin": "login", "Blaser Swisslube": "login", "Rhenus Lub": "login",
  Petrofer: "login", oelheld: "login", SurTec: "login", Oemeta: "login",
  "Master Fluid Solutions": "login", Cimcool: "login", Condat: "login",
  Castrol: "bot", Mobil: "bot", "Quaker Houghton": "bot", Motorex: "bot",
  Dow: "bot", "Atlas Copco": "bot", Henkel: "bot",
  Shell: "offen", TotalEnergies: "offen", "Bio-Circle Surface Technology": "offen",
  Sika: "offen", Cortec: "offen", Kärcher: "offen", "BANDELIN electronic": "offen",
  "Elma Schmidbauer": "offen", Eastman: "offen", Addinol: "offen", Busch: "offen",
  BITZER: "offen", Sodick: "offen", "CPI Fluid Engineering": "offen",
  "ACMOS CHEMIE": "offen", "Chem-Trend": "offen",
};

// Geprüfte Portal-Adressen (HTTP-Status in Klammern beim Test am 2026-08-02).
// 403 = Seite existiert, weist nur automatische Abrufe ab (im Browser normal).
const PORTAL: Record<string, { label: string; url: string }[]> = {
  "Fuchs": [
    { label: "Sicherheitsdatenblätter im Download-Center", url: "https://www.fuchs.com/de/de/produkte/download-center/kategorie/download-category/1328-sicherheitsdatenblaetter/" },
    { label: "Anmelden / Konto anlegen", url: "https://www.fuchs.com/de/de/produkte/download-center/login/" },
  ],
  "Klüber Lubrication": [
    { label: "Download-Bereich", url: "https://www.klueber.com/de/de/downloads/" },
    { label: "Anmelden / Konto anlegen", url: "https://www.klueber.com/de/de/konto/login/" },
  ],
  "Carl Bechem": [
    { label: "Sicherheitsdatenblätter", url: "https://www.bechem.com/de/sicherheitsdatenblaetter.html" },
    { label: "Downloads", url: "https://www.bechem.com/de/downloads.html" },
    { label: "Anmelden", url: "https://www.bechem.com/de/login.html" },
  ],
  "Zeller+Gmelin": [{ label: "Anmelden / Konto anlegen", url: "https://zeller-gmelin.de/login/" }],
  "Divinol": [{ label: "Anmelden (Zeller+Gmelin)", url: "https://zeller-gmelin.de/login/" }],
  "Blaser Swisslube": [
    { label: "Sicherheitsdatenblätter", url: "https://blaser.com/de/sicherheitsdatenblaetter/" },
    { label: "Downloads", url: "https://blaser.com/de/downloads/" },
  ],
  "Rhenus Lub": [{ label: "Shop-Anmeldung (Datenblätter)", url: "https://www.rhenuslubshop.com/site/login.aspx" }],
  "Oemeta": [{ label: "Download-Bereich", url: "https://www.oemeta.com/the-coolant-people/downloads" }],
  "Master Fluid Solutions": [{ label: "Anmelden", url: "https://www.masterfluidsolutions.com/na/en-us/ct/login/signIn.php" }],
  "SurTec": [{ label: "Anmelden / Registrieren", url: "https://www.surtec.com/de/registrierung/login/" }],
  "Q8Oils": [{ label: "Anmelden (My Q8Oils, DE)", url: "http://login.q8oils.de/login.aspx?ReturnUrl=%2f" }],
  "Liqui Moly": [{ label: "Konto anlegen / anmelden", url: "https://www.liqui-moly.com/de/de/customer/account/login/" }],
  "Quaker Houghton": [{ label: "Shop-Anmeldung (TDS/SDS je Produkt)", url: "https://store.quakerhoughton.com/customer/account/login/" }],
  "Castrol": [{ label: "MSDS-/PDS-Suche Deutschland (ohne Login)", url: "https://msdspds.castrol.com/msdspds/msdspds.nsf/CastrolSearch?OpenForm&c=Germany%20(DE)&l=German%20(DE)&sitelang=DE&output=Full" }],
  "Mobil": [
    { label: "PDS- & SDS-Suche (403 für Skripte, im Browser offen)", url: "https://www.mobil.com/en/lubricants/for-businesses/pds-and-sds-search" },
    { label: "ExxonMobil SDS-Portal (Anmeldung)", url: "https://sds.exxonmobil.com/" },
  ],
  "Shell": [{ label: "Sicherheitsdatenblatt-Suche", url: "https://www.shell.com/business-customers/lubricants-for-business/safety-data-sheets.html" }],
  "TotalEnergies": [{ label: "Produktkatalog mit Datenblättern", url: "https://lubricants.catalog.totalenergies.com/" }],
  "OKS Spezialschmierstoffe": [{ label: "Download-Bereich", url: "https://www.oks-germany.com/de/downloads/" }],
  "ROCOL": [{ label: "Datenblatt-Suche", url: "https://rocol.com/datasheets/" }],
  "Condat": [{ label: "Download-Bereich", url: "https://www.condat-lubricants.com/downloads/" }],
};
const KEIN_PORTAL = new Set(["oelheld", "Petrofer", "Cimcool", "Motorex"]);

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

(async () => {
  const CAT: Record<string, string> = (await import("@/lib/product-categories")).PRODUCT_CATEGORY_SHORT as any;
  const ps = await prisma.product.findMany({
    where: { sourceUrl: { not: null }, sdsUrl: null },
    select: {
      name: true, category: true, sourceUrl: true, dataSheetUrl: true,
      manufacturer: { select: { name: true, website: true } },
    },
    orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
  });

  const groups = new Map<string, typeof ps>();
  for (const p of ps) {
    const k = p.manufacturer.name;
    if (!groups.has(k)) groups.set(k, [] as never);
    (groups.get(k) as typeof ps).push(p);
  }
  const rank = { login: 0, bot: 1, offen: 2, unklar: 3 };
  const entries = [...groups.entries()].sort((a, b) => {
    const sa = rank[STATUS[a[0]] ?? "unklar"], sb = rank[STATUS[b[0]] ?? "unklar"];
    return sa !== sb ? sa - sb : b[1].length - a[1].length;
  });
  const count = (s: string) => entries.filter(([m]) => (STATUS[m] ?? "unklar") === s).reduce((n, [, l]) => n + l.length, 0);

  const LABEL = {
    login: "Anmeldung nötig", bot: "Kein Login — nur Bot-Sperre",
    offen: "Frei zugänglich", unklar: "Noch nicht geprüft",
  } as const;

  let body = "";
  for (const [mfr, list] of entries) {
    const st = STATUS[mfr] ?? "unklar";
    const site = list[0].manufacturer.website;
    body += `<section class="mfr" data-status="${st}">
  <header class="mfr-head">
    <h2>${esc(mfr)}</h2>
    <span class="pill ${st}">${LABEL[st]}</span>
    <span class="count"><b class="n">${list.length}</b> offen</span>
    <button class="copy" type="button" data-links="${esc(list.map((p) => p.sourceUrl).join("\n"))}">Links kopieren</button>
  </header>
  ${(PORTAL[mfr] ?? []).length
      ? `<p class="portal">${(PORTAL[mfr] ?? []).map((d) => `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.label)} ↗</a>`).join("")}</p>`
      : KEIN_PORTAL.has(mfr)
        ? `<p class="portal none">Kein öffentliches Dokumentenportal auffindbar — Datenblätter direkt beim Hersteller anfragen${site ? ` (<a href="${esc(site)}" target="_blank" rel="noopener">Website</a>)` : ""}.</p>`
        : site ? `<p class="portal none">Portal noch nicht geprüft — <a href="${esc(site)}" target="_blank" rel="noopener">Website</a>.</p>` : ""}
  <ul class="rows">`;
    for (const p of list) {
      const id = `${mfr}::${p.name}`.replace(/"/g, "");
      body += `<li><label class="row"><input type="checkbox" data-id="${esc(id)}">
        <span class="pname">${esc(p.name)}</span>
        <span class="cat">${esc(CAT[p.category] ?? p.category)}</span></label>
        <span class="links"><a href="${esc(p.sourceUrl!)}" target="_blank" rel="noopener">Produktseite ↗</a>${
          p.dataSheetUrl ? ` <a href="${esc(p.dataSheetUrl)}" target="_blank" rel="noopener">Datenblatt ↗</a>` : ""
        }</span></li>`;
    }
    body += `</ul></section>`;
  }

  const html = `<title>Datenblätter &amp; Sicherheitsdatenblätter beschaffen — Brisco Marketplace</title>
<style>
:root{
  --ground:#FAFAF6; --surface:#FFFFFF; --ink:#16190F; --ink-2:#4A503E; --ink-3:#767C66;
  --line:#E3E6D8; --line-2:#EFF1E8; --accent:#5C7A16; --accent-soft:#EDF3DC;
  --login:#9A5B0B; --login-bg:#FCF1E2; --bot:#3F5266; --bot-bg:#EDF2F7; --offen:#186B45; --offen-bg:#E6F3EC;
  --shadow:0 1px 2px rgb(22 25 15/.05), 0 8px 24px -18px rgb(22 25 15/.35);
}
@media (prefers-color-scheme:dark){
  :root{ --ground:#121410; --surface:#1B1E17; --ink:#F1F3EA; --ink-2:#C3C8B5; --ink-3:#8C9280;
    --line:#2C3126; --line-2:#242820; --accent:#A9CC4E; --accent-soft:#232A16;
    --login:#E0A360; --login-bg:#2E2114; --bot:#9EB6CC; --bot-bg:#1A222A; --offen:#79C79E; --offen-bg:#13251C;
    --shadow:0 1px 2px rgb(0 0 0/.4), 0 10px 28px -20px rgb(0 0 0/.9); }
}
:root[data-theme="dark"]{ --ground:#121410; --surface:#1B1E17; --ink:#F1F3EA; --ink-2:#C3C8B5; --ink-3:#8C9280;
  --line:#2C3126; --line-2:#242820; --accent:#A9CC4E; --accent-soft:#232A16;
  --login:#E0A360; --login-bg:#2E2114; --bot:#9EB6CC; --bot-bg:#1A222A; --offen:#79C79E; --offen-bg:#13251C;
  --shadow:0 1px 2px rgb(0 0 0/.4), 0 10px 28px -20px rgb(0 0 0/.9); }
:root[data-theme="light"]{ --ground:#FAFAF6; --surface:#FFFFFF; --ink:#16190F; --ink-2:#4A503E; --ink-3:#767C66;
  --line:#E3E6D8; --line-2:#EFF1E8; --accent:#5C7A16; --accent-soft:#EDF3DC;
  --login:#9A5B0B; --login-bg:#FCF1E2; --bot:#3F5266; --bot-bg:#EDF2F7; --offen:#186B45; --offen-bg:#E6F3EC;
  --shadow:0 1px 2px rgb(22 25 15/.05), 0 8px 24px -18px rgb(22 25 15/.35); }

*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:60rem;margin:0 auto;padding:2.5rem 1.25rem 5rem;display:flex;flex-direction:column;gap:1.75rem}
a{color:var(--accent)}
h1{font-size:clamp(1.6rem,1.2rem + 1.6vw,2.3rem);line-height:1.15;margin:0;letter-spacing:-.02em;text-wrap:balance}
.eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.72rem;
  letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 .55rem}
.lead{margin:.85rem 0 0;color:var(--ink-2);max-width:44rem}
.tally{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem}
.tally b{font-variant-numeric:tabular-nums}
.stat{display:flex;align-items:baseline;gap:.45rem;padding:.4rem .75rem;border-radius:999px;
  border:1px solid var(--line);background:var(--surface);font-size:.85rem;color:var(--ink-2)}
.stat b{font-size:1rem;color:var(--ink)}
.legend{display:grid;gap:.6rem;padding:1.1rem 1.25rem;background:var(--surface);
  border:1px solid var(--line);border-radius:.9rem;box-shadow:var(--shadow)}
.legend p{margin:0;font-size:.9rem;color:var(--ink-2)}
.legend .pill{margin-right:.5rem}
.bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;position:sticky;top:0;z-index:9;
  padding:.7rem 0;background:linear-gradient(var(--ground) 78%,transparent)}
.filter{font:inherit;font-size:.85rem;padding:.35rem .8rem;border-radius:999px;cursor:pointer;
  border:1px solid var(--line);background:var(--surface);color:var(--ink-2)}
.filter[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:600}
.filter:focus-visible,.copy:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.mfr{background:var(--surface);border:1px solid var(--line);border-radius:.9rem;
  box-shadow:var(--shadow);overflow:hidden}
.mfr[hidden]{display:none}
.mfr-head{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;padding:.9rem 1.1rem;
  border-bottom:1px solid var(--line-2)}
.mfr-head h2{font-size:1.02rem;margin:0;letter-spacing:-.01em;flex:0 0 auto}
.count{font-size:.8rem;color:var(--ink-3);margin-left:auto;font-variant-numeric:tabular-nums}
.site,.copy{font-size:.78rem;text-decoration:none;border:1px solid var(--line);background:transparent;
  color:var(--ink-2);padding:.25rem .6rem;border-radius:.45rem;cursor:pointer;font-family:inherit}
.site:hover,.copy:hover{border-color:var(--accent);color:var(--accent)}
.pill{font-size:.72rem;font-weight:600;padding:.2rem .55rem;border-radius:.4rem;white-space:nowrap}
.pill.login{background:var(--login-bg);color:var(--login)}
.pill.bot{background:var(--bot-bg);color:var(--bot)}
.pill.offen{background:var(--offen-bg);color:var(--offen)}
.pill.unklar{background:var(--line-2);color:var(--ink-3)}
.portal{display:flex;flex-wrap:wrap;gap:.4rem .5rem;margin:0;padding:.7rem 1.1rem;
  background:var(--accent-soft);border-bottom:1px solid var(--line-2);font-size:.83rem}
.portal a{display:inline-block;text-decoration:none;font-weight:600;padding:.2rem .55rem;
  border:1px solid color-mix(in srgb, var(--accent) 40%, transparent);border-radius:.4rem;background:var(--surface)}
.portal a:hover{border-color:var(--accent)}
.portal.none{background:var(--line-2);color:var(--ink-3);font-weight:400}
.portal.none a{border:0;background:none;padding:0;font-weight:600}
.rows{list-style:none;margin:0;padding:0}
.rows li{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;
  padding:.55rem 1.1rem;border-top:1px solid var(--line-2);font-size:.9rem}
.rows li:first-child{border-top:0}
.row{display:flex;align-items:center;gap:.6rem;flex:1 1 22rem;min-width:0;cursor:pointer}
.row input{width:1.05rem;height:1.05rem;accent-color:var(--accent);flex:0 0 auto;cursor:pointer}
.pname{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86rem;
  color:var(--ink);overflow-wrap:anywhere}
.row input:checked ~ .pname{text-decoration:line-through;color:var(--ink-3)}
.cat{font-size:.7rem;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);
  border:1px solid var(--line);border-radius:.35rem;padding:.05rem .4rem;white-space:nowrap}
.links{display:flex;gap:.8rem;font-size:.82rem;margin-left:auto}
.links a{text-decoration:none;border-bottom:1px solid transparent}
.links a:hover{border-bottom-color:var(--accent)}
footer{font-size:.82rem;color:var(--ink-3);border-top:1px solid var(--line);padding-top:1rem}
@media (prefers-reduced-motion:no-preference){.copy{transition:border-color .15s,color .15s}}
</style>

<div class="wrap">
  <header>
    <p class="eyebrow">Arbeitsliste · Stand 2. August 2026</p>
    <h1>Datenblätter und Sicherheitsdatenblätter beschaffen</h1>
    <p class="lead">Zu diesen ${ps.length} Produkten fehlt im Marktplatz noch ein Sicherheitsdatenblatt.
      Jede Zeile führt direkt auf die geprüfte Herstellerseite. Abgehakte Zeilen bleiben in diesem
      Browser gespeichert — du kannst die Liste also in mehreren Sitzungen abarbeiten.</p>
    <div class="tally">
      <span class="stat"><b>${ps.length}</b> Produkte</span>
      <span class="stat"><b>${entries.length}</b> Hersteller</span>
      <span class="stat"><b>${count("login")}</b> hinter Anmeldung</span>
      <span class="stat"><b>${count("bot")}</b> nur Bot-Sperre</span>
      <span class="stat"><b>${count("offen")}</b> frei zugänglich</span>
    </div>
  </header>

  <div class="legend">
    <p><span class="pill login">Anmeldung nötig</span> Der Hersteller gibt Datenblätter nur an registrierte
      Kunden heraus. Hier lohnt ein Geschäftskonto — meist genügt eine Firmen-Mailadresse.</p>
    <p><span class="pill bot">Kein Login — nur Bot-Sperre</span> Die Dokumente sind öffentlich, der Server
      hat aber unseren automatischen Abruf abgewiesen. <strong>In deinem Browser funktioniert der Link.</strong>
      Diese Gruppe ist am schnellsten erledigt.</p>
    <p><span class="pill offen">Frei zugänglich</span> Öffentlich abrufbar; das Sicherheitsdatenblatt lag
      nur nicht direkt neben dem Produkt. Meist ein bis zwei Klicks entfernt.</p>
  </div>

  <div class="bar">
    <button class="filter" type="button" data-f="alle" aria-pressed="true">Alle</button>
    <button class="filter" type="button" data-f="login" aria-pressed="false">Anmeldung nötig</button>
    <button class="filter" type="button" data-f="bot" aria-pressed="false">Nur Bot-Sperre</button>
    <button class="filter" type="button" data-f="offen" aria-pressed="false">Frei zugänglich</button>
    <button class="filter" type="button" data-f="offen-todo" aria-pressed="false">Nur unerledigte</button>
  </div>

  ${body}

  <footer>Sobald du ein Dokument hast: PDF im Marktplatz unter dem Produkt hochladen oder mir die
    Sammlung geben — ich hänge sie an die Produkte. Quelle jeder Zeile ist die Hersteller-Produktseite,
    die bei der Recherche tatsächlich abgerufen wurde.</footer>
</div>

<script>
(function(){
  var KEY='brisco-sds-todo';
  var done={};
  try{ done=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
  var boxes=document.querySelectorAll('input[type=checkbox]');
  boxes.forEach(function(b){
    if(done[b.dataset.id]) b.checked=true;
    b.addEventListener('change',function(){
      if(b.checked) done[b.dataset.id]=1; else delete done[b.dataset.id];
      try{ localStorage.setItem(KEY,JSON.stringify(done)); }catch(e){}
      refresh();
    });
  });
  function refresh(){
    document.querySelectorAll('.mfr').forEach(function(s){
      var open=s.querySelectorAll('input[type=checkbox]:not(:checked)').length;
      s.querySelector('.n').textContent=open;
    });
    apply();
  }
  var mode='alle';
  function apply(){
    document.querySelectorAll('.mfr').forEach(function(s){
      var byStatus = (mode==='alle'||mode==='offen-todo') || s.dataset.status===mode;
      var hasOpen = s.querySelectorAll('input[type=checkbox]:not(:checked)').length>0;
      s.hidden = !byStatus || (mode==='offen-todo' && !hasOpen);
    });
  }
  document.querySelectorAll('.filter').forEach(function(btn){
    btn.addEventListener('click',function(){
      mode=btn.dataset.f;
      document.querySelectorAll('.filter').forEach(function(b){
        b.setAttribute('aria-pressed', String(b===btn));
      });
      apply();
    });
  });
  document.querySelectorAll('.copy').forEach(function(btn){
    btn.addEventListener('click',function(){
      var t=btn.dataset.links;
      var done=function(){ var o=btn.textContent; btn.textContent='Kopiert'; setTimeout(function(){btn.textContent=o;},1400); };
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done,function(){}); }
      else { var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
             try{document.execCommand('copy');done();}catch(e){} document.body.removeChild(ta); }
    });
  });
  refresh();
})();
</script>`;

  fs.writeFileSync("datenpflege/sds-beschaffung.html", html);
  console.log("Produkte:", ps.length, "| Hersteller:", entries.length,
    "| login:", count("login"), "bot:", count("bot"), "offen:", count("offen"), "unklar:", count("unklar"));
  await prisma.$disconnect();
})();
