"use client";

import Link from "next/link";
import { useCompareList } from "./CompareStore";
import { GitCompare, X, ListChecks, Boxes } from "lucide-react";

/**
 * Sticky-Bar am unteren Bildschirmrand. Erscheint sobald mindestens ein
 * Listing oder Produkt im Vergleich ist. Zeigt beide Typen getrennt.
 *
 * Button "Vergleich ansehen" → /compare?listings=…&products=…
 */
export function CompareBar() {
  const listings = useCompareList("listings");
  const products = useCompareList("products");
  const total = listings.ids.length + products.ids.length;
  if (total === 0) return null;

  const params = new URLSearchParams();
  if (listings.ids.length > 0) params.set("listings", listings.ids.join(","));
  if (products.ids.length > 0) params.set("products", products.ids.join(","));
  const href = `/compare?${params.toString()}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-lift">
        <GitCompare size={16} className="text-brand-600" />
        {listings.ids.length > 0 ? (
          <div className="flex items-center gap-1.5 text-sm">
            <ListChecks size={14} className="text-slate-500" />
            <span className="font-medium text-slate-700">{listings.ids.length}</span>
            <span className="text-slate-500">Listing{listings.ids.length === 1 ? "" : "s"}</span>
            <button
              type="button"
              onClick={listings.clear}
              title="Listings-Vergleich leeren"
              className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
        {products.ids.length > 0 ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Boxes size={14} className="text-slate-500" />
            <span className="font-medium text-slate-700">{products.ids.length}</span>
            <span className="text-slate-500">Produkt{products.ids.length === 1 ? "" : "e"}</span>
            <button
              type="button"
              onClick={products.clear}
              title="Produkt-Vergleich leeren"
              className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
        <Link
          href={href}
          className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Vergleich ansehen →
        </Link>
      </div>
    </div>
  );
}
