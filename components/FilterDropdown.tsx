"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

export type FilterOption = { value: string; label: string; count?: number };

/**
 * Einheitliche Pillen-Dropdown für Filter — Galaxus-/Digitec-Stil.
 *
 * - Abgerundeter Pillen-Button mit Label + Chevron; öffnet ein Popover mit Optionen.
 * - Schreibt direkt in die URL-Suchparameter (router.replace), sodass die
 *   umliegende Server-Page neu rendert. Andere Filter bleiben erhalten.
 * - `multiple`: Mehrfachauswahl (pipe-separiert in der URL, wie ChipButtonClient).
 * - Wert "" einer Option wirkt als "Alle"/Zurücksetzen dieser Dimension.
 */
export function FilterDropdown({
  label,
  paramKey,
  options,
  multiple = false,
  align = "left",
  widthClass = "w-64",
}: {
  label: string;
  paramKey: string;
  options: FilterOption[];
  multiple?: boolean;
  align?: "left" | "right";
  widthClass?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const raw = sp.get(paramKey) ?? "";
  const selected = multiple ? raw.split("|").filter(Boolean) : raw ? [raw] : [];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(next: string[]) {
    const params = new URLSearchParams(sp.toString());
    if (next.length > 0) params.set(paramKey, next.join("|"));
    else params.delete(paramKey);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function choose(value: string) {
    if (!value) {
      // "Alle" / Zurücksetzen dieser Dimension
      commit([]);
      setOpen(false);
      return;
    }
    if (multiple) {
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      commit(next);
    } else {
      commit(selected.includes(value) ? [] : [value]);
      setOpen(false);
    }
  }

  const activeCount = selected.length;
  const isActive = activeCount > 0;
  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const display =
    !isActive
      ? label
      : !multiple
        ? `${label}: ${selectedLabels[0] ?? raw}`
        : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "border-brand-600 bg-brand-600 text-white shadow-sm"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <span className="truncate">{display}</span>
        <span className="flex shrink-0 items-center gap-1">
          {multiple && isActive && (
            <span className="rounded-full bg-white px-1.5 text-xs font-semibold text-brand-700">
              {activeCount}
            </span>
          )}
          <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-1 max-h-72 ${widthClass} max-w-[80vw] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lift ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o) => {
            const sel = o.value ? selected.includes(o.value) : selected.length === 0;
            return (
              <button
                key={o.value || "__all__"}
                type="button"
                onClick={() => choose(o.value)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  sel ? "font-semibold text-brand-700" : "text-slate-700"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center ${
                      multiple ? "rounded" : "rounded-full"
                    } border ${sel ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}
                  >
                    {sel && <Check size={12} />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </span>
                {o.count != null && <span className="shrink-0 text-xs text-slate-400">{o.count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
