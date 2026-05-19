"use client";

import { useCompareList } from "./CompareStore";
import { Check, GitCompare, X } from "lucide-react";

type Kind = "listings" | "products";

type Props = {
  id: string;
  kind: Kind;
  variant?: "checkbox" | "button" | "icon";
  label?: string;
};

/**
 * Drei Varianten:
 *  - checkbox: kleines Häkchen-Quadrat, ideal für Listings-Karten
 *  - icon:     runde Icon-Schaltfläche (für Produkt-Listen im Hersteller-Detail)
 *  - button:   voller Button mit Label (für Detail-Seiten)
 */
export function CompareToggle({ id, kind, variant = "button", label = "Vergleichen" }: Props) {
  const { ids, toggle, isFull } = useCompareList(kind);
  const active = ids.includes(id);
  const disabled = !active && isFull;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) toggle(id);
  };

  if (variant === "checkbox") {
    return (
      <label
        onClick={(e) => e.stopPropagation()}
        className="inline-flex cursor-pointer items-center gap-1.5 select-none"
        title={
          active
            ? "Aus Vergleich entfernen"
            : disabled
              ? "Maximal 6 im Vergleich"
              : "Zum Vergleich hinzufügen"
        }
      >
        <input
          type="checkbox"
          checked={active}
          disabled={disabled}
          onChange={(e) => {
            e.stopPropagation();
            if (!disabled) toggle(id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span
          className={`text-[11px] font-medium ${
            active ? "text-brand-700" : disabled ? "text-slate-300" : "text-slate-500"
          }`}
        >
          Vergleich
        </span>
      </label>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
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
      onClick={onClick}
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

export function CompareRemoveButton({ id, kind }: { id: string; kind: Kind }) {
  const { remove } = useCompareList(kind);
  return (
    <button
      type="button"
      onClick={() => remove(id)}
      title="Aus Vergleich entfernen"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
    >
      <X size={14} />
    </button>
  );
}
