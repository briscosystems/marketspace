import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";

export const metadata = {
  title: "Hersteller — Brisco Marketplace",
  description: "Alle Hersteller von Kühlschmierstoffen und Schmierstoffen mit Produktkatalog.",
};

const FOCUS_LABEL: Record<string, string> = {
  COOLANT: "KSS",
  NEAT_OIL: "Schneidöl",
  LUBRICANT: "Schmierstoff",
  GREASE: "Fett",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korr.-Schutz",
  CHEMICAL_SUPPLIER: "Distributor",
  ADDITIVE: "Additiv",
};

export default async function ManufacturersPage() {
  const manufacturers = await prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true, listings: true, sds: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Hersteller & Lieferanten</h1>
        <p className="mt-1 text-sm text-slate-600">
          {manufacturers.length} Hersteller im Katalog —{" "}
          {manufacturers.reduce((s, m) => s + m._count.products, 0)} Produkte hinterlegt.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {manufacturers.map((m) => (
          <Link
            key={m.id}
            href={`/manufacturers/${m.slug}`}
            className="group flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-soft"
          >
            <div className="flex h-20 items-center justify-center">
              <ManufacturerLogo name={m.name} logoPath={m.logoPath} height={56} />
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-600">
                {m.name}
              </div>
              {m.headquartersCountry ? (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {m.headquartersCity ? `${m.headquartersCity}, ` : ""}
                  {m.headquartersCountry}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {m.businessFocus.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {FOCUS_LABEL[f] ?? f}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                {m._count.products > 0 ? <span>{m._count.products} Produkte</span> : null}
                {m._count.sds > 0 ? <span>{m._count.sds} SDS</span> : null}
                {m._count.listings > 0 ? <span>{m._count.listings} Listings</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
