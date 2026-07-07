"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

type Pkg = { id: string; credits: number; label: string; priceChf: number };

/**
 * Credit-Pakete kaufen — startet den Stripe-Checkout.
 * Erfolg/Abbruch wird von MembershipActions auf derselben Seite behandelt
 * (gleiche success/cancel-URL + /api/billing/confirm).
 */
export function CreditActions({ packages }: { packages: Pkg[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packageId: string) {
    setLoading(packageId);
    setError(null);
    const res = await fetch(withBasePath("/api/billing/checkout-credits"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error ?? "Checkout konnte nicht gestartet werden.");
      setLoading(null);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {packages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => buy(p.id)}
            disabled={loading !== null}
            className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-400 hover:shadow-soft disabled:opacity-50"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {p.label}
            </div>
            <div className="mt-0.5 text-lg font-bold text-slate-900">
              {p.credits} Credits
            </div>
            <div className="text-sm text-slate-600">
              CHF {p.priceChf.toFixed(2)}
            </div>
            <div className="mt-2 text-xs font-medium text-brand-700">
              {loading === p.id ? "Öffne Checkout …" : "Kaufen →"}
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
