import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { SearchInput } from "@/components/SearchInput";
import { ExpandableText } from "@/components/ExpandableText";
import { ProductImage } from "@/components/ProductImage";
import { packagingForProduct } from "@/lib/product-packaging";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ExternalLink,
  Wrench,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";

type SearchParams = Promise<{ category?: string; q?: string }>;

// Die Beschriftungen stehen in lib/i18n.ts (issuecat.*) — vorher standen sie
// hier nur auf Deutsch, englische und niederländische Nutzer sahen Deutsch.
const CATEGORY_KEYS = [
  "WORKPIECE_STAINS", "CORROSION", "BIOLOGY", "FOAM", "OPERATOR_HEALTH",
  "SEAL_DAMAGE", "RESIDUES", "TOOL_WEAR", "FILTRATION", "STABILITY",
  "PERFORMANCE", "COMPATIBILITY", "REGULATORY", "SHELF_LIFE", "OTHER",
];

const SEVERITY: Record<string, { key: string; cls: string; Icon: typeof Info }> = {
  HIGH: { key: "sev.HIGH", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: AlertOctagon },
  MEDIUM: { key: "sev.MEDIUM", cls: "bg-amber-50 text-amber-800 border-amber-200", Icon: AlertTriangle },
  LOW: { key: "sev.LOW", cls: "bg-slate-50 text-slate-600 border-slate-200", Icon: Info },
};

export default async function WissenPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  const { category, q } = await searchParams;

  const baseWhere = { status: { not: "REJECTED" as const } };
  const where: import("@prisma/client").Prisma.ProductIssueWhereInput = {
    ...baseWhere,
    ...(category && { category: category as import("@prisma/client").IssueCategory }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { symptoms: { has: q } },
      ],
    }),
  };

  const [issues, catCounts, total] = await Promise.all([
    prisma.productIssue.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true, category: true, manufacturer: { select: { name: true, slug: true } } },
        },
      },
      orderBy: [{ severity: "desc" }, { reportCount: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    prisma.productIssue.groupBy({
      by: ["category"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.productIssue.count({ where: baseWhere }),
  ]);

  const counts = new Map(catCounts.map((c) => [c.category as string, c._count._all]));
  // Kategorien nach Häufigkeit, Werkstück-Flecken bewusst als erstes Highlight
  const chips = CATEGORY_KEYS
    .filter((k) => counts.get(k))
    .map((k) => ({ key: k, label: t(`issuecat.${k}`), count: counts.get(k) ?? 0 }));

  function chipHref(cat: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("category", cat);
    const s = p.toString();
    return s ? `/wissen?${s}` : "/wissen";
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-soft md:p-9">
        <div className="eyebrow text-brand-700">{t("know.eyebrow")}</div>
        <h1 className="page-title mt-2 max-w-3xl">
          {t("know.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Was in Datenblättern fehlt: reale Erfahrungen aus Fertigung, Foren und von
          Herstellern — Fleckenbildung auf Werkstücken, Schaum, Korrosion, Verkeimung,
          Hautverträglichkeit u. v. m. Durchsuchbar und je Produkt verknüpft.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm font-semibold text-slate-500">
            {total} dokumentierte Praxis-Fälle
          </span>
          <Link
            href="/wissen/gefahrensymbole"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            <AlertOctagon size={13} />
            Gefahrensymbole (GHS) erklärt →
          </Link>
        </div>
      </section>

      {/* Suche in den Praxis-Fällen (durchsucht Titel, Beschreibung, Symptome) */}
      <div className="max-w-xl">
        <Suspense fallback={null}>
          <SearchInput placeholder={t("know.searchPlaceholder")} />
        </Suspense>
      </div>

      {/* Kategorie-Filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <CatChip href={chipHref(null)} active={!category} label={t("filter.all")} count={total} />
        {chips.map((c) => (
          <CatChip
            key={c.key}
            href={chipHref(c.key)}
            active={category === c.key}
            label={c.label}
            count={c.count}
          />
        ))}
      </div>

      {/* Fälle */}
      {issues.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Keine Einträge gefunden.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {issues.map((it) => {
            const sev = SEVERITY[it.severity] ?? SEVERITY.MEDIUM;
            const SevIcon = sev.Icon;
            return (
              <article
                key={it.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sev.cls}`}>
                    <SevIcon size={12} /> {t(sev.key)}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                    {t(`issuecat.${it.category}`)}
                  </span>
                  {it.isOfficial && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={12} /> Hersteller
                    </span>
                  )}
                  {it.reportCount > 1 && (
                    <span className="text-xs text-slate-400">{it.reportCount}× gemeldet</span>
                  )}
                </div>

                <div>
                  <h2 className="text-base font-bold leading-tight text-slate-900">{it.title}</h2>
                  {it.product?.manufacturer && (
                    <Link
                      href={`/products/${it.product.manufacturer.slug}/${it.product.slug}`}
                      className="mt-1 inline-flex items-center gap-2 text-sm text-brand-700 hover:underline"
                    >
                      <ProductImage
                        manufacturer={it.product.manufacturer.name}
                        productName={it.product.name}
                        packaging={packagingForProduct(it.product.category, it.product.id)}
                        size="xs"
                      />
                      {it.product.manufacturer.name} · {it.product.name}
                    </Link>
                  )}
                </div>

                <ExpandableText
                  text={it.description}
                  moreLabel={t("know.showMore")}
                  lessLabel={t("know.showLess")}
                />

                {it.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {it.symptoms.slice(0, 5).map((s, i) => (
                      <span key={i} className="chip bg-slate-100 text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {it.rootCause && (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{t("know.cause")}</span> {it.rootCause}
                  </div>
                )}

                {(it.workaround || it.preventiveMeasure) && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <Lightbulb size={16} className="mt-0.5 shrink-0" />
                    <span>{it.workaround ?? it.preventiveMeasure}</span>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                  {it.affectedMaterials.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Wrench size={12} /> {it.affectedMaterials.slice(0, 3).join(", ")}
                    </span>
                  )}
                  {it.sourceUrl ? (
                    <a
                      href={it.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-slate-600"
                    >
                      <ExternalLink size={12} /> {t("know.source")}
                    </a>
                  ) : (
                    it.sourceTitle && <span>{t("know.source")}: {it.sourceTitle}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CatChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className={`text-xs ${active ? "text-brand-600" : "text-slate-400"}`}>{count}</span>
    </Link>
  );
}
