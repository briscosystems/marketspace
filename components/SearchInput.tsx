"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Live-Volltextsuche als Pillen-Input. Schreibt debounced in einen URL-Parameter
 * (Standard "q") und ERHÄLT dabei alle anderen Filter-Parameter. Synchronisiert
 * sich mit externen URL-Änderungen (z.B. „Zurücksetzen"), ohne Tipp-Eingaben zu
 * überschreiben.
 */
export function SearchInput({
  paramKey = "q",
  placeholder = "Suchen…",
  debounceMs = 200,
}: {
  paramKey?: string;
  placeholder?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(sp.get(paramKey) ?? "");
  const [isPending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(value);

  // Externe URL-Änderungen übernehmen (Reset/Navigation), eigene Commits ignorieren.
  useEffect(() => {
    const urlVal = sp.get(paramKey) ?? "";
    if (urlVal !== lastSent.current) {
      lastSent.current = urlVal;
      setValue(urlVal);
    }
  }, [sp, paramKey]);

  function commit(next: string) {
    lastSent.current = next;
    const params = new URLSearchParams(sp.toString());
    if (next) params.set(paramKey, next);
    else params.delete(paramKey);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function update(next: string) {
    setValue(next);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => commit(next), debounceMs);
  }

  return (
    <div className={`relative ${isPending ? "opacity-80" : ""}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-11 pr-10 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (timeout.current) clearTimeout(timeout.current);
            setValue("");
            commit("");
          }}
          aria-label="Suche leeren"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
