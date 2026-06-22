import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PriceVerifyActions } from "@/components/PriceVerifyActions";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Preis-Verifizierung — Brisco Marketplace" };

export default async function PriceVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?next=/dashboard/prices");

  const role = session.user.role;
  const tier = session.user.trustTier;
  const allowed = role === "ADMIN" || tier === "TRADE_ASSURED" || tier === "PREMIUM";
  if (!allowed) {
    return (
      <div className="card">
        <h1 className="page-title">Zugriff verweigert</h1>
        <p className="mt-2 text-sm text-slate-600">
          Preis-Verifizierung ist Admins und Trade-Assured+ Usern vorbehalten.
        </p>
      </div>
    );
  }

  const [pending, verifiedCount, rejectedCount] = await Promise.all([
    prisma.priceObservation.findMany({
      where: { status: "PENDING" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            manufacturer: { select: { name: true, slug: true } },
          },
        },
        submittedByUser: { select: { pseudonym: true, trustTier: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 100,
    }),
    prisma.priceObservation.count({ where: { status: "VERIFIED" } }),
    prisma.priceObservation.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-600" />
          <h1 className="page-title">Preis-Verifizierung</h1>
          <span className="text-xs text-slate-600">
            {pending.length} ausstehend · {verifiedCount} verifiziert · {rejectedCount} abgelehnt
          </span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          Keine ausstehenden Preis-Meldungen.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {pending.map((o) => (
            <div key={o.id} className="grid gap-2 py-3 md:grid-cols-[1fr,auto,auto]">
              <div className="min-w-0">
                <Link
                  href={`/products/${o.product.manufacturer.slug}/${o.product.slug}`}
                  className="font-medium hover:text-brand-600"
                >
                  {o.product.manufacturer.name} · {o.product.name}
                </Link>
                <div className="mt-1 text-xs text-slate-500">
                  Gemeldet von <strong>{o.submittedByUser?.pseudonym ?? "?"}</strong> ({o.submittedByUser?.trustTier ?? "?"})
                  am {o.submittedAt.toLocaleDateString("de-DE")}
                </div>
                {o.notes && (
                  <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                    💬 {o.notes}
                  </div>
                )}
                {o.sourceLabel && (
                  <div className="mt-1 text-xs text-slate-500">
                    📍 Quelle: {o.sourceLabel}{" "}
                    {o.sourceUrl && (
                      <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                        (Link)
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right text-sm">
                <div className="text-lg font-bold">
                  {o.pricePerUnit.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    {o.unit.replace("_PER_", "/").toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  am {o.observedAt.toLocaleDateString("de-DE")}
                  {o.regionCode && ` · ${o.regionCode}`}
                  {o.packagingForm && ` · ${o.packagingForm}`}
                  {o.quantityMin && ` · ab ${o.quantityMin}`}
                </div>
              </div>
              <PriceVerifyActions observationId={o.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
