import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { Search, Plus } from "lucide-react";

const statusStyle: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  CANCELED: "bg-slate-200 text-slate-600",
};

export default async function RfqListPage() {
  const session = await getServerSession(authOptions);
  const trustTier = session?.user?.trustTier;

  const where: import("@prisma/client").Prisma.RfqWhereInput = {
    OR: [
      { visibility: "PUBLIC" },
      ...(trustTier && trustTier !== "UNVERIFIED" ? [{ visibility: "VERIFIED_ONLY" as const }] : []),
      ...(session?.user?.id ? [{ buyerId: session.user.id }] : []),
    ],
  };

  const rfqs = await prisma.rfq.findMany({
    where,
    include: {
      buyer: { select: { pseudonym: true, trustTier: true } },
      _count: { select: { offers: true } },
    },
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Banner: klar dass das die "Suchen"-Seite ist */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              <Search size={12} /> SUCHEN
            </div>
            <h1 className="page-title">Was Reseller suchen</h1>
            <p className="mt-1 text-sm text-slate-600">
              Offene Bedarfe — wenn du das gesuchte Produkt verfügbar hast, kannst
              du ein Angebot mit Preis und Lieferzeit abgeben.
            </p>
          </div>
          {session?.user && (
            <Link
              href="/rfqs/new"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-amber-700"
            >
              <Plus size={16} /> Eigenen Bedarf einstellen
            </Link>
          )}
        </div>
      </div>

      {rfqs.length === 0 ? (
        <div className="card text-slate-500">
          Noch keine Bedarfe eingestellt.{" "}
          {session?.user ? "Stelle den ersten ein." : "Anmelden, um etwas zu suchen."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rfqs.map((r) => (
            <Link
              key={r.id}
              href={`/rfqs/${r.id}`}
              className="group relative block overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-amber-300"
            >
              {/* Amber-Top-Streifen — visuell sofort "Suche" */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    <Search size={10} /> Sucht
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusStyle[r.status] ?? ""
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {r.productType} {r.isoViscosity ? `· ISO VG ${r.isoViscosity}` : ""}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {r.manufacturer ? `${r.manufacturer} · ` : ""}
                  {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  📍 {r.locationRegion} · Frist {r.deadline.toLocaleDateString("de-DE")}
                </div>
                {r.notes && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.notes}</p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Suchender:</span>
                    <span className="text-slate-700">{r.buyer.pseudonym}</span>
                    <TrustBadge tier={r.buyer.trustTier} size="xs" />
                    {r.visibility === "VERIFIED_ONLY" && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                        Verified+
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600">
                    {r._count.offers}{" "}
                    {r._count.offers === 1 ? "Angebot eingegangen" : "Angebote eingegangen"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
