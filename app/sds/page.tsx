import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SDS_CATEGORY_LABEL, SDS_LANGUAGE_LABEL } from "@/lib/sds";
import type { SdsCategory } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  manufacturer?: string;
  category?: string;
}>;

export const metadata = {
  title: "Sicherheitsdatenblätter — Brisco Marketplace",
};

export default async function SdsLibraryPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, manufacturer, category } = await searchParams;

  const where: import("@prisma/client").Prisma.SafetyDataSheetWhereInput = {
    ...(manufacturer && { manufacturer: { contains: manufacturer, mode: "insensitive" } }),
    ...(category && { category: category as SdsCategory }),
    ...(q && {
      OR: [
        { productName: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { extractedText: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [sheets, manufacturers, categoryCounts] = await Promise.all([
    prisma.safetyDataSheet.findMany({
      where,
      orderBy: [{ manufacturer: "asc" }, { productName: "asc" }],
      take: 200,
    }),
    prisma.safetyDataSheet.groupBy({ by: ["manufacturer"], _count: { _all: true } }),
    prisma.safetyDataSheet.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  const totalCount = manufacturers.reduce((sum, m) => sum + m._count._all, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sicherheitsdatenblätter</h1>
          <p className="text-sm text-slate-500">
            {totalCount} Dokumente · Hersteller-Originale, EU-Format
          </p>
        </div>
      </div>

      <form className="card grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="label">Volltext (auch in PDF-Inhalt)</label>
          <input
            name="q"
            defaultValue={q}
            className="input"
            placeholder="z.B. Hysol, ISO VG 46, Bor-frei"
          />
        </div>
        <div>
          <label className="label">Hersteller</label>
          <select name="manufacturer" defaultValue={manufacturer ?? ""} className="input">
            <option value="">Alle</option>
            {manufacturers.map((m) => (
              <option key={m.manufacturer} value={m.manufacturer}>
                {m.manufacturer} ({m._count._all})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Kategorie</label>
          <select name="category" defaultValue={category ?? ""} className="input">
            <option value="">Alle</option>
            {categoryCounts.map((c) => (
              <option key={c.category} value={c.category}>
                {SDS_CATEGORY_LABEL[c.category] ?? c.category} ({c._count._all})
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">
            Suchen
          </button>
          <Link href="/sds" className="btn-secondary">
            Zurücksetzen
          </Link>
        </div>
      </form>

      {sheets.length === 0 ? (
        <div className="card text-center text-slate-500">Keine Datenblätter gefunden.</div>
      ) : (
        <div className="card divide-y divide-slate-200">
          {sheets.map((s) => (
            <Link
              key={s.id}
              href={`/sds/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {s.manufacturer} · {s.productName}
                </div>
                <div className="text-xs text-slate-500">
                  {SDS_CATEGORY_LABEL[s.category] ?? s.category} ·{" "}
                  {SDS_LANGUAGE_LABEL[s.language] ?? s.language} · {s.pageCount ?? "?"} Seiten ·{" "}
                  {(s.fileSizeBytes / 1024).toFixed(0)} KB
                </div>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                PDF ansehen
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
