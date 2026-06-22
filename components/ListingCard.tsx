import Link from "next/link";
import { TrustBadge } from "./TrustBadge";
import { RatingDisplay } from "./RatingDisplay";
import { ProductImage } from "./ProductImage";
import { BrandLogo } from "./BrandLogo";
import { CertBadgeList } from "./CertBadge";
import { AutomationBadge } from "./AutomationBadge";
import { CompareToggle } from "./compare/CompareToggle";
import { brandColors, PACKAGING_LABEL } from "@/lib/branding";
import { MACHINING_OPERATIONS, type MachiningOperationId } from "@/lib/kss-automation";
import { Tag } from "lucide-react";

type Tier = "UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM" | "DIAMOND";
type Status = "ACTIVE" | "PAUSED" | "SOLD" | "ARCHIVED";
type Packaging = "DRUM" | "IBC" | "TANK" | "CANISTER" | "BULK" | "OTHER";

export type ListingCardData = {
  id: string;
  productType: string;
  manufacturer: string;
  productName: string;
  isoViscosity: string | null;
  chemistry?: string;
  applicationArea?: string;
  quantity: number;
  quantityUnit: string;
  minOrderQty: number | null;
  locationRegion: string;
  packaging: Packaging | string;
  certificates?: string[];
  priceEur: number | null;
  shippingTerms: string | null;
  status?: Status;
  // Neu: Fertigung, Rezeptur, Automation
  machiningOperations?: string[];
  mineralOilContent?: number | null;
  containsGlycol?: boolean | null;
  automationSuitability?: number | null;
  measurementMethods?: string[];
  seller: {
    pseudonym: string;
    trustTier: Tier;
    avgRating?: number | null;
    ratingCount?: number;
  };
};

const statusStyle: Record<Status, { label: string; classes: string }> = {
  ACTIVE: { label: "aktiv", classes: "bg-emerald-100 text-emerald-700" },
  PAUSED: { label: "pausiert", classes: "bg-amber-100 text-amber-800" },
  SOLD: { label: "verkauft", classes: "bg-slate-200 text-slate-700" },
  ARCHIVED: { label: "archiviert", classes: "bg-slate-100 text-slate-500" },
};

const chemistryLabel: Record<string, string> = {
  MINERAL: "Mineralöl",
  SYNTHETIC: "Synthetisch",
  SEMI_SYNTHETIC: "Teilsynthetisch",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Sonstige Chemie",
};

export function ListingCard({
  listing,
  hideStatus = false,
  showCertificates = true,
  variant = "extended",
}: {
  listing: ListingCardData;
  hideStatus?: boolean;
  showCertificates?: boolean;
  variant?: "compact" | "extended";
}) {
  if (variant === "compact") return <CompactCard listing={listing} hideStatus={hideStatus} />;
  return (
    <ExtendedCard
      listing={listing}
      hideStatus={hideStatus}
      showCertificates={showCertificates}
    />
  );
}

