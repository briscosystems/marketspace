# -*- coding: utf-8 -*-
logo = open('/tmp/pdfbuild/logo.txt').read()

html = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Brisco Marketplace — Information für Testkunden</title>
<style>
  @page { size: A4; margin: 0; }
  :root {
    --lime:#abd91a; --lime-600:#74980f; --lime-700:#587209; --lime-050:#f4fae4;
    --blue:#2f6fed; --blue-050:#eef3fe; --blue-800:#1b3f8f;
    --amber:#e88a14; --amber-050:#fef6ea; --amber-800:#9d4f0f;
    --ink:#211f20; --graphite:#1c1a1b; --slate:#5f5d5e; --muted:#8b8985;
    --line:#e4e6de; --card:#ffffff;
    --sans:"Helvetica Neue",Helvetica,Arial,sans-serif;
  }
  * { box-sizing:border-box; }
  body { margin:0; font-family:var(--sans); color:var(--ink); font-size:10.5pt; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page { width:210mm; height:297mm; overflow:hidden; padding:0 0 9mm; page-break-after:always; position:relative; display:flex; flex-direction:column; }
  .page:last-child { page-break-after:auto; }

  /* Kopf */
  .top { flex:none; background:var(--graphite); color:#fff; padding:9mm 16mm 8mm; position:relative; overflow:hidden; }
  .top::after { content:""; position:absolute; right:-6%; top:-60%; width:52%; height:200%; background:radial-gradient(circle at 50% 50%, rgba(171,217,26,.20), transparent 62%); }
  .wordmark { display:flex; align-items:center; gap:12px; position:relative; }
  .wordmark img { height:9mm; }
  .wordmark .site { margin-left:auto; font-size:9pt; color:rgba(255,255,255,.72); font-weight:600; letter-spacing:.02em; }
  .badge { display:inline-block; margin-top:7mm; font-size:8pt; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#101305; background:var(--lime); border-radius:99px; padding:3px 11px; position:relative; }
  h1 { position:relative; margin:3.5mm 0 0; font-size:20pt; line-height:1.12; letter-spacing:-.02em; font-weight:800; }
  .lead { position:relative; margin:3mm 0 0; font-size:10.5pt; color:rgba(255,255,255,.86); max-width:150mm; }

  .body { padding:6mm 16mm 0; flex:1 1 auto; min-height:0; }
  h2 { font-size:13.5pt; margin:0 0 3mm; letter-spacing:-.01em; }
  h3 { font-size:11pt; margin:0 0 2mm; }
  p { margin:0 0 3mm; }
  .muted { color:var(--slate); }

  .box { border:1px solid var(--line); border-radius:4mm; padding:4.5mm 6mm; margin-bottom:4mm; }
  .box-lime { background:var(--lime-050); border-color:#dcecb4; }
  .box-lime h2 { color:var(--lime-700); }

  .goodie { display:flex; gap:5mm; margin-top:3.5mm; }
  .goodie div { flex:1; background:#fff; border:1px solid #dcecb4; border-radius:3mm; padding:3mm 3.5mm; }
  .goodie .num { font-size:14pt; font-weight:800; color:var(--lime-700); line-height:1.1; }
  .goodie .lbl { font-size:9pt; color:var(--slate); margin-top:.8mm; line-height:1.35; }

  .ziel { display:grid; grid-template-columns:1fr 1fr; gap:2.8mm 6mm; margin-top:3mm; }
  .ziel div { padding-left:5mm; position:relative; font-size:9.5pt; line-height:1.4; }
  .ziel div::before { content:""; position:absolute; left:0; top:2.2mm; width:2.6mm; height:2.6mm; border-radius:50%; background:var(--lime); }

  .zahlen { display:flex; gap:0; border:1px solid var(--line); border-radius:3mm; overflow:hidden; margin-bottom:4mm; }
  .zahlen div { flex:1; padding:3mm 2mm; text-align:center; border-right:1px solid var(--line); }
  .zahlen div:last-child { border-right:0; }
  .zahlen .n { font-size:13pt; font-weight:800; letter-spacing:-.01em; }
  .zahlen .l { font-size:8pt; color:var(--slate); margin-top:.5mm; }

  /* Seite 2 */
  .cols { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
  .col { border-radius:4mm; padding:5mm 5.5mm; border:1px solid; }
  .col.kunde { background:var(--amber-050); border-color:#f6dcb4; }
  .col.reseller { background:var(--blue-050); border-color:#cfdcfb; }
  .col h2 { font-size:13pt; margin-bottom:1mm; }
  .col.kunde h2 { color:var(--amber-800); }
  .col.reseller h2 { color:var(--blue-800); }
  .col .wer { font-size:9pt; color:var(--slate); margin-bottom:4mm; }
  .col ul { margin:0; padding:0; list-style:none; }
  .col li { position:relative; padding-left:5.5mm; margin-bottom:2.2mm; font-size:9.3pt; line-height:1.36; }
  .col li::before { content:""; position:absolute; left:0; top:1.9mm; width:2.2mm; height:2.2mm; border-radius:.6mm; }
  .col.kunde li::before { background:var(--amber); }
  .col.reseller li::before { background:var(--blue); }
  .col li b { display:block; }

  .feedback { background:#f7f8f4; border:1px solid var(--line); border-radius:4mm; padding:4.5mm 6mm; margin-top:5mm; }
  .feedback ul { margin:2.5mm 0 0; padding-left:5mm; }
  .feedback li { margin-bottom:1mm; font-size:9.2pt; }

  .foot { flex:none; margin-top:auto; padding:4mm 16mm 0; font-size:8.5pt; color:var(--muted); display:flex; gap:5mm; border-top:1px solid var(--line); padding-top:4mm; }
  .foot b { color:var(--slate); }
  .foot .r { margin-left:auto; }
</style>
</head>
<body>

<section class="page">
  <div class="top">
    <div class="wordmark">
      <img src="LOGO" alt="BRISCO Systems — Fluid Management">
      <span class="site">markt.brisco.ch</span>
    </div>
    <span class="badge">Testkunden-Programm 2026</span>
    <h1>Sie sind ausgewählter Testkunde.</h1>
    <p class="lead">Brisco Marketplace ist die herstellerunabhängige Plattform für Kühlschmierstoffe,
      Industrieöle und Schmierstoffe. Wir öffnen sie vorab für eine kleine Zahl von Betrieben und
      Händlern — und wir wollen von Ihnen <strong>kritisches Feedback</strong>: was fehlt, was ist
      unverständlich, was stimmt nicht. Lob hilft uns weniger als ein klarer Einwand.</p>
  </div>

  <div class="body">
    <div class="box box-lime">
      <h2>Ihr Zugang als Testkunde — kostenlos</h2>
      <p class="muted" style="margin:0">Freigeschaltet, sobald Sie sich registriert haben. Ohne Kreditkarte, ohne automatische Verlängerung.</p>
      <div class="goodie">
        <div><div class="num">200</div><div class="lbl">KI-Credits für Produktsuche, Problem-Analyse und Alternativen</div></div>
        <div><div class="num">1 Jahr</div><div class="lbl">Mitgliedschaft kostenlos — voller Zugang zu allen Funktionen</div></div>
        <div><div class="num">0 &euro;</div><div class="lbl">Keine Provision auf Ihre Geschäfte. Wir verdienen an Mitgliedschaften</div></div>
      </div>
    </div>

    <div class="box">
      <h2>Was wir mit Brisco erreichen wollen</h2>
      <p class="muted" style="margin:0">Eine Software-Plattform, die dafür sorgt, dass Sie die <strong>beste Lösung</strong> bekommen —
        nicht die am lautesten beworbene.</p>
      <div class="ziel">
        <div><b>Der beste Kühlschmierstoff</b> für Ihre Anwendung, Ihr Material und Ihre Maschine.</div>
        <div><b>Die beste Performance</b> — Standzeit, Werkzeugleben, Hautverträglichkeit, weniger Störungen.</div>
        <div><b>Der beste Preis</b> — Richtwerte aus echten Geschäften statt Listenpreis-Raten.</div>
        <div><b>Herstellerunabhängig</b> — wir verkaufen selbst nichts und bevorzugen keine Marke.</div>
        <div><b>Wissen, das sonst verstreut ist</b>: Datenblätter, Sicherheitsdatenblätter, Beständigkeiten, Praxis-Probleme.</div>
        <div><b>Erfahrungen echter Betriebe</b> statt Prospekt-Versprechen — geprüft, bevor sie erscheinen.</div>
      </div>
    </div>

    <div class="zahlen">
      <div><div class="n">1.095</div><div class="l">Produkte im Katalog</div></div>
      <div><div class="n">118</div><div class="l">Hersteller</div></div>
      <div><div class="n">3.383</div><div class="l">Sicherheitsdatenblätter</div></div>
      <div><div class="n">101</div><div class="l">dokumentierte Praxis-Probleme</div></div>
      <div><div class="n">14</div><div class="l">Werkstoffe in der Beständigkeits-Matrix</div></div>
    </div>
  </div>

  <div class="foot">
    <span><b>Brisco Systems GmbH</b> · Huebacherweg 27 · CH-8335 Hittnau</span>
    <span class="r">Stand: August 2026 · Seite 1 von 2</span>
  </div>
</section>

<section class="page">
  <div class="body" style="padding-top:9mm">
    <h2 style="margin-bottom:4mm">Was Sie davon haben</h2>

    <div class="cols">
      <div class="col kunde">
        <h2>Ich bin Endkunde</h2>
        <div class="wer">Betrieb, Instandhaltung, Fertigung, Einkauf</div>
        <ul>
          <li><b>Problem klären</b>Beschreibung, Fotos, Datenblatt und Laborbericht hochladen — die KI grenzt ein. Unklares geht an unsere Fachleute, geraten wird nie.</li>
          <li><b>Etikett fotografieren</b>Produkt erkannt, dazu sofort Sollwerte, gemeldete Probleme und Erfahrungen anderer Betriebe.</li>
          <li><b>Oberfläche fotografieren</b>Fremdöl, Schaum, Beläge und Späne erkennen, bevor ein Messwert anschlägt.</li>
          <li><b>Alternative finden</b>Die KI vergleicht Rezeptur, Freigaben und Praxis-Erfahrungen — nicht nur zwei Datenblätter.</li>
          <li><b>KSS-Management</b>Messwerte selbst eintragen — Konzentration, pH, Nitrit. Die Seite vergleicht mit den Sollwerten, zeigt den Verlauf und rechnet aus, mit welcher Konzentration nachzufüllen ist. QR-Etikett am Tank, PDF-Bericht.</li>
          <li><b>Beständigkeiten</b>Welche Dichtungen, Fenster und Werkstoffe ein Produkt angreift — in der Sprache der Instandhaltung.</li>
          <li><b>Bedarf einstellen</b>Eine Anfrage erreicht mehrere Händler — Ihr Firmenname bleibt verborgen.</li>
        </ul>
      </div>

      <div class="col reseller">
        <h2>Ich bin Reseller</h2>
        <div class="wer">Händler, Distributor, Hersteller mit Direktvertrieb</div>
        <ul>
          <li><b>Angebot in drei Feldern</b>Produkt aus dem Katalog wählen — Hersteller, Art und Chemie stehen dann schon da. Alles Weitere ist freiwillig.</li>
          <li><b>Anfragen bedienen</b>Offene Bedarfe von Betrieben sehen und direkt anbieten, statt kalt zu akquirieren.</li>
          <li><b>Keine Provision</b>Wir verdienen an der Mitgliedschaft, nicht an Ihrem Abschluss. Was Sie verkaufen, gehört Ihnen.</li>
          <li><b>Eigenes Schaufenster</b>Sortiment mit Datenblättern dort zeigen, wo Einkäufer tatsächlich suchen.</li>
          <li><b>Pseudonym-Schutz</b>Firmenname und Kontaktdaten bleiben verborgen, bis Sie sich für ein Geschäft entscheiden.</li>
          <li><b>Bewertungen nur aus echten Geschäften</b>Kein Sterne-Handel — bewertet wird, wer wirklich geliefert hat.</li>
          <li><b>Schnittstelle zum eigenen System</b>Katalog, Sicherheitsdatenblätter und KI-Suche per REST-API im ERP nutzbar.</li>
        </ul>
      </div>
    </div>

    <div class="feedback">
      <h3>Worauf wir Ihr Feedback brauchen</h3>
      <p class="muted" style="margin:0">Sagen Sie es uns deutlich — jede Kritik ändert die Plattform, oft noch am selben Tag.</p>
      <ul>
        <li>Haben Sie sofort verstanden, was Sie tun können? Wo haben Sie etwas gesucht und nicht gefunden?</li>
        <li>Stimmen unsere Daten zu Ihren Produkten? Falsches korrigieren wir umgehend.</li>
        <li>Rät die KI irgendwo statt zu belegen? Das darf sie nicht — melden Sie uns jeden Fall.</li>
        <li>Was fehlt, damit Sie Brisco im Alltag wirklich benutzen?</li>
      </ul>
    </div>

    <p style="margin-top:3.5mm; font-size:9.5pt">
      <strong>So starten Sie:</strong> auf <strong>markt.brisco.ch</strong> registrieren und uns kurz Bescheid geben —
      wir schalten Credits und Jahres-Zugang frei. Fragen und Feedback direkt an
      <strong>jgosch@brisco.ch</strong>.
    </p>
  </div>

  <div class="foot">
    <span><b>Brisco Systems GmbH</b> · Huebacherweg 27 · CH-8335 Hittnau · jgosch@brisco.ch</span>
    <span class="r">markt.brisco.ch · Seite 2 von 2</span>
  </div>
</section>

</body>
</html>
"""
html = html.replace("LOGO", logo)
open('marketing/testkunden-info.html','w').write(html)
print("HTML geschrieben:", len(html), "Zeichen")
