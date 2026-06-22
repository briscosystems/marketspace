"use client";

import { useState, useRef, useEffect } from "react";
import { Check, AlertCircle, Sparkles } from "lucide-react";

export type Suggestion = {
  value: string;
  label: string;
  hint?: string;
};

type SuggestInputProps = {
  value: string;
  onChange: (next: string) => void;
  onSelect?: (selected: Suggestion) => void;
  /**
   * Liefert Vorschläge zum aktuellen Wert. Wird live bei jedem Tippen aufgerufen.
   * Wenn leer / null zurückgegeben wird, ist der Wert ein "freier Text".
   */
  suggest: (query: string) => Suggestion[];
  /**
   * Liefert eine Validierungs-Bewertung des aktuellen Werts:
   *   - "known"   — exakt aus dem Vorschlagskatalog
   *   - "free"    — frei eingegeben, ist OK
   *   - "warning" — frei eingegeben, könnte ein Tippfehler sein
   */
  validate?: (value: string) => "known" | "free" | "warning";
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
  /** Wird im Dropdown unter Vorschlägen angezeigt (z.B. KI-Hinweis). */
  footer?: React.ReactNode;
};

export function SuggestInput({
  value,
  onChange,
  onSelect,
  suggest,
  validate,
  placeholder,
  name,
  required,
  className = "",
  footer,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = suggest(value);
  const valState = validate?.(value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setActiveIdx(0);
  }, [value]);

  function pick(s: Suggestion) {
    onChange(s.value);
    onSelect?.(s);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && suggestions[activeIdx]) {
              e.preventDefault();
              pick(suggestions[activeIdx]);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Tab" && open && suggestions[activeIdx]) {
              pick(suggestions[activeIdx]);
            }
          }}
          placeholder={placeholder}
          className="input pr-9"
          autoComplete="off"
        />
        {/* Validierungs-Indikator rechts im Feld */}
        {value && valState && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2" title={validationTitle(valState)}>
            {valState === "known" && (
              <Check size={16} className="text-emerald-500" strokeWidth={3} />
            )}
            {valState === "warning" && (
              <AlertCircle size={16} className="text-amber-500" strokeWidth={2.5} />
            )}
            {valState === "free" && (
              <Sparkles size={14} className="text-slate-300" />
            )}
          </span>
        )}
      </div>

      {open && (suggestions.length > 0 || footer) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lift">
          {suggestions.length > 0 && (
            <div className="max-h-72 overflow-auto py-1">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.value}-${i}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`flex w-full items-start justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
                    i === activeIdx ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{s.label}</span>
                    {s.hint && (
                      <span className="block truncate text-xs text-slate-500">{s.hint}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {footer && <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">{footer}</div>}
        </div>
      )}
    </div>
  );
}

function validationTitle(s: "known" | "free" | "warning"): string {
  switch (s) {
    case "known":
      return "Bekannter Eintrag aus dem Katalog";
    case "warning":
      return "Nicht im Katalog — bitte prüfen";
    default:
      return "Frei eingegeben";
  }
}
