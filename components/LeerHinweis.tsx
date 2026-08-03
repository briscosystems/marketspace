import Link from "next/link";
import { Sparkles, Plus, Search } from "lucide-react";

/**
 * Einheitlicher leerer Zustand — nie eine Sackgasse.
 *
 * Eine leere Trefferliste ist der häufigste Moment, in dem Besucher abspringen.
 * Statt „Keine Angebote gefunden" bekommt jede leere Liste denselben Ausweg:
 * die KI-Suche nach einer Alternative und die Möglichkeit, den Bedarf
 * einzustellen. Das ist zugleich die ehrliche Antwort einer jungen Plattform —
 * wir tun nicht so, als sei alles da, sondern holen es.
 *
 * Bewusst schlicht gehalten (keine Zustände, kein JavaScript), damit der
 * Baustein auf jeder Seite ohne Umbau eingesetzt werden kann.
 */
export function LeerHinweis({
  titel,
  text,
  aktionen = ["alternative", "anfrage"],
  suchLink,
}: {
  titel: string;
  /** Ein Satz, der erklärt, warum nichts da ist — ohne Ausrede. */
  text?: string;
  aktionen?: ("alternative" | "anfrage" | "suche")[];
  /** Ziel für die Aktion „suche" (Standard: Angebots-/Katalogsuche). */
  suchLink?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <h3 className="text-base font-bold text-slate-900">{titel}</h3>
      {text && <p className="mx-auto mt-1.5 max-w-lg text-sm text-slate-600">{text}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {aktionen.includes("alternative") && (
          <Link
            href="/kss-finder#alternativen"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
          >
            <Sparkles size={16} /> Alternative finden (KI)
          </Link>
        )}
        {aktionen.includes("anfrage") && (
          <Link
            href="/rfqs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            <Plus size={16} /> Anfrage einstellen — ohne Konto, wir holen Angebote ein
          </Link>
        )}
        {aktionen.includes("suche") && (
          <Link
            href={suchLink ?? "/listings"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            <Search size={16} /> Im Katalog suchen
          </Link>
        )}
      </div>
    </div>
  );
}
