import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { AlternativeSearchPanel } from "@/components/AlternativeSearchPanel";
import { RfqCard, type RfqCardData } from "@/components/RfqCard";
import { Search, Plus } from "lucide-react";
import type { Prisma, RfqStatus } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  productType?: string;
  isoViscosity?: string;
  region?: string;
  status?: string;
  view?: string;
}>;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "offen",
  ACCEPTED: "vergeben",
  EXPIRED: "abgelaufen",
  CANCELED: "storniert",
};

export default async function RfqListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { q, productType, isoViscosity, region, status } = sp;
  const variant: "compact" | "extended" = sp.view === "extended" ? "extended" : "compact";

  const session = await getServerSession(authOptions);
  const trustTier = session?.user?.trustTier;

  const visibilityOR: Prisma.RfqWhereInput[] = [
    { visibility: "PUBLIC" },
    ...(trustTier && trustTier !== "UNVERIFIED" ? [{ visibility: "VERIFIED_ONLY" as const }] : []),
    ...(session?.user?.id ? [{ buyerId: session.user.id }] : []),
  ];

  const and: Prisma.RfqWhereInput[] = [{ OR: visibilityOR }];
  if (productType) and.push({ productType });
  if (isoViscosity) and.push({ isoViscosity });
  if (region) and.push({ locationRegion: { contains: region, mode: "insensitive" } });
  if (status) and.push({ status: status as RfqStatus });
  if (q)
    and.push({
      OR: [
        { manufacturer: { contains: q, mode: "insensitive" } },
        { productType: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  const where: Prisma.RfqWhereInput = { AND: and };

  const [rfqs, productTypeGroups, isoGroups, regionGroups, statusGroups] = await Promise.all([
    prisma.rfq.findMany({
      where,
      include: {
        buyer: { select: { pseudonym: true, trustTier: true } },
        _count: { select: { offers: true } },
      },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      take: 50,
    }),
    prisma.rfq.groupBy({ by: ["productType"], where: { OR: visibilityOR }, _count: { _all: true } }),
    prisma.rfq.groupBy({ by: ["isoViscosity"], where: { OR: visibilityOR }, _count: { _all: true } }),
    prisma.rfq.groupBy({ by: ["locationRegion"], where: { OR: visibilityOR }, _count: { _all: true } }),
    prisma.rfq.groupBy({ by: ["status"], where: { OR: visibilityOR }, _count: { _all: true } }),
  ]);

  const cards: RfqCardData[] = rfqs.map((r) => ({
    id: r.id,
    productType: r.productType,
    manufacturer: r.manufacturer,
    isoViscosity: r.isoViscosity,
    quantity: r.quantity,
    quantityUnit: r.quantityUnit,
    locationRegion: r.locationRegion,
    deadline: r.deadline,
    notes: r.notes,
    status: r.status,
    visibility: r.visibility,
    offersCount: r._count.offers,
    buyer: r.buyer,
  }));

  const productTypeOptions = [
    { value: "", label: "Alle Typen" },
    ...productTypeGroups
      .filter((o) => o.productType)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.productType, label: o.productType, count: o._count._all })),
  ];
  const isoOptions = [
    { value: "", label: "Alle ISO VG" },
    ...isoGroups
      .filter((o) => o.isoViscosity)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({
        value: o.isoViscosity as string,
        label: o.isoViscosity as string,
        count: o._count._all,
      })),
  ];
  const regionOptions = [
    { value: "", label: "Alle Regionen" },
    ...regionGroups
      .filter((o) => o.locationRegion)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.locationRegion, label: o.locationRegion, count: o._count._all })),
  ];
  const statusOptions = [
    { value: "", label: "Alle Status" },
    ...statusGroups
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.status, label: STATUS_LABEL[o.status] ?? o.status, count: o._count._all })),
  ];

  const filterCount =
    (q ? 1 : 0) + (productType ? 1 : 0) + (isoViscosity ? 1 : 0) + (region ? 1 : 0) + (status ? 1 : 0);

  function urlWithParam(name: string, value: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (productType) p.set("productType", productType);
    if (isoViscosity) p.set("isoViscosity", isoViscosity);
    if (region) p.set("region", region);
    if (status) p.set("status", status);
    if (variant === "extended") p.set("view", "extended");
    if (value == null) p.delete(name);
    else p.set(name, value);
    return `/rfqs?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header: „Ich suche" — Suchen = amber */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Search size={22} />
          </span>
          <div>
            <h1 className="page-title text-amber-900">Ich suche</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Stell deinen Bedarf ein — Anbieter melden sich mit Preis und Lieferzeit.
            </p>
          </div>
        </div>
        {session?.user && (
          <Link
            href="/rfqs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-700"
          >
            <Plus size={18} /> Eigenen Bedarf einstellen
          </Link>
        )}
      </div>

      {/* Alternativprodukt-Suche (KI + Web) — gehört in die Such-Abfrage */}
      <AlternativeSearchPanel />

      <FilterBar
        count={cards.length}
        title="Aktuelle Bedarfe"
        noun={cards.length === 1 ? "Bedarf" : "Bedarfe"}
        resetHref="/rfqs"
        filterCount={filterCount}
        collapsible
        search={<SearchInput placeholder="z.B. Castrol, KSS, Schleifen…" />}
        toolbar={
          <div className="inline-flex overflow-hidden rounded-full ring-1 ring-slate-200">
            <Link
              href={urlWithParam("view", null)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                variant === "compact" ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Kompakte Liste"
            >
              ≡ Kompakt
            </Link>
            <Link
              href={urlWithParam("view", "extended")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                variant === "extended" ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Detaillierte Karten"
            >
              ▦ Erweitert
            </Link>
          </div>
        }
      >
        <FilterDropdown label="Produkttyp" paramKey="productType" options={productTypeOptions} />
        <FilterDropdown label="ISO VG" paramKey="isoViscosity" options={isoOptions} />
        <FilterDropdown label="Region" paramKey="region" options={regionOptions} />
        <FilterDropdown label="Status" paramKey="status" options={statusOptions} />
      </FilterBar>

      {cards.length === 0 ? (
        <div className="card text-slate-500">
          Keine Bedarfe gefunden.{" "}
          {filterCount > 0 ? (
            <Link href="/rfqs" className="text-brand-600 hover:underline">
              Filter zurücksetzen
            </Link>
          ) : session?.user ? (
            "Stelle den ersten ein."
          ) : (
            "Anmelden, um etwas zu suchen."
          )}
        </div>
      ) : variant === "compact" ? (
        <div className="space-y-2">
          {cards.map((r) => (
            <RfqCard key={r.id} rfq={r} variant="compact" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((r) => (
            <RfqCard key={r.id} rfq={r} variant="extended" />
          ))}
        </div>
      )}
    </div>
  );
}
