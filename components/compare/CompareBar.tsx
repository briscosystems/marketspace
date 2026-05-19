"use client";

import Link from "next/link";
import { useCompareList } from "./CompareStore";
import { GitCompare, X } from "lucide-react";

/**
 * Sticky-Bar am unteren Bildschirmrand — taucht auf sobald mindestens
 * 1 Produkt zum Vergleich ausgewählt ist. Klick auf "Vergleichen" geht zu
 * /compare mit den IDs als Query-Parameter.
 */
export function CompareBar() {
  const { ids, clear, max } = useCompareList();
  if (ids.length === 0) return null;

  const href = `/compare?ids=${ids.join(",")}`;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-lift">
        <GitCompare size={16} className="text-brand-600" />
        <span className="text-sm font-medium text-slate-700">
          {ids.length} <span className="text-slate-500">/ {max}</span> im Vergleich
        </span>
        <Link
          href={href}
          className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Vergleichen →
        </Link>
        <button
          type="button"
          onClick={clear}
          title="Vergleich leeren"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
