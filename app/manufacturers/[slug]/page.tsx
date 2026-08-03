import Link from "next/link";
import { LeerHinweis } from "@/components/LeerHinweis";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";
import { ProductImage } from "@/components/ProductImage";
import { packagingForProduct } from "@/lib/product-packaging";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { getCurrentPricesBatch } from "@/lib/price-aggregation";
import { ComplianceBadges } from "@/components/ComplianceBadges";
import { AdSlot } from "@/components/AdSlot";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { ExternalLink, Globe, BadgeCheck } from "lucide-react";

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



/** Eigener Titel je Hersteller — 118 Marken-Seiten. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await prisma.manufacturer.findUnique({
    where: { slug },
    select: { name: true, description: true, _count: { select: { products: true } } },
  });
  if (!m) return { title: "Hersteller nicht gefunden — Brisco Marketplace" };
  const titel = `${m.name} — Produktkatalog, Datenblätter & Alternativen`;
  const text =
    m.description?.slice(0, 155) ??
    `${m._count.products} Produkte von ${m.name} mit technischen Daten, Sicherheitsdatenblättern und Alternativvorschlägen.`;
  return { title: titel, description: text, openGraph: { title: titel, description: text } };
}

export default async function ManufacturerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getT();
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

  // Marken-Schaufenster: aktiver Marke-Vertreter dieses Herstellers?
  // Dann wird die Seite zum offiziellen, verifizierten Schaufenster.
  const brandRep = await prisma.user.findFirst({
    where: {
      brandManufacturerId: m.id,
      membershipTier: "MARKE",
      membershipValidUntil: { gt: new Date() },
    },
    select: { pseudonym: true, storefrontHeadline: true, about: true },
    orderBy: { membershipValidUntil: "desc" },
  });

  // Aktuelle Marktpreise pro Produkt batch laden
  const pricesMap = await getCurrentPricesBatch(m.products.map((p) => p.id));

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
          {t("mfr.allManufacturers")}
        </Link>
      </nav>

      {/* Werbeplatzierung der Marke (falls geschaltet) */}
      <AdSlot placement="STOREFRONT" manufacturerId={m.id} />

      {brandRep ? (
        <div className="overflow-hidden rounded-xl border border-brand-300 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-2 border-b border-brand-200 bg-brand-100/70 px-5 py-2 text-xs font-semibold text-brand-800">
            <BadgeCheck size={15} />
            {t("mfr.verifiedStorefront")}
          </div>
          <div className="px-5 py-4">
            {brandRep.storefrontHeadline ? (
              <p className="text-lg font-semibold text-slate-900">{brandRep.storefrontHeadline}</p>
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {fill(t("mfr.storefront"), { name: m.name })}
              </p>
            )}
            {brandRep.about ? (
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{brandRep.about}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <ManufacturerLogo name={m.name} logoPath={m.logoPath} height={80} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">{m.name}</h1>
            {brandRep ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                <BadgeCheck size={12} /> {t("mfr.brandBadge")}
              </span>
            ) : null}
          </div>
          {m.description ? (
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {m.headquartersCity || m.headquartersCountry ? (
              <span>
                📍 {[m.headquartersCity, m.headquartersCountry].filter(Boolean).join(", ")}
              </span>
            ) : null}
            {m.foundedYear ? <span>· {t("mfr.since")} {m.foundedYear}</span> : null}
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
                {t(`focus.${f}`)}
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
                {t("mfr.brandFamilies")}
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
                {t("mfr.knownFor")}
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
        <h2 className="section-title">
          {t("mfr.catalog")}{" "}
          <span className="text-sm font-normal text-slate-500">
            {fill(t("mfr.productsCount"), { n: m.products.length })}
          </span>
        </h2>
        {m.products.length === 0 ? (
          <div className="mt-2">
            <LeerHinweis
              titel={t("mfr.emptyCatalog")}
              text="Wir bauen den Katalog laufend aus. Such solange im Gesamtkatalog — oder stell eine Anfrage, wir holen Angebote für dieses Produkt ein."
              aktionen={["suche", "anfrage"]}
            />
          </div>
        ) : (
          <div className="mt-3 space-y-5">
            {Array.from(productsByFamily.entries()).map(([family, ps]) => (
              <div key={family}>
                <div className="mb-2 text-sm font-semibold text-slate-700">{family}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ps.map((p) => (
                    <div
                      key={p.id}
                      className="group relative flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-400 hover:shadow-soft"
                    >
                      <Link href={`/products/${m.slug}/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                        <ProductImage
                          manufacturer={m.name}
                          productName={p.name}
                          packaging={packagingForProduct(p.category, p.id)}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                            {p.name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {t(`cat.${p.category}`)}
                            {p.chemistry ? ` · ${p.chemistry.replace("_", "-").toLowerCase()}` : ""}
                          </div>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        <ComplianceBadges product={p} size="xs" max={2} />
                        {pricesMap.get(p.id) && (
                          <span
                            className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300"
                            title={`Indikativer Richtwert (modelliert): ${pricesMap.get(p.id)!.observationCount} Datenpunkte, Konfidenz ${pricesMap.get(p.id)!.confidence}`}
                          >
                            💰 {pricesMap.get(p.id)!.median.toFixed(2)} {pricesMap.get(p.id)!.unitLabel}
                          </span>
                        )}
                        {p.refractometerFactor != null ? (
                          <span
                            className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                            title={t("mfr.refractometer")}
                          >
                            Brix×{p.refractometerFactor}
                          </span>
                        ) : null}
                        <CompareToggle id={p.id} kind="products" variant="icon" />
                      </div>
                    </div>
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
              <div className="text-xs text-slate-500">{t("mfr.toSds")}</div>
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
              <div className="text-xs text-slate-500">{t("mfr.toOffers")}</div>
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
