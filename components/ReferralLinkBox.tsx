"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/** Empfehlungs-Link anzeigen + kopieren. Code = eigenes Pseudonym. */
export function ReferralLinkBox({ pseudonym }: { pseudonym: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  // Erst im Browser berechnen (window) — vermeidet Hydration-Differenzen
  useEffect(() => {
    setLink(
      `${window.location.origin}${withBasePath(`/register?ref=${encodeURIComponent(pseudonym)}`)}`,
    );
  }, [pseudonym]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: Text markieren lassen
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link || `…/register?ref=${pseudonym}`}
        onFocus={(e) => e.target.select()}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}
