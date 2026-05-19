import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SDS_CATEGORY_LABEL, SDS_LANGUAGE_LABEL } from "@/lib/sds";
import { ProductImage } from "@/components/ProductImage";

export default async function SdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sds = await prisma.safetyDataSheet.findUnique({
    where: { id },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          manufacturer: true,
          productName: true,
          locationRegion: true,
          packaging: true,
        },
        take: 20,
      },
    },
  });
  if (!sds) notFound();

  return (
    <div className="space-y-6">
      <Link href="/sds" className="text-sm text-brand-500 hover:underline">
        ← zur Bibliothek
      </Link>

      <div className="card space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {SDS_CATEGORY_LABEL[sds.category] ?? sds.category}
          </div>
          <h1 className="text-2xl font-semibold">
            {sds.manufacturer} {sds.productName}
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Meta label="Sprache" value={SDS_LANGUAGE_LABEL[sds.language] ?? sds.language} />
          <Meta label="Seiten" value={sds.pageCount?.toString() ?? "–"} />
          <Meta label="Dateigröße" value={`${(sds.fileSizeBytes / 1024).toFixed(0)} KB`} />
          <Meta
            label="In Bibliothek geladen"
            value={sds.fetchedAt.toLocaleDateString("de-DE")}
          />
          <Meta label="SHA-256" value={<code className="text-xs">{sds.sha256.slice(0, 24)}…</code>} />
          <Meta
            label="Originalquelle"
            value={
              <a
                href={sds.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-brand-500 hover:underline"
              >
                {new URL(sds.sourceUrl).hostname}
              </a>
            }
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={`/api/sds/${sds.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            PDF herunterladen
          </a>
          <a
            href={`/api/sds/${sds.id}/download?inline=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Im Browser öffnen
          </a>
        </div>
      </div>

      {sds.listings.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Aktive Listings, die dieses Datenblatt nutzen
          </h2>
          <div className="card divide-y divide-slate-200">
            {sds.listings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <ProductImage
                  manufacturer={l.manufacturer}
                  productName={l.productName}
                  packaging={l.packaging}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {l.manufacturer} {l.productName}
                  </div>
                  <div className="text-xs text-slate-500">{l.locationRegion}</div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}
