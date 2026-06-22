import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SDS_CATEGORY_LABEL, SDS_LANGUAGE_LABEL } from "@/lib/sds";
import { ProductImage } from "@/components/ProductImage";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Beaker,
  Truck,
  Phone,
  ShieldAlert,
} from "lucide-react";

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
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          chemistry: true,
          viscosityIso: true,
          manufacturer: { select: { name: true, slug: true } },
        },
        orderBy: { name: "asc" },
        take: 30,
      },
    },
  });
  if (!sds) notFound();

  const hasParsedData =
    sds.parsedAt !== null ||
    sds.hStatements.length > 0 ||
    sds.phValue !== null ||
    sds.flashpointC !== null ||
    sds.reachCompliant !== null ||
    sds.containsBoron !== null ||
    sds.containsFormaldehydeReleaser !== null ||
    sds.casNumbers.length > 0;

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
          <h1 className="page-title">
            {sds.manufacturer} {sds.productName}
          </h1>
          {sds.signalWord && (
            <span
              className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${
                /gefahr|danger/i.test(sds.signalWord)
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {sds.signalWord}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Meta label="Sprache" value={SDS_LANGUAGE_LABEL[sds.language] ?? sds.language} />
          <Meta label="Seiten" value={sds.pageCount?.toString() ?? "–"} />
          <Meta label="Dateigröße" value={`${(sds.fileSizeBytes / 1024).toFixed(0)} KB`} />
          <Meta
            label="In Bibliothek geladen"
            value={sds.fetchedAt.toLocaleDateString("de-DE")}
          />
          {sds.version && <Meta label="Version" value={sds.version} />}
          {sds.revisionDate && (
            <Meta label="Revisionsdatum" value={sds.revisionDate.toLocaleDateString("de-DE")} />
          )}
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

      {hasParsedData && (
        <>
          {/* REACH & Inhaltsstoff-Flags */}
          {(sds.reachCompliant !== null ||
            sds.svhcSubstances.length > 0 ||
            sds.containsBoron !== null ||
            sds.containsFormaldehydeReleaser !== null ||
            sds.containsSecondaryAmines !== null ||
            sds.containsChlorinatedParaffins !== null ||
            sds.containsMineralOil !== null ||
            sds.containsPrimaryAromaticAmines !== null ||
            sds.hasBactericide !== null ||
            sds.hasFungicide !== null ||
            sds.biocidalActives.length > 0) && (
            <section className="card space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-600" />
                <h2 className="section-title">REACH &amp; Inhaltsstoffe</h2>
              </div>

              {/* REACH-Status */}
              {sds.reachCompliant !== null && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-500">REACH</span>
                  {sds.reachCompliant ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      ✓ konform/registriert
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      ✗ nicht konform
                    </span>
                  )}
                  {sds.reachNotes && <span className="text-xs text-slate-600">— {sds.reachNotes}</span>}
                </div>
              )}

              {/* SVHC */}
              {sds.svhcSubstances.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-red-700">
                    SVHC ({sds.svhcSubstances.length})
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sds.svhcSubstances.map((s, i) => (
                      <span
                        key={i}
                        className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 ring-1 ring-red-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inhaltsstoff-Pills */}
              <div className="flex flex-wrap gap-1.5">
                <IngredientPill name="Bor / Borate" v={sds.containsBoron} />
                <IngredientPill name="Formaldehyd-Donor" v={sds.containsFormaldehydeReleaser} />
                <IngredientPill name="sek. Amine (DEA/Morpholin)" v={sds.containsSecondaryAmines} />
                <IngredientPill name="Chlorparaffine" v={sds.containsChlorinatedParaffins} />
                <IngredientPill name="Mineralöl" v={sds.containsMineralOil} neutralWhenTrue />
                <IngredientPill name="primäre arom. Amine (PAA)" v={sds.containsPrimaryAromaticAmines} />
                <IngredientPill name="Bakterizid" v={sds.hasBactericide} neutralWhenTrue />
                <IngredientPill name="Fungizid" v={sds.hasFungicide} neutralWhenTrue />
              </div>

              {/* Biozid-Wirkstoffe konkret */}
              {sds.biocidalActives.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Biozid-Wirkstoffe
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sds.biocidalActives.map((b, i) => (
                      <span key={i} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* GHS / CLP */}
          {(sds.hStatements.length > 0 ||
            sds.pStatements.length > 0 ||
            sds.ghsPictograms.length > 0) && (
            <section className="card space-y-3">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-red-600" />
                <h2 className="section-title">GHS / CLP — Gefahrenmerkmale</h2>
              </div>
              {sds.ghsPictograms.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">Piktogramme</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sds.ghsPictograms.map((p) => (
                      <span key={p} className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sds.hStatements.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    H-Sätze (Gefahrenhinweise)
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sds.hStatements.map((h) => (
                      <span key={h} className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sds.pStatements.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    P-Sätze (Sicherheitshinweise)
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sds.pStatements.map((p) => (
                      <span key={p} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Physik / Chemie */}
          {(sds.physicalState ||
            sds.appearanceColor ||
            sds.odor ||
            sds.phValue !== null ||
            sds.flashpointC !== null ||
            sds.densityGcm3 !== null ||
            sds.viscosityKv40 !== null ||
            sds.pourpointC !== null ||
            sds.boilingPointC !== null ||
            sds.waterSolubility) && (
            <section className="card space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-brand-600" />
                <h2 className="section-title">Physikalisch-chemische Eigenschaften</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Meta label="Aggregatzustand" value={sds.physicalState ?? "–"} />
                <Meta label="Farbe / Erscheinung" value={sds.appearanceColor ?? "–"} />
                <Meta label="Geruch" value={sds.odor ?? "–"} />
                <Meta
                  label="pH-Wert"
                  value={
                    sds.phValue != null
                      ? `${sds.phValue.toFixed(1)}${sds.phContext ? ` (${sds.phContext})` : ""}`
                      : "–"
                  }
                />
                <Meta
                  label="Flammpunkt"
                  value={sds.flashpointC != null ? `${sds.flashpointC} °C` : "–"}
                />
                <Meta
                  label="Dichte (20 °C)"
                  value={sds.densityGcm3 != null ? `${sds.densityGcm3.toFixed(3)} g/cm³` : "–"}
                />
                <Meta
                  label="Viskosität (40 °C)"
                  value={sds.viscosityKv40 != null ? `${sds.viscosityKv40.toFixed(1)} mm²/s` : "–"}
                />
                <Meta
                  label="Stockpunkt"
                  value={sds.pourpointC != null ? `${sds.pourpointC} °C` : "–"}
                />
                <Meta
                  label="Siedepunkt"
                  value={sds.boilingPointC != null ? `${sds.boilingPointC} °C` : "–"}
                />
                <Meta label="Wasserlöslichkeit" value={sds.waterSolubility ?? "–"} />
              </div>
            </section>
          )}

          {/* CAS-Nummern (Inhaltsstoffe nach Section 3) */}
          {sds.casNumbers.length > 0 && (
            <section className="card space-y-2">
              <div className="flex items-center gap-2">
                <Beaker size={16} className="text-brand-600" />
                <h2 className="section-title">CAS-Nummern aus Section 3 ({sds.casNumbers.length})</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                {sds.casNumbers.map((c) => (
                  <a
                    key={c}
                    href={`https://commonchemistry.cas.org/results?q=${c}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                    title="bei CAS Common Chemistry nachschlagen"
                  >
                    {c}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Transport */}
          {(sds.adrClass || sds.unNumber || sds.transportClass) && (
            <section className="card space-y-2">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-brand-600" />
                <h2 className="section-title">Transport (ADR)</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Meta label="ADR-Klasse" value={sds.adrClass ?? "–"} />
                <Meta label="UN-Nummer" value={sds.unNumber ?? "–"} />
                <Meta label="Bezeichnung" value={sds.transportClass ?? "–"} />
              </div>
            </section>
          )}

          {/* Lieferant */}
          {(sds.supplierName || sds.supplierAddress || sds.emergencyPhone) && (
            <section className="card space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-brand-600" />
                <h2 className="section-title">Lieferant / Notfallkontakt</h2>
              </div>
              <div className="space-y-1 text-sm">
                {sds.supplierName && <div className="font-medium">{sds.supplierName}</div>}
                {sds.supplierAddress && <div className="whitespace-pre-line text-slate-700">{sds.supplierAddress}</div>}
                {sds.emergencyPhone && (
                  <div className="text-red-700">
                    Notruf: <a href={`tel:${sds.emergencyPhone}`} className="font-medium hover:underline">{sds.emergencyPhone}</a>
                  </div>
                )}
              </div>
            </section>
          )}

          {sds.parsedAt && (
            <div className="text-xs text-slate-400">
              Strukturierte Daten extrahiert {sds.parsedAt.toLocaleDateString("de-DE")}{" "}
              {sds.parsedVersion && `(Parser v${sds.parsedVersion})`} — heuristische Extraktion aus dem PDF-Volltext,
              Originaldokument ist autoritativ.
            </div>
          )}
        </>
      )}

      {sds.products.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">
            Produkte aus dem Katalog ({sds.products.length})
          </h2>
          <div className="card divide-y divide-slate-200">
            {sds.products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.manufacturer.slug}/${p.slug}`}
                className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {p.manufacturer.name} · {p.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.category}
                    {p.chemistry ? ` · ${p.chemistry}` : ""}
                    {p.viscosityIso ? ` · ${p.viscosityIso}` : ""}
                  </div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sds.listings.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">
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

function IngredientPill({
  name,
  v,
  neutralWhenTrue,
}: {
  name: string;
  v: boolean | null;
  neutralWhenTrue?: boolean;
}) {
  if (v === null) return null;
  if (v === true) {
    const cls = neutralWhenTrue
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-red-50 text-red-800 ring-red-200";
    const Icon = neutralWhenTrue ? AlertTriangle : AlertOctagon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${cls}`}>
        <Icon size={11} /> {name}: enthält
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 size={11} /> {name}: frei
    </span>
  );
}
