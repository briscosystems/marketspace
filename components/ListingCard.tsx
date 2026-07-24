import Link from "next/link";
import { TrustBadge } from "./TrustBadge";
import { ProductImage } from "./ProductImage";
import { BrandLogo } from "./BrandLogo";
import { CompareToggle } from "./compare/CompareToggle";
import { brandColors } from "@/lib/branding";
import { Tag, MapPin } from "lucide-react";

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
  // Anbieter mit bezahltem Sichtbarkeits-Boost — als "Gesponsert" ausweisen
  // (EU-P2B-Verordnung 2019/1150: bezahltes Ranking transparent machen)
  sponsored?: boolean;
  // Weitere Felder bleiben im Datenvertrag erhalten (Detailseite nutzt sie)
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
  GTL: "GTL (Gas-to-Liquid)",
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
  // showCertificates bleibt im API-Vertrag; das ruhige Design zeigt Zertifikate
  // auf der Detailseite statt in der Übersichtskarte.
  void showCertificates;
  if (variant === "compact") return <CompactCard listing={listing} hideStatus={hideStatus} />;
  return <ExtendedCard listing={listing} hideStatus={hideStatus} />;
}

// ============================================================================
// COMPACT — schmale Karte, ideal für Listen-Browsing
// ============================================================================
function CompactCard({ listing, hideStatus }: { listing: ListingCardData; hideStatus: boolean }) {
  const packaging = (listing.packaging as Packaging) ?? "DRUM";

  return (
    <div className="relative">
      <Link
        href={`/listings/${listing.id}`}
        className="group flex items-center gap-3 overflow-hidden rounded-xl bg-white p-3 shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-slate-300"
      >
        <ProductImage
          manufacturer={listing.manufacturer}
          productName={listing.productName}
          packaging={packaging}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-800">
              <Tag size={8} /> Bietet an
            </span>
            {listing.sponsored && (
              <span
                className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800"
                title="Dieser Anbieter hat eine bezahlte Platzierung — das Angebot erscheint dadurch weiter oben."
              >
                Gesponsert
              </span>
            )}
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
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={11} /> {listing.locationRegion}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              {listing.quantity.toLocaleString("de-CH")} {listing.quantityUnit}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {listing.priceEur ? (
            <div className="text-base font-extrabold tracking-tight text-slate-900">
              {listing.priceEur.toFixed(2)} €
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-700">auf Anfrage</div>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <CompareToggle id={listing.id} kind="listings" variant="checkbox" />
      </div>
    </div>
  );
}

// ============================================================================
// EXTENDED — ruhige Übersichtskarte (Konzept-Stil): Bild, Titel, wenige
// Merkmale, Anbieter + Vertrauen, klarer Preis.
// ============================================================================
function ExtendedCard({ listing, hideStatus }: { listing: ListingCardData; hideStatus: boolean }) {
  const packaging = (listing.packaging as Packaging) ?? "DRUM";
  const chips: string[] = [];
  if (listing.isoViscosity) chips.push(`ISO VG ${listing.isoViscosity}`);
  if (listing.chemistry) chips.push(chemistryLabel[listing.chemistry] ?? listing.chemistry);
  const firstApp = (listing.applicationArea ?? "")
    .split(/\s*[,/]\s*|\s+und\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (firstApp) chips.push(firstApp);

  const showStatusChip = !hideStatus && listing.status && listing.status !== "ACTIVE";

  return (
    <div className="relative">
      <Link
        href={`/listings/${listing.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lift"
      >
        {/* Bildbereich — realistisches Fass/IBC/Kanister + Marke unten links */}
        <div className="relative flex items-center justify-center border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white py-4">
          <ProductImage
            manufacturer={listing.manufacturer}
            productName={listing.productName}
            packaging={packaging}
            size="md"
          />
          <span className="absolute bottom-2.5 left-2.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            {listing.manufacturer}
          </span>
        </div>

        {/* Inhalt */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
              <Tag size={10} /> Bietet an
            </span>
            {listing.sponsored && (
              <span
                className="inline-flex w-fit items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                title="Dieser Anbieter hat eine bezahlte Platzierung — das Angebot erscheint dadurch weiter oben."
              >
                Gesponsert
              </span>
            )}
            {showStatusChip && (
              <span className={`chip ${statusStyle[listing.status!].classes}`}>
                {statusStyle[listing.status!].label}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold leading-tight text-slate-900">
            {listing.productName}
          </h3>
          <div className="text-xs text-slate-500">{listing.productType}</div>

          {chips.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {chips.map((c) => (
                <span key={c} className="chip bg-slate-100 text-slate-700">
                  {c}
                </span>
              ))}
            </div>
          )}

          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} /> {listing.locationRegion} ·{" "}
            {listing.quantity.toLocaleString("de-CH")} {listing.quantityUnit}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-medium text-slate-700">
                {listing.seller.pseudonym}
              </span>
              <TrustBadge tier={listing.seller.trustTier} size="xs" />
            </div>
            {listing.priceEur ? (
              <div className="shrink-0 text-lg font-extrabold tracking-tight text-slate-900">
                {listing.priceEur.toFixed(2)} €
              </div>
            ) : (
              <div className="shrink-0 text-sm font-bold text-slate-700">auf Anfrage</div>
            )}
          </div>
        </div>
      </Link>

      {/* Vergleichs-Häkchen — über der Karte, eigener Klickbereich */}
      <div className="absolute right-3 top-3">
        <CompareToggle id={listing.id} kind="listings" variant="checkbox" />
      </div>
    </div>
  );
}
