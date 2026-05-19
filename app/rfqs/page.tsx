import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";

const statusStyle: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Anfragen (RFQ)</h1>
          <p className="text-sm text-slate-600">
            Reseller, die etwas suchen, posten hier ihre Anfrage. Du bietest mit
            Preis und Lieferzeit — ggf. inklusive Alternativvorschlag.
          </p>
        </div>
        {session?.user && (
          <Link href="/rfqs/new" className="btn-primary">
            Neue Anfrage
          </Link>
        )}
      </div>

      {rfqs.length === 0 ? (
        <div className="card text-slate-500">
          Noch keine Anfragen. {session?.user ? "Lege die erste an." : "Anmelden, um anzulegen."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rfqs.map((r) => (
            <Link key={r.id} href={`/rfqs/${r.id}`} className="card hover:border-brand-500">
              <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>
                  {r.productType} {r.isoViscosity ? `· ISO VG ${r.isoViscosity}` : ""}
                </span>
                <span className={`rounded-full px-2 py-0.5 normal-case ${statusStyle[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
              <div className="text-lg font-semibold">
                {r.manufacturer ? `${r.manufacturer} · ` : ""}
                {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {r.locationRegion} · Frist {r.deadline.toLocaleDateString("de-DE")}
              </div>
              {r.notes && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.notes}</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">{r.buyer.pseudonym}</span>
                  <TrustBadge tier={r.buyer.trustTier} size="xs" />
                  {r.visibility === "VERIFIED_ONLY" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                      Verified+
                    </span>
                  )}
                </div>
                <span className="text-slate-600">
                  {r._count.offers} {r._count.offers === 1 ? "Angebot" : "Angebote"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
