import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GhsPictogram } from "@/components/GhsPictogram";
import { AlertOctagon, ArrowLeft, Info } from "lucide-react";

export const metadata = {
  title: "Gefahrensymbole (GHS/CLP) — Brisco Marketplace",
  description:
    "Die 9 offiziellen Gefahrenpiktogramme nach CLP-Verordnung einfach erklärt — mit Bezug zu Kühlschmierstoffen und Industrieölen.",
};

/**
 * Übersichts-Seite: alle 9 GHS-/CLP-Gefahrenpiktogramme mit kurzer, einfacher
 * Erklärung und Praxisbezug zu KSS/Ölen. Zeigt zusätzlich, wie viele
 * Sicherheitsdatenblätter im Bestand das jeweilige Symbol tragen.
 */

const SYMBOLS: {
  code: string;
  name: string;
  meaning: string;
  praxis: string;
  hExamples: string;
}[] = [
  {
    code: "GHS01",
    name: "Explosiv",
    meaning:
      "Stoff kann explodieren — durch Schlag, Reibung, Funken oder Hitze.",
    praxis:
      "Bei Ölen und Kühlschmierstoffen praktisch nie anzutreffen; relevant nur für Spezialchemie.",
    hExamples: "H200–H205",
  },
  {
    code: "GHS02",
    name: "Entzündbar",
    meaning: "Fängt leicht Feuer — schon Funken oder heiße Flächen genügen.",
    praxis:
      "Wichtig bei Reinigern, Verdünnern und Schneidölen mit niedrigem Flammpunkt. Auf den Flammpunkt im SDS achten.",
    hExamples: "H225, H226",
  },
  {
    code: "GHS03",
    name: "Brandfördernd (oxidierend)",
    meaning:
      "Brennt selbst nicht, facht aber Brände stark an — liefert Sauerstoff.",
    praxis: "Bei Schmierstoffen selten; eher bei Wasserbehandlungs-Chemie.",
    hExamples: "H270–H272",
  },
  {
    code: "GHS04",
    name: "Gase unter Druck",
    meaning:
      "Verdichtetes oder verflüssigtes Gas — Behälter kann bersten oder Kälteverbrennungen verursachen.",
    praxis: "Betrifft Sprays/Aerosole, z. B. Schmierstoff- und Rostlöser-Sprays.",
    hExamples: "H280, H281",
  },
  {
    code: "GHS05",
    name: "Ätzend / korrosiv",
    meaning:
      "Zerstört Haut und Augen bei Kontakt; greift auch Metalle an.",
    praxis:
      "Vorsicht bei KSS-Konzentraten und Systemreinigern — beim Ansetzen Handschuhe und Schutzbrille tragen.",
    hExamples: "H314, H318, H290",
  },
  {
    code: "GHS06",
    name: "Giftig (akut toxisch)",
    meaning:
      "Schon kleine Mengen können beim Einatmen, Verschlucken oder Hautkontakt schwer schaden.",
    praxis:
      "Bei modernen KSS und Ölen sehr selten — taucht es auf, das Produkt besonders sorgfältig handhaben.",
    hExamples: "H300–H331",
  },
  {
    code: "GHS07",
    name: "Reizend / gesundheitsschädlich",
    meaning:
      "Reizt Haut, Augen oder Atemwege; kann Allergien auslösen. Die mildeste Warnstufe.",
    praxis:
      "Das häufigste Symbol bei Kühlschmierstoffen — typisch wegen Hautreizung (H315) oder Sensibilisierung (H317). Hautkontakt minimieren, Pflegeplan beachten.",
    hExamples: "H315, H317, H319, H335",
  },
  {
    code: "GHS08",
    name: "Gesundheitsgefahr (langfristig)",
    meaning:
      "Kann Organe schädigen, Krebs erzeugen oder die Fruchtbarkeit beeinträchtigen — oft erst bei längerem Kontakt.",
    praxis:
      "Achtung bei Produkten mit H304 (kann beim Verschlucken in die Lunge gelangen) — klassisch bei dünnflüssigen Ölen. Auch für TRGS-611-Themen (Nitrosamine) relevant.",
    hExamples: "H304, H350, H360, H372",
  },
  {
    code: "GHS09",
    name: "Umweltgefährlich",
    meaning: "Giftig für Fische und andere Wasserorganismen — darf nicht in Gewässer oder Kanalisation gelangen.",
    praxis:
      "Wichtig für Lagerung (Auffangwanne!) und Entsorgung: gebrauchte Emulsion und Öl immer als Sonderabfall entsorgen.",
    hExamples: "H400, H410, H411",
  },
];

export default async function GefahrensymbolePage() {
  // Wie oft trägt der Bestand welches Symbol? (nur SDS mit Piktogramm-Daten)
  const sdsWithPictograms = await prisma.safetyDataSheet.findMany({
    where: { NOT: { ghsPictograms: { isEmpty: true } } },
    select: { ghsPictograms: true },
  });
  const counts = new Map<string, number>();
  for (const s of sdsWithPictograms) {
    for (const c of s.ghsPictograms) counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div>
        <Link
          href="/wissen"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft size={13} /> Zurück zum Praxis-Wissen
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertOctagon size={20} />
          </span>
          <div>
            <h1 className="page-title">Gefahrensymbole (GHS/CLP)</h1>
            <p className="text-sm text-slate-500">
              Die 9 offiziellen Warnrauten auf Etikett und Sicherheitsdatenblatt — einfach erklärt
            </p>
          </div>
        </div>
      </div>

      {/* Einleitung */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-900">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Diese Symbole sind EU-weit vorgeschrieben (CLP-Verordnung, Teil des
          REACH-Regelwerks). Sie stehen auf jedem Gebinde und in{" "}
          <strong>Abschnitt 2 des Sicherheitsdatenblatts</strong>. Auf unseren
          Produktseiten siehst du sie direkt im SDS-Kärtchen — so erkennst du auf
          einen Blick, worauf beim Umgang zu achten ist.
        </p>
      </div>

      {/* Symbol-Karten */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYMBOLS.map((s) => {
          const count = counts.get(s.code) ?? 0;
          return (
            <div
              key={s.code}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <GhsPictogram code={s.code} size={56} />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {s.code}
                  </div>
                  <h2 className="text-sm font-bold leading-snug text-slate-900">{s.name}</h2>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    H-Sätze: {s.hExamples}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{s.meaning}</p>
              <p className="mt-2 flex-1 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">In der Praxis: </span>
                {s.praxis}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                {count > 0 ? (
                  <>
                    In <span className="font-semibold text-slate-600">{count}</span>{" "}
                    {count === 1 ? "Sicherheitsdatenblatt" : "Sicherheitsdatenblättern"} unseres
                    Bestands
                  </>
                ) : (
                  "In unserem Bestand aktuell nicht vertreten"
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fußnote */}
      <p className="text-xs text-slate-400">
        Hinweis: Kurzerklärungen ohne Anspruch auf Vollständigkeit — verbindlich sind Etikett und
        Sicherheitsdatenblatt des jeweiligen Produkts. Signalwörter: <strong>„Gefahr"</strong>{" "}
        (schwerwiegender) bzw. <strong>„Achtung"</strong> (weniger schwerwiegend).
      </p>
    </div>
  );
}
