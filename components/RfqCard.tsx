import Link from "next/link";
import { TrustBadge } from "./TrustBadge";
import { ProductImage } from "./ProductImage";
import { Search } from "lucide-react";

type Tier = "UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM" | "DIAMOND";
type RfqStatus = "OPEN" | "ACCEPTED" | "EXPIRED" | "CANCELED";

export type RfqCardData = {
  id: string;
  productType: string;
  manufacturer: string | null;
  isoViscosity: string | null;
  quantity: number;
  quantityUnit: string;
  locationRegion: string;
  deadline: Date;
  notes: string | null;
  status: RfqStatus;
  visibility: string;
  offersCount: number;
  buyer: { pseudonym: string; trustTier: Tier };
};

const statusMeta: Record<RfqStatus, { label: string; classes: string }> = {
  OPEN: { label: "offen", classes: "bg-emerald-100 text-emerald-800" },
  ACCEPTED: { label: "vergeben", classes: "bg-blue-100 text-blue-800" },
  EXPIRED: { label: "abgelaufen", classes: "bg-amber-100 text-amber-800" },
  CANCELED: { label: "storniert", classes: "bg-slate-200 text-slate-600" },
};

export function RfqCard({
  rfq,
  variant = "compact",
}: {
  rfq: RfqCardData;
  variant?: "compact" | "extended";
}) {
  if (variant === "compact") return <CompactRfq rfq={rfq} />;
  return <ExtendedRfq rfq={rfq} />;
}

// ============================================================================
// COMPACT — schmale Listenzeile (Standard), analog zur Angebots-Kompaktkarte
// ============================================================================
function CompactRfq({ rfq }: { rfq: RfqCardData }) {
  const status = statusMeta[rfq.status];
  return (
    <Link
      href={`/rfqs/${rfq.id}`}
      className="group flex items-center gap-3 overflow-hidden rounded-xl bg-white p-3 shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-amber-300"
    >
      {/* Amber-Streifen links — visuell sofort „Suche" */}
      <div className="-my-3 -ml-3 mr-1 h-auto w-1 self-stretch bg-gradient-to-b from-amber-400 to-amber-600" />
      <ProductImage
        manufacturer={rfq.manufacturer ?? ""}
        productName={rfq.productType}
        packaging="DRUM"
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
            <Search size={8} /> Sucht
          </span>
          <span className={`chip ${status.classes}`}>{status.label}</span>
        </div>
        <div className="mt-1 truncate text-sm font-bold text-slate-900">
          {rfq.manufacturer ? `${rfq.manufacturer} · ` : ""}
          {rfq.quantity.toLocaleString("de-DE")} {rfq.quantityUnit}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span>{rfq.productType}</span>
          {rfq.isoViscosity && (
            <>
              <span className="text-slate-300">·</span>
              <span>ISO VG {rfq.isoViscosity}</span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span>📍 {rfq.locationRegion}</span>
          <span className="text-slate-300">·</span>
          <span>Frist {rfq.deadline.toLocaleDateString("de-DE")}</span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="flex items-center justify-end gap-1.5 text-xs">
          <span className="truncate text-slate-700">{rfq.buyer.pseudonym}</span>
          <TrustBadge tier={rfq.buyer.trustTier} size="xs" />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {rfq.offersCount} {rfq.offersCount === 1 ? "Angebot" : "Angebote"}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// EXTENDED — volle Karte mit allen Details
// ============================================================================
function ExtendedRfq({ rfq }: { rfq: RfqCardData }) {
  const status = statusMeta[rfq.status];
  return (
    <Link
      href={`/rfqs/${rfq.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lift hover:ring-amber-300"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
      <div className="p-4">
        <div className="flex gap-4">
          <ProductImage
            manufacturer={rfq.manufacturer ?? ""}
            productName={rfq.productType}
            packaging="DRUM"
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                <Search size={10} /> Sucht
              </span>
              <span className={`chip ${status.classes}`}>{status.label}</span>
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {rfq.productType} {rfq.isoViscosity ? `· ISO VG ${rfq.isoViscosity}` : ""}
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {rfq.manufacturer ? `${rfq.manufacturer} · ` : ""}
              {rfq.quantity.toLocaleString("de-DE")} {rfq.quantityUnit}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              📍 {rfq.locationRegion} · Frist {rfq.deadline.toLocaleDateString("de-DE")}
            </div>
            {rfq.notes && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{rfq.notes}</p>}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Suchender:</span>
            <span className="text-slate-700">{rfq.buyer.pseudonym}</span>
            <TrustBadge tier={rfq.buyer.trustTier} size="xs" />
            {rfq.visibility === "VERIFIED_ONLY" && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                Verified+
              </span>
            )}
          </div>
          <span className="text-slate-600">
            {rfq.offersCount}{" "}
            {rfq.offersCount === 1 ? "Angebot eingegangen" : "Angebote eingegangen"}
          </span>
        </div>
      </div>
    </Link>
  );
}
