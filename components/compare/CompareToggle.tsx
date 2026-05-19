"use client";

import { useCompareList } from "./CompareStore";
import { Check, GitCompare, X } from "lucide-react";

type Props = {
  productId: string;
  label?: string;
  variant?: "button" | "icon";
};

/**
 * Add-to-compare Toggle für Produkt-Karten und Produkt-Detail.
 * Verwendet localStorage über den shared CompareStore.
 */
export function CompareToggle({ productId, label = "Vergleichen", variant = "button" }: Props) {
  const { ids, toggle, isFull } = useCompareList();
  const active = ids.includes(productId);
  const disabled = !active && isFull;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) toggle(productId);
        }}
        aria-pressed={active}
        title={
          active
            ? "Aus Vergleich entfernen"
            : disabled
              ? "Vergleichsliste voll (max 6)"
              : "Zum Vergleich hinzufügen"
        }
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
          active
            ? "border-brand-400 bg-brand-50 text-brand-700"
            : disabled
              ? "border-slate-200 bg-white text-slate-300"
              : "border-slate-300 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-600"
        }`}
      >
        {active ? <Check size={14} /> : <GitCompare size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) toggle(productId);
      }}
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-brand-400 bg-brand-50 text-brand-700"
          : disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {active ? <Check size={14} /> : <GitCompare size={14} />}
      {active ? "Im Vergleich" : disabled ? "Liste voll" : label}
    </button>
  );
}

/**
 * Reine Entfernen-Variante (z.B. auf der /compare-Seite).
 */
export function CompareRemoveButton({ productId }: { productId: string }) {
  const { remove } = useCompareList();
  return (
    <button
      type="button"
      onClick={() => remove(productId)}
      title="Aus Vergleich entfernen"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
    >
      <X size={14} />
    </button>
  );
}
