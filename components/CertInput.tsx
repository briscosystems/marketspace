"use client";

import { useState, useRef } from "react";
import { Plus, X, Check, AlertCircle } from "lucide-react";
import { suggestCerts, resolveCert, type CertDef } from "@/lib/certifications";

export function CertInput({
  value,
  onChange,
  placeholder = "Zertifikat / Freigabe suchen oder eingeben",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: CertDef[] = query
    ? suggestCerts(query, 6).filter(
        (c) => !value.some((v) => resolveCert(v).id === c.id),
      )
    : [];

  function add(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white p-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        {value.map((c, i) => {
          const def = resolveCert(c);
          const unknown = def.id.startsWith("unknown-");
          return (
            <span
              key={`${c}-${i}`}
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs"
              style={{
                borderColor: `${def.color}40`,
                color: def.color,
                backgroundColor: unknown ? "#fef9c3" : "#fff",
              }}
              title={unknown ? "Nicht im normierten Katalog" : def.full}
            >
              {unknown ? <AlertCircle size={11} /> : <Check size={11} />}
              {c}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 rounded p-0.5 hover:bg-slate-100"
                aria-label="Entfernen"
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions[0]) add(suggestions[0].short);
              else if (query.trim()) add(query);
            } else if (e.key === "Backspace" && !query && value.length > 0) {
              remove(value.length - 1);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[10rem] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {showSuggestions && (query || suggestions.length > 0) && (
        <div className="relative">
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lift">
            {suggestions.length > 0 ? (
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s.short);
                  }}
                  className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
                >
                  <Plus size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <div
                      className="font-medium"
                      style={{ color: s.color }}
                    >
                      {s.short}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {s.full}
                    </div>
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(query);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <div className="font-medium text-slate-800">
                    "{query}" als unbekanntes Zertifikat hinzufügen
                  </div>
                  <div className="text-xs text-amber-700">
                    Nicht im normierten Katalog — wird mit Warn-Symbol angezeigt.
                  </div>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
