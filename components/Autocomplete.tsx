"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Wiederverwendbares Echtzeit-Vorschlagsfeld (Autocomplete).
 *
 * - Beim Tippen klappt sofort eine gefilterte Liste der `options` auf.
 * - Freitext ist erlaubt (man muss keinen Vorschlag wählen).
 * - Trägt einen `name`, sodass es in normalen <form>+FormData-Formularen
 *   wie ein <input> funktioniert.
 *
 * Normalisierung: Klein-/Großschreibung und Trennzeichen werden ignoriert,
 * damit „bcool" auch „B-Cool" findet.
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\-_./]+/g, "");
}

export function Autocomplete({
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  options,
  placeholder,
  required,
  id,
  maxSuggestions = 8,
  className = "input",
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  id?: string;
  maxSuggestions?: number;
  className?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? controlledValue! : internal;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  function setValue(v: string) {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  }

  const suggestions = useMemo(() => {
    const q = norm(value);
    const pool = options.filter((o, i) => options.indexOf(o) === i);
    if (!q) return pool.slice(0, maxSuggestions);
    // Treffer am Anfang priorisieren, dann Teiltreffer.
    const starts: string[] = [];
    const contains: string[] = [];
    for (const o of pool) {
      const n = norm(o);
      if (n === q) continue; // exakt schon eingegeben → kein Vorschlag nötig
      if (n.startsWith(q)) starts.push(o);
      else if (n.includes(q)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, maxSuggestions);
  }, [value, options, maxSuggestions]);

  // Klick außerhalb schließt die Liste.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(v: string) {
    setValue(v);
    setOpen(false);
    setHighlight(-1);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            if (open && highlight >= 0 && suggestions[highlight]) {
              e.preventDefault();
              choose(suggestions[highlight]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lift">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                i === highlight ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
