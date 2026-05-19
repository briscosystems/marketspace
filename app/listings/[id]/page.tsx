import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { TrustBadge } from "@/components/TrustBadge";
import { ProductImage } from "@/components/ProductImage";
import { BrandLogo } from "@/components/BrandLogo";
import { CertBadgeList } from "@/components/CertBadge";
import { AutomationBadge } from "@/components/AutomationBadge";
import { findMatchingSds, SDS_CATEGORY_LABEL } from "@/lib/sds";
import { brandColors, PACKAGING_LABEL } from "@/lib/branding";
import {
  MACHINING_OPERATIONS,
  MEASUREMENT_METHODS,
  estimateAutomation,
  AUTOMATION_FIT_LABEL,
  type MachiningOperationId,
} from "@/lib/kss-automation";
import { Sparkles, FileText, MessagesSquare, MapPin, Wrench, Gauge, Droplet, AlertTriangle } from "lucide-react";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
    }),
    getServerSession(authOptions),
  ]);
  if (!listing) notFound();
  const isOwnListing = session?.user?.id === listing.sellerId;
  const matchingSds = await findMatchingSds(listing, 5);
  const colors = brandColors(listing.manufacturer);
  const packaging = listing.packaging as
    | "DRUM"
    | "IBC"
    | "TANK"
    | "CANISTER"
    | "BULK"
    | "OTHER";

  return (
    <div className="space-y-6">
      <Link href="/listings" className="text-sm text-brand-500 hover:underline">
        ← zurück zur Übersicht
      </Link>

      {/* HERO */}
      <section
        className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200"
        style={{ borderTop: `6px solid ${colors.primary}` }}
      >
        <div
          className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}14 0%, transparent 60%)`,
          }}
        >
          <ProductImage
            manufacturer={listing.manufacturer}
            productName={listing.productName}
            packaging={packaging}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <BrandLogo manufacturer={listing.manufacturer} size="lg" />
              <span className="chip bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                {listing.productType}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
              {listing.productName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <Link
                href={`/profile/${listing.seller.pseudonym}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 hover:ring-brand-400"
              >
                <span className="font-medium">{listing.seller.pseudonym}</span>
                <TrustBadge tier={listing.seller.trustTier} size="xs" />
              </Link>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                {listing.locationRegion}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div
                className="rounded-full px-5 py-2 text-lg font-bold text-white shadow-sm"
                style={{
                  backgroundColor: listing.priceEur ? colors.primary : "#475569",
                }}
              >
                {listing.priceEur
                  ? `${listing.priceEur.toFixed(2)} € / ${listing.quantityUnit}`
                  : "auf Anfrage"}
              </div>
              <div className="text-sm text-slate-600">
                {listing.quantity.toLocaleString("de-DE")} {listing.quantityUnit}{" "}
                verfügbar
                {listing.minOrderQty
                  ? ` · min. ${listing.minOrderQty.toLocaleString("de-DE")} ${listing.quantityUnit}`
                  : ""}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {isOwnListing ? (
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="btn-secondary text-sm"
                >
                  Bearbeiten
                </Link>
              ) : session?.user ? (
                <ContactSellerButton
                  sellerId={listing.seller.id}
                  listingId={listing.id}
                />
              ) : (
                <Link
                  href={`/login?callbackUrl=/listings/${listing.id}`}
                  className="btn-primary text-sm"
                >
                  <MessagesSquare size={14} className="mr-1.5" />
                  Anmelden zum Kontaktieren
                </Link>
              )}
              {!isOwnListing && (
                <Link
                  href={`/listings/${listing.id}/alternatives`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100"
                >
                  <Sparkles size={14} className="text-violet-500" />
                  KI: Alternative finden
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SPECS */}
      <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Technische Spezifikation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field label="ISO Viskosität" value={listing.isoViscosity} />
          <Field label="Chemie-Basis" value={listing.chemistry} />
          <Field label="Anwendung" value={listing.applicationArea} />
          <Field
            label="Verfügbare Menge"
            value={`${listing.quantity.toLocaleString("de-DE")} ${listing.quantityUnit}`}
          />
          <Field
            label="Mindestabnahme"
            value={
              listing.minOrderQty
                ? `${listing.minOrderQty.toLocaleString("de-DE")} ${listing.quantityUnit}`
                : null
            }
          />
          <Field
            label="Gebinde"
            value={PACKAGING_LABEL[packaging] ?? packaging}
          />
          <Field
            label="Produktionsdatum"
            value={listing.productionDate?.toLocaleDateString("de-DE")}
          />
          <Field label="MHD" value={listing.expiryDate?.toLocaleDateString("de-DE")} />
          <Field label="Versand" value={listing.shippingTerms} />
        </div>
      </section>

      {/* MACHINING OPERATIONS */}
      {listing.machiningOperations.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Wrench size={14} />
            Bearbeitungsverfahren
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {listing.machiningOperations.map((id) => {
              const op = MACHINING_OPERATIONS.find(
                (o) => o.id === (id as MachiningOperationId),
              );
              if (!op) return null;
              return (
                <span
                  key={id}
                  className="chip bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                  title={op.hint}
                >
                  {op.label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* REZEPTUR-INFO */}
      {(typeof listing.mineralOilContent === "number" ||
        listing.containsGlycol !== null) && (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Droplet size={14} />
            Rezeptur
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {typeof listing.mineralOilContent === "number" && (
              <div className="rounded-lg bg-slate-50/60 p-3 ring-1 ring-slate-100">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Mineralöl-Anteil
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {listing.mineralOilContent} %
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {listing.mineralOilContent === 0
                    ? "vollsynthetisch (kein Mineralöl)"
                    : listing.mineralOilContent < 30
                      ? "halbsynthetisch / synthetisch"
                      : listing.mineralOilContent < 60
                        ? "Mikroemulsion / klassische Emulsion"
                        : "Mineralöl-reiche Rezeptur"}
                </div>
              </div>
            )}
            {listing.containsGlycol !== null && (
              <div className="rounded-lg bg-slate-50/60 p-3 ring-1 ring-slate-100">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Glykol-Anteil
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {listing.containsGlycol ? "enthält Glykol" : "kein Glykol"}
                </div>
                {listing.containsGlycol && (
                  <div className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span>
                      Glykolhaltige KSS bilden Filme auf Refraktometer-Sensoren — bei
                      Vollautomation Titration oder Dosimetrix vorziehen.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* AUTOMATISIERUNGS-EIGNUNG */}
      {(typeof listing.automationSuitability === "number" &&
        listing.automationSuitability > 0) ||
      listing.measurementMethods.length > 0 ? (
        (() => {
          const profile = estimateAutomation({
            productType: listing.productType,
            chemistry: listing.chemistry,
            containsGlycol: listing.containsGlycol,
            mineralOilContent: listing.mineralOilContent,
            manufacturerProvidedScore: listing.automationSuitability,
            manufacturerRecommendedMethods: listing.measurementMethods,
          });
          return (
            <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Gauge size={14} />
                  Automatisierungs-Eignung
                </h2>
                <AutomationBadge
                  size="sm"
                  input={{
                    productType: listing.productType,
                    chemistry: listing.chemistry,
                    containsGlycol: listing.containsGlycol,
                    mineralOilContent: listing.mineralOilContent,
                    manufacturerProvidedScore: listing.automationSuitability,
                    manufacturerRecommendedMethods: listing.measurementMethods,
                  }}
                />
              </div>
              <p className="mb-3 text-sm font-medium text-slate-800">
                {AUTOMATION_FIT_LABEL[profile.fit]} · Score {profile.score}/5
              </p>
              {profile.reasons.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-700">
                  {profile.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
              {profile.warnings.length > 0 && (
                <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
                  {profile.warnings.map((w, i) => (
                    <div key={i} className="flex gap-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {profile.recommendedMethods.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Empfohlene Messverfahren
                  </div>
                  <div className="space-y-1.5">
                    {profile.recommendedMethods.map((mid) => {
                      const m = MEASUREMENT_METHODS.find((x) => x.id === mid);
                      if (!m) return null;
                      const manufacturerRecommended =
                        listing.measurementMethods.includes(mid);
                      return (
                        <div
                          key={mid}
                          className="rounded-md border border-slate-200 p-2.5 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">
                              {m.label}
                            </span>
                            <span
                              className="text-[10px] text-brand-600"
                              title="Automatisierungsgrad"
                            >
                              {"●".repeat(m.automationLevel)}
                              <span className="text-slate-200">
                                {"●".repeat(5 - m.automationLevel)}
                              </span>
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-slate-600">{m.details}</div>
                          {manufacturerRecommended && (
                            <div className="mt-1 text-[11px] font-medium text-emerald-700">
                              ✓ Vom Hersteller empfohlen
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })()
      ) : null}

      {/* CERTIFICATES */}
      {listing.certificates.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Zertifikate &amp; Freigaben
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Klicke auf eine Plakette für Detail-Erklärung.
          </p>
          <CertBadgeList certs={listing.certificates} max={20} size="sm" />
        </section>
      )}

      {/* DESCRIPTION */}
      {listing.description && (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Beschreibung
          </h2>
          <p className="whitespace-pre-line text-sm text-slate-700">
            {listing.description}
          </p>
        </section>
      )}

      {/* SDS */}
      {matchingSds.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <FileText size={14} />
            Sicherheitsdatenblätter
          </h2>
          <div className="space-y-2">
            {matchingSds.map((s) => {
              const exact =
                s.productName.toLowerCase().includes(listing.productName.toLowerCase()) ||
                listing.productName.toLowerCase().includes(s.productName.toLowerCase());
              return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <Link href={`/sds/${s.id}`} className="font-medium hover:text-brand-500">
                      {s.manufacturer} {s.productName}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {SDS_CATEGORY_LABEL[s.category] ?? s.category} ·{" "}
                      {s.pageCount ?? "?"} Seiten
                      {exact ? (
                        <span className="ml-2 chip bg-emerald-100 text-emerald-700">
                          Exakt
                        </span>
                      ) : (
                        <span className="ml-2 chip bg-amber-100 text-amber-800">
                          Ähnlich
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/api/sds/${s.id}/download?inline=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-500 hover:underline"
                  >
                    PDF öffnen
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CONTACT BANNER */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-6 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-800">
              Interesse an diesem Produkt?
            </h3>
            <p className="text-sm text-slate-600">
              Pseudonymer In-Platform-Chat — Klarname und Kontaktdaten bleiben verborgen
              bis zur Transaktion.
            </p>
          </div>
          {isOwnListing ? (
            <span className="text-sm text-slate-500">Das ist dein eigenes Listing.</span>
          ) : session?.user ? (
            <ContactSellerButton sellerId={listing.seller.id} listingId={listing.id} />
          ) : (
            <Link
              href={`/login?callbackUrl=/listings/${listing.id}`}
              className="btn-primary"
            >
              Anmelden
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50/60 p-3 ring-1 ring-slate-100">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}