// ============================================================================
// COMPACT — schmale Card, ideal für Listen-Browsing
// ============================================================================
function CompactCard({
  listing,
  hideStatus,
}: {
  listing: ListingCardData;
  hideStatus: boolean;
}) {
  const colors = brandColors(listing.manufacturer);
  const packaging = (listing.packaging as Packaging) ?? "DRUM";

  return (
    <div className="relative">
      <Link
        href={`/listings/${listing.id}`}
        className="group flex items-center gap-3 overflow-hidden rounded-xl bg-white p-3 shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-slate-300"
      >
        {/* Brand-Farb-Streifen links */}
        <div
          className="-my-3 -ml-3 mr-1 h-auto w-1 self-stretch"
          style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
        />
        <ProductImage
          manufacturer={listing.manufacturer}
          productName={listing.productName}
          packaging={packaging}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-800"
              title="Anbieter stellt diesen Bestand zum Verkauf"
            >
              <Tag size={8} /> Bietet
            </span>
            <BrandLogo manufacturer={listing.manufacturer} size="xs" />
            {!hideStatus && listing.status && listing.status !== "ACTIVE" && (
              <span className={`chip ${statusStyle[listing.status].classes}`}>
                {statusStyle[listing.status].label}
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-sm font-bold text-slate-900">
            {listing.productName}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span>{listing.productType}</span>
            {listing.isoViscosity && (
              <>
                <span className="text-slate-300">·</span>
                <span>ISO VG {listing.isoViscosity}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>📍 {listing.locationRegion}</span>
            <span className="text-slate-300">·</span>
            <span>
              {listing.quantity.toLocaleString("de-DE")} {listing.quantityUnit}
            </span>
          </div>
        </div>
        <div
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: listing.priceEur ? colors.primary : "#0f172a" }}
        >
          {listing.priceEur ? `${listing.priceEur.toFixed(2)} €` : "auf Anfrage"}
        </div>
      </Link>
      {/* Vergleichs-Häkchen — über dem Link gelegt, abgefangen via stopPropagation */}
      <div className="absolute right-2 top-2">
        <CompareToggle id={listing.id} kind="listings" variant="checkbox" />
      </div>
    </div>
  );
}

// ============================================================================
// EXTENDED — volle Card mit allen Details
// ============================================================================
function ExtendedCard({
  listing,
  hideStatus,
  showCertificates,
}: {
  listing: ListingCardData;
  hideStatus: boolean;
  showCertificates: boolean;
}) {
  const colors = brandColors(listing.manufacturer);
  const packaging = (listing.packaging as Packaging) ?? "DRUM";

  const applications = (listing.applicationArea ?? "")
    .split(/\s*[,/]\s*|\s+und\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  return (
    <div className="relative">
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lift hover:ring-slate-300"
    >
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }}
      />

      <div className="flex gap-4 p-4 pb-3">
        <ProductImage
          manufacturer={listing.manufacturer}
          productName={listing.productName}
          packaging={packaging}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800">
                <Tag size={10} /> Bietet an
              </span>
              <BrandLogo manufacturer={listing.manufacturer} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              {!hideStatus && listing.status && (
                <span className={`chip whitespace-nowrap ${statusStyle[listing.status].classes}`}>
                  {statusStyle[listing.status].label}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-900 leading-tight">
            {listing.productName}
          </div>
          <div className="text-xs text-slate-500">{listing.productType}</div>

          <div className="mt-2 flex flex-wrap gap-1">
            {listing.isoViscosity && (
              <span className="chip bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                ISO VG {listing.isoViscosity}
              </span>
            )}
            {listing.chemistry && (
              <span className="chip bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                {chemistryLabel[listing.chemistry] ?? listing.chemistry}
              </span>
            )}
            {applications.map((a) => (
              <span
                key={a}
                className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                title="Anwendungsbereich"
              >
                {a}
              </span>
            ))}
            {typeof listing.mineralOilContent === "number" && (
              <span
                className="chip bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                title="Mineralöl-Anteil im Konzentrat"
              >
                {listing.mineralOilContent} % Min.öl
              </span>
            )}
          </div>

          {/* Bearbeitungsverfahren (Fräsen, Drehen, Schleifen …) */}
          {listing.machiningOperations && listing.machiningOperations.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {listing.machiningOperations.slice(0, 6).map((id) => {
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
              {listing.machiningOperations.length > 6 && (
                <span className="chip bg-slate-100 text-slate-500">
                  +{listing.machiningOperations.length - 6}
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>📍 {listing.locationRegion}</span>
            {typeof listing.automationSuitability === "number" &&
              listing.automationSuitability > 0 && (
                <AutomationBadge
                  size="xs"
                  input={{
                    productType: listing.productType,
                    chemistry: listing.chemistry,
                    containsGlycol: listing.containsGlycol,
                    mineralOilContent: listing.mineralOilContent,
                    manufacturerProvidedScore: listing.automationSuitability,
                    manufacturerRecommendedMethods: listing.measurementMethods,
                  }}
                />
              )}
          </div>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 py-3 text-sm">
        <Cell label="Menge">
          {listing.quantity.toLocaleString("de-DE")} {listing.quantityUnit}
        </Cell>
        <Cell label="Gebinde">{PACKAGING_LABEL[packaging] ?? packaging}</Cell>
        <Cell label="Min. Abnahme">
          {listing.minOrderQty
            ? `${listing.minOrderQty.toLocaleString("de-DE")} ${listing.quantityUnit}`
            : "—"}
        </Cell>
        <Cell label="Versand">{listing.shippingTerms ?? "—"}</Cell>
      </div>

      {showCertificates && listing.certificates && listing.certificates.length > 0 && (
        <div className="mx-4 border-t border-slate-100 py-3">
          <CertBadgeList certs={listing.certificates} max={4} size="xs" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Anbieter:</span>
            <span className="truncate font-medium text-slate-700">
              {listing.seller.pseudonym}
            </span>
            <TrustBadge tier={listing.seller.trustTier} size="xs" />
          </div>
          {(listing.seller.ratingCount ?? 0) > 0 && (
            <RatingDisplay
              avg={listing.seller.avgRating ?? null}
              count={listing.seller.ratingCount ?? 0}
              size="xs"
            />
          )}
        </div>
        <div
          className="rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: listing.priceEur ? colors.primary : "#0f172a" }}
        >
          {listing.priceEur ? `${listing.priceEur.toFixed(2)} €` : "auf Anfrage"}
        </div>
      </div>
    </Link>
    {/* Vergleichs-Häkchen — absolute, deckt sich nicht mit Link-Click */}
    <div className="absolute right-3 top-3">
      <CompareToggle id={listing.id} kind="listings" variant="checkbox" />
    </div>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{children}</div>
    </div>
  );
}
