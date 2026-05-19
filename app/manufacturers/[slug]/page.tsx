import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";
import { ExternalLink, Globe } from "lucide-react";

const FOCUS_LABEL: Record<string, string> = {
  COOLANT: "Kühlschmierstoffe",
  NEAT_OIL: "Schneidöle",
  LUBRICANT: "Schmierstoffe",
  GREASE: "Fette",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  CHEMICAL_SUPPLIER: "Chemie-Distributor",
  ADDITIVE: "Additive",
};

const CATEGORY_LABEL: Record<string, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
  GRINDING_OIL: "Schleiföl",
  EDM_FLUID: "Erodier-Dielektrikum",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bettbahnöl",
  FORMING_OIL: "Umformöl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  SPECIALTY: "Spezial",
  ADDITIVE: "Additiv",
  OTHER: "Sonstiges",
};

export default async function ManufacturerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await prisma.manufacturer.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: [{ productFamily: "asc" }, { name: "asc" }],
      },
      _count: { select: { listings: true, sds: true } },
    },
  });
  if (!m) notFound();

  const productsByFamily = new Map<string, typeof m.products>();
  for (const p of m.products) {
    const key = p.productFamily ?? "Sonstige";
    if (!productsByFamily.has(key)) productsByFamily.set(key, []);
    productsByFamily.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/manufacturers" className="text-brand-600 hover:underline">
          ← Alle Hersteller
        </Link>
      </nav>

      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <ManufacturerLogo name={m.name} logoPath={m.logoPath} height={80} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{m.name}</h1>
          {m.description ? (
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {m.headquartersCity || m.headquartersCountry ? (
              <span>
                📍 {[m.headquartersCity, m.headquartersCountry].filter(Boolean).join(", ")}
              </span>
            ) : null}
            {m.foundedYear ? <span>· seit {m.foundedYear}</span> : null}
            {m.website ? (
              <a
                href={m.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                <Globe size={14} />
                {m.website.replace(/^https?:\/\//, "")}
                <ExternalLink size={11} />
              </a>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {m.businessFocus.map((f) => (
              <span
                key={f}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
              >
                {FOCUS_LABEL[f] ?? f}
              </span>
            ))}
          </div>
        </div>
      </header>

      {m.productFamilies.length > 0 || m.knownForApplications.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {m.productFamilies.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Markenfamilien
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.productFamilies.map((f) => (
                  <span key={f} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {m.knownForApplications.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bekannt für
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.knownForApplications.map((a) => (
                  <span key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold text-slate-900">
          Produktkatalog{" "}
          <span className="text-sm font-normal text-slate-500">
            ({m.products.length} Produkte)
          </span>
        </h2>
        {m.products.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Noch keine Produkte im Katalog für diesen Hersteller. Werden in nachfolgenden Etappen ergänzt.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {Array.from(productsByFamily.entries()).map(([family, ps]) => (
              <div key={family}>
                <div className="mb-2 text-sm font-semibold text-slate-700">{family}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ps.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${m.slug}/${p.slug}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-400 hover:shadow-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {CATEGORY_LABEL[p.category] ?? p.category}
                          {p.chemistry ? ` · ${p.chemistry.replace("_", "-").toLowerCase()}` : ""}
                        </div>
                      </div>
                      {p.refractometerFactor != null ? (
                        <span
                          className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                          title="Refraktometer-Faktor verfügbar"
                        >
                          Brix×{p.refractometerFactor}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {m._count.sds > 0 || m._count.listings > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {m._count.sds > 0 ? (
            <Link
              href={`/sds?manufacturer=${encodeURIComponent(m.name)}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-400"
            >
              <div className="text-sm font-semibold text-slate-900">
                {m._count.sds} Sicherheitsdatenblätter
              </div>
              <div className="text-xs text-slate-500">→ zur SDS-Bibliothek</div>
            </Link>
          ) : null}
          {m._count.listings > 0 ? (
            <Link
              href={`/listings?manufacturer=${encodeURIComponent(m.name)}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-400"
            >
              <div className="text-sm font-semibold text-slate-900">
                {m._count.listings} aktive Listings
              </div>
              <div className="text-xs text-slate-500">→ zu den Angeboten</div>
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
