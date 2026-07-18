import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
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
    name: "ghs.s.GHS01.name",
    meaning: "ghs.s.GHS01.meaning",
    praxis: "ghs.s.GHS01.praxis",
    hExamples: "H200–H205",
  },
  {
    code: "GHS02",
    name: "ghs.s.GHS02.name",
    meaning: "ghs.s.GHS02.meaning",
    praxis: "ghs.s.GHS02.praxis",
    hExamples: "H225, H226",
  },
  {
    code: "GHS03",
    name: "ghs.s.GHS03.name",
    meaning: "ghs.s.GHS03.meaning",
    praxis: "ghs.s.GHS03.praxis",
    hExamples: "H270–H272",
  },
  {
    code: "GHS04",
    name: "ghs.s.GHS04.name",
    meaning: "ghs.s.GHS04.meaning",
    praxis: "ghs.s.GHS04.praxis",
    hExamples: "H280, H281",
  },
  {
    code: "GHS05",
    name: "ghs.s.GHS05.name",
    meaning: "ghs.s.GHS05.meaning",
    praxis: "ghs.s.GHS05.praxis",
    hExamples: "H314, H318, H290",
  },
  {
    code: "GHS06",
    name: "ghs.s.GHS06.name",
    meaning: "ghs.s.GHS06.meaning",
    praxis: "ghs.s.GHS06.praxis",
    hExamples: "H300–H331",
  },
  {
    code: "GHS07",
    name: "ghs.s.GHS07.name",
    meaning: "ghs.s.GHS07.meaning",
    praxis: "ghs.s.GHS07.praxis",
    hExamples: "H315, H317, H319, H335",
  },
  {
    code: "GHS08",
    name: "ghs.s.GHS08.name",
    meaning: "ghs.s.GHS08.meaning",
    praxis: "ghs.s.GHS08.praxis",
    hExamples: "H304, H350, H360, H372",
  },
  {
    code: "GHS09",
    name: "ghs.s.GHS09.name",
    meaning: "ghs.s.GHS09.meaning",
    praxis: "ghs.s.GHS09.praxis",
    hExamples: "H400, H410, H411",
  },
];

export default async function GefahrensymbolePage() {
  const t = await getT();
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
          <ArrowLeft size={13} /> {t("ghs.back")}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertOctagon size={20} />
          </span>
          <div>
            <h1 className="page-title">{t("ghs.title")}</h1>
            <p className="text-sm text-slate-500">{t("ghs.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Einleitung */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-900">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          {t("ghs.introBefore")}{" "}
          <strong>{t("ghs.sub")}</strong>. {t("ghs.introAfter")}
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
                  <h2 className="text-sm font-bold leading-snug text-slate-900">{t(s.name)}</h2>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {t("ghs.hSatze")} {s.hExamples}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{t(s.meaning)}</p>
              <p className="mt-2 flex-1 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">{t("ghs.inPractice")}</span>
                {t(s.praxis)}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                {count > 0
                  ? fill(t(count === 1 ? "ghs.countSingular" : "ghs.countPlural"), {
                      count,
                    })
                  : t("ghs.countNone")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fußnote */}
      <p className="text-xs text-slate-400">
        {t("ghs.footnote1")} <strong>{t("ghs.signalDanger")}</strong>{" "}
        {t("ghs.footnoteMid")} <strong>{t("ghs.signalWarning")}</strong>{" "}
        {t("ghs.footnoteEnd")}
      </p>
    </div>
  );
}
