import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { ProductImage } from "@/components/ProductImage";
import { GhsPictogram } from "@/components/GhsPictogram";
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


/** Eigener Titel je Sicherheitsdatenblatt — 3.383 Seiten, die sonst gleich heißen. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.safetyDataSheet.findUnique({
    where: { id },
    select: { productName: true, manufacturer: true, revisionDate: true },
  });
  if (!s) return { title: "Sicherheitsdatenblatt nicht gefunden — Brisco Marketplace" };
  const jahr = s.revisionDate ? ` (${s.revisionDate.getFullYear()})` : "";
  const titel = `${s.manufacturer} ${s.productName} — Sicherheitsdatenblatt${jahr}`;
  const text = `Sicherheitsdatenblatt zu ${s.manufacturer} ${s.productName}: GHS-Einstufung, H- und P-Sätze, Inhaltsstoffe und physikalische Kennwerte — ausgewertet und durchsuchbar.`;
  return { title: titel, description: text, openGraph: { title: titel, description: text } };
}

export default async function SdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
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
      <Link href="/sds" className="text-sm text-brand-700 hover:underline">
        ← {t("sdsd.backToLibrary")}
      </Link>

      <div className="card space-y-5">
        <div>
          <div className="eyebrow">
            {t(`sdsd.cat.${sds.category}`)}
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
          <Meta label={t("sdsd.langLabel")} value={t(`sdsd.lang.${sds.language}`)} />
          <Meta label={t("sdsd.pages")} value={sds.pageCount?.toString() ?? "–"} />
          <Meta label={t("sdsd.fileSize")} value={`${(sds.fileSizeBytes / 1024).toFixed(0)} KB`} />
          <Meta
            label={t("sdsd.loadedToLibrary")}
            value={sds.fetchedAt.toLocaleDateString("de-DE")}
          />
          {sds.version && <Meta label={t("sdsd.version")} value={sds.version} />}
          {sds.revisionDate && (
            <Meta label={t("sdsd.revisionDate")} value={sds.revisionDate.toLocaleDateString("de-DE")} />
          )}
          <Meta label="SHA-256" value={<code className="text-xs">{sds.sha256.slice(0, 24)}…</code>} />
          <Meta
            label={t("sdsd.originalSource")}
            value={
              <a
                href={sds.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-brand-700 hover:underline"
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
            {t("sdsd.downloadPdf")}
          </a>
          <a
            href={`/api/sds/${sds.id}/download?inline=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            {t("sdsd.openInBrowser")}
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
                <h2 className="section-title">{t("sdsd.reachIngredients")}</h2>
              </div>

              {/* REACH-Status */}
              {sds.reachCompliant !== null && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-500">REACH</span>
                  {sds.reachCompliant ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {t("sdsd.reachCompliant")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      {t("sdsd.reachNonCompliant")}
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
                <IngredientPill t={t} name={t("sdsd.ing.boron")} v={sds.containsBoron} />
                <IngredientPill t={t} name={t("sdsd.ing.formaldehyde")} v={sds.containsFormaldehydeReleaser} />
                <IngredientPill t={t} name={t("sdsd.ing.secondaryAmines")} v={sds.containsSecondaryAmines} />
                <IngredientPill t={t} name={t("sdsd.ing.chlorParaffins")} v={sds.containsChlorinatedParaffins} />
                <IngredientPill t={t} name={t("sdsd.ing.mineralOil")} v={sds.containsMineralOil} neutralWhenTrue />
                <IngredientPill t={t} name={t("sdsd.ing.primaryAromaticAmines")} v={sds.containsPrimaryAromaticAmines} />
                <IngredientPill t={t} name={t("sdsd.ing.bactericide")} v={sds.hasBactericide} neutralWhenTrue />
                <IngredientPill t={t} name={t("sdsd.ing.fungicide")} v={sds.hasFungicide} neutralWhenTrue />
              </div>

              {/* Biozid-Wirkstoffe konkret */}
              {sds.biocidalActives.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    {t("sdsd.biocidalActives")}
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
                <h2 className="section-title">{t("sdsd.ghsClp")}</h2>
              </div>
              {sds.ghsPictograms.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">{t("sdsd.pictograms")}</div>
                  <div className="mt-1.5 flex flex-wrap items-start gap-3">
                    {sds.ghsPictograms.map((p) => (
                      <div key={p} className="flex flex-col items-center gap-0.5" style={{ width: 76 }}>
                        <GhsPictogram code={p} size={52} />
                        <span className="text-center text-[10px] leading-tight text-slate-600">
                          {t(`sdsd.ghs.${p}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sds.hStatements.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    {t("sdsd.hStatements")}
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
                    {t("sdsd.pStatements")}
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
                <h2 className="section-title">{t("sdsd.physChem")}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Meta label={t("sdsd.physicalState")} value={sds.physicalState ?? "–"} />
                <Meta label={t("sdsd.color")} value={sds.appearanceColor ?? "–"} />
                <Meta label={t("sdsd.odor")} value={sds.odor ?? "–"} />
                <Meta
                  label={t("sdsd.phValue")}
                  value={
                    sds.phValue != null
                      ? `${sds.phValue.toFixed(1)}${sds.phContext ? ` (${sds.phContext})` : ""}`
                      : "–"
                  }
                />
                <Meta
                  label={t("sdsd.flashpoint")}
                  value={sds.flashpointC != null ? `${sds.flashpointC} °C` : "–"}
                />
                <Meta
                  label={t("sdsd.density")}
                  value={sds.densityGcm3 != null ? `${sds.densityGcm3.toFixed(3)} g/cm³` : "–"}
                />
                <Meta
                  label={t("sdsd.viscosity")}
                  value={sds.viscosityKv40 != null ? `${sds.viscosityKv40.toFixed(1)} mm²/s` : "–"}
                />
                <Meta
                  label={t("sdsd.pourpoint")}
                  value={sds.pourpointC != null ? `${sds.pourpointC} °C` : "–"}
                />
                <Meta
                  label={t("sdsd.boilingPoint")}
                  value={sds.boilingPointC != null ? `${sds.boilingPointC} °C` : "–"}
                />
                <Meta label={t("sdsd.waterSolubility")} value={sds.waterSolubility ?? "–"} />
              </div>
            </section>
          )}

          {/* CAS-Nummern (Inhaltsstoffe nach Section 3) */}
          {sds.casNumbers.length > 0 && (
            <section className="card space-y-2">
              <div className="flex items-center gap-2">
                <Beaker size={16} className="text-brand-600" />
                <h2 className="section-title">{fill(t("sdsd.casNumbers"), { n: sds.casNumbers.length })}</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                {sds.casNumbers.map((c) => (
                  <a
                    key={c}
                    href={`https://commonchemistry.cas.org/results?q=${c}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                    title={t("sdsd.casLookup")}
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
                <h2 className="section-title">{t("sdsd.transport")}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Meta label={t("sdsd.adrClass")} value={sds.adrClass ?? "–"} />
                <Meta label={t("sdsd.unNumber")} value={sds.unNumber ?? "–"} />
                <Meta label={t("sdsd.designation")} value={sds.transportClass ?? "–"} />
              </div>
            </section>
          )}

          {/* Lieferant */}
          {(sds.supplierName || sds.supplierAddress || sds.emergencyPhone) && (
            <section className="card space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-brand-600" />
                <h2 className="section-title">{t("sdsd.supplier")}</h2>
              </div>
              <div className="space-y-1 text-sm">
                {sds.supplierName && <div className="font-medium">{sds.supplierName}</div>}
                {sds.supplierAddress && <div className="whitespace-pre-line text-slate-700">{sds.supplierAddress}</div>}
                {sds.emergencyPhone && (
                  <div className="text-red-700">
                    {t("sdsd.emergency")}: <a href={`tel:${sds.emergencyPhone}`} className="font-medium hover:underline">{sds.emergencyPhone}</a>
                  </div>
                )}
              </div>
            </section>
          )}

          {sds.parsedAt && (
            <div className="text-xs text-slate-400">
              {t("sdsd.extractedPrefix")} {sds.parsedAt.toLocaleDateString("de-DE")}{" "}
              {sds.parsedVersion && `(Parser v${sds.parsedVersion})`} — {t("sdsd.extractedNote")}
            </div>
          )}
        </>
      )}

      {sds.products.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">
            {fill(t("sdsd.catalogProducts"), { n: sds.products.length })}
          </h2>
          <div className="card divide-y divide-slate-200">
            {sds.products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.manufacturer.slug}/${p.slug}`}
                className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {p.manufacturer.name} · {p.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t(`cat.${p.category}`)}
                    {p.chemistry ? ` · ${t(`chem.${p.chemistry}`)}` : ""}
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
            {t("sdsd.activeListings")}
          </h2>
          <div className="card divide-y divide-slate-200">
            {sds.listings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
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
      <div className="eyebrow">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function IngredientPill({
  name,
  v,
  neutralWhenTrue,
  t,
}: {
  name: string;
  v: boolean | null;
  neutralWhenTrue?: boolean;
  t: (k: string) => string;
}) {
  if (v === null) return null;
  if (v === true) {
    const cls = neutralWhenTrue
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-red-50 text-red-800 ring-red-200";
    const Icon = neutralWhenTrue ? AlertTriangle : AlertOctagon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${cls}`}>
        <Icon size={11} /> {name}: {t("sdsd.contains")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 size={11} /> {name}: {t("sdsd.free")}
    </span>
  );
}
