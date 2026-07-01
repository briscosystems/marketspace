"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

export function PriceVerifyActions({ observationId }: { observationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setError(null);
    let rejectionReason: string | undefined;
    if (action === "reject") {
      rejectionReason = prompt("Grund für Ablehnung (optional)") ?? undefined;
    }
    setLoading(action);
    try {
      const resp = await fetch(withBasePath("/api/prices/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observationId, action, rejectionReason }),
      });
      if (!resp.ok) {
        const d = await resp.json();
        throw new Error(d.error ?? `HTTP ${resp.status}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <button
          onClick={() => act("approve")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading === "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Freigeben
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {loading === "reject" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          Ablehnen
        </button>
      </div>
      {error && <div className="text-[10px] text-red-600">{error}</div>}
    </div>
  );
}
