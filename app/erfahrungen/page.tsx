/**
 * /erfahrungen — freigegebene Praxis-Erfahrungen lesen und filtern
 * (Betreiber 2026-08-16: „Filterung einbauen").
 *
 * Zeigt NUR freigegebene Berichte (status = APPROVED). Filter:
 *  - Problem (Schlagworte aus den Berichten selbst — die Praxis bestimmt
 *    das Vokabular, keine starre Liste)
 *  - Hersteller (über das verknüpfte Katalogprodukt)
 *  - Ausgang (gelöst / nicht gelöst / offen)
 *  - Volltextsuche über Text, Produkt und Maschine
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { LeerHinweis } from "@/components/LeerHinweis";
import { MessagesSquare, CheckCircle2, XCircle, CircleDashed } from "lucide-react";

export const metadata = { title: "Praxis-Erfahrungen — Brisco Marketplace" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const OUTCOME_META: Record<string, { label: string; cls: string }> = {
  SOLVED: { label: "gelöst", cls: "bg-emerald-100 text-emerald-900" },
  IMPROVED: { label: "verbessert", cls: "bg-lime-100 text-lime-900" },
  UNSOLVED: { label: "nicht gelöst", cls: "bg-red-50 text-red-800" },
  ONGOING: { label: "läuft noch", cls: "bg-amber-100 text-amber-900" },
};

export default async function ErfahrungenPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const problem = typeof params.problem === "string" ? params.problem : "";
  const herstellerSlug = typeof params.hersteller === "string" ? params.hersteller : "";
  const outcome = typeof params.ausgang === "string" ? params.ausgang : "";

  const alle = await prisma.experienceReport.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      text: true,
      problems: true,
      machine: true,
      outcome: true,
      productFreetext: true,
      createdAt: true,
      user: { select: { pseudonym: true } },
      product: {
        select: {
          name: true,
          slug: true,
          manufacturer: { select: { name: true, slug: true } },
        },
      },
      media: { select: { id: true, kind: true }, take: 4 },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  // Filteroptionen aus den Berichten selbst ableiten
  const problemZaehler = new Map<string, number>();
  const herstellerZaehler = new Map<string, { name: string; n: number }>();
  for (const r of alle) {
    for (const p of r.problems) problemZaehler.set(p, (problemZaehler.get(p) ?? 0) + 1);
    if (r.product) {
      const h = herstellerZaehler.get(r.product.manufacturer.slug);
      herstellerZaehler.set(r.product.manufacturer.slug, {
        name: r.product.manufacturer.name,
        n: (h?.n ?? 0) + 1,
      });
    }
  }

  const gefiltert = alle.filter((r) => {
    if (problem && !r.problems.includes(problem)) return false;
    if (herstellerSlug && r.product?.manufacturer.slug !== herstellerSlug) return false;
    if (outcome && r.outcome !== outcome) return false;
    if (q) {
      const heuhaufen = [
        r.text,
        r.productFreetext ?? "",
        r.product ? `${r.product.manufacturer.name} ${r.product.name}` : "",
        r.machine ?? "",
        ...r.problems,
      ]
        .join(" ")
        .toLowerCase();
      if (!heuhaufen.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const filterCount = [problem, herstellerSlug, outcome, q].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 page-title">
          <MessagesSquare className="h-6 w-6 text-brand-600" />
          {t("erfl.titel")}
        </h1>
        <p className="text-sm text-slate-500">{t("erfl.untertitel")}</p>
      </div>

      <FilterBar
        count={gefiltert.length}
        noun={gefiltert.length === 1 ? t("erfl.nounOne") : t("erfl.nounOther")}
        resetHref="/erfahrungen"
        filterCount={filterCount}
        search={<SearchInput placeholder={t("erfl.suchePlatzhalter")} />}
      >
        <FilterDropdown
          label={t("erfl.filterProblem")}
          paramKey="problem"
          options={[...problemZaehler.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([p, n]) => ({ value: p, label: p, count: n }))}
        />
        <FilterDropdown
          label={t("filter.manufacturer")}
          paramKey="hersteller"
          options={[...herstellerZaehler.entries()]
            .sort((a, b) => b[1].n - a[1].n)
            .map(([slug, h]) => ({ value: slug, label: h.name, count: h.n }))}
        />
        <FilterDropdown
          label={t("erfl.filterAusgang")}
          paramKey="ausgang"
          options={Object.entries(OUTCOME_META).map(([v, m]) => ({ value: v, label: m.label }))}
        />
      </FilterBar>

      {gefiltert.length === 0 ? (
        <LeerHinweis
          titel={t("erfl.leerTitel")}
          text={t("erfl.leerText")}
          aktionen={["suche"]}
          suchLink="/erfahrungen"
        />
      ) : (
        <div className="space-y-3">
          {gefiltert.map((r) => (
            <article key={r.id} className="card space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {r.product ? (
                  <Link
                    href={`/products/${r.product.manufacturer.slug}/${r.product.slug}`}
                    className="font-semibold text-slate-900 hover:text-brand-700"
                  >
                    {r.product.manufacturer.name} {r.product.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">
                    {r.productFreetext ?? t("erfl.ohneProdukt")}
                  </span>
                )}
                {r.machine && <span>· {r.machine}</span>}
                <span className="ml-auto">
                  {r.user.pseudonym} · {r.createdAt.toLocaleDateString("de-CH")}
                </span>
                {r.outcome && OUTCOME_META[r.outcome] && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${OUTCOME_META[r.outcome].cls}`}
                  >
                    {r.outcome === "SOLVED" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : r.outcome === "UNSOLVED" ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <CircleDashed className="h-3 w-3" />
                    )}
                    {OUTCOME_META[r.outcome].label}
                  </span>
                )}
              </div>

              {r.problems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.problems.map((p) => (
                    <Link
                      key={p}
                      href={`/erfahrungen?problem=${encodeURIComponent(p)}`}
                      className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100"
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}

              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{r.text}</p>
              {r.media.length > 0 && (
                <p className="text-xs text-slate-400">
                  {r.media.length} {r.media.length === 1 ? t("erfl.beilage") : t("erfl.beilagen")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-slate-500">
        {t("erfl.mitmachen")}{" "}
        <Link href="/erkennen" className="font-medium text-brand-700 hover:underline">
          {t("erfl.mitmachenLink")}
        </Link>
      </p>
    </div>
  );
}
