"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react";

/**
 * Bezahl-Button + Erfolgs-/Abbruch-Handling für die Jahres-Zugangsgebühr.
 * Startet Stripe-Checkout und schaltet nach Rückkehr (status=success) die
 * Mitgliedschaft über /api/billing/confirm frei (Fallback ohne Webhook).
 */
export function MembershipActions({
  active,
  priceEur,
}: {
  active: boolean;
  priceEur: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<"success" | "cancel" | null>(null);

  // Nach Rückkehr von Stripe: Erfolg bestätigen / Abbruch anzeigen.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    if (status === "cancel") {
      setNotice("cancel");
      window.history.replaceState({}, "", "/mitgliedschaft");
    } else if (status === "success" && sessionId) {
      (async () => {
        try {
          await fetch(`/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`);
        } catch {
          /* Webhook übernimmt sonst */
        }
        setNotice("success");
        window.history.replaceState({}, "", "/mitgliedschaft");
        router.refresh();
      })();
    }
  }, [router]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {notice === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> Zahlung erfolgreich — dein Zugang ist freigeschaltet.
        </div>
      )}
      {notice === "cancel" && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <XCircle size={16} /> Zahlung abgebrochen.
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {active ? `Um 1 Jahr verlängern (${priceEur} €)` : `Jahres-Zugang freischalten (${priceEur} €)`}
      </button>
      <p className="text-xs text-slate-500">
        Sichere Kartenzahlung über Stripe. Testmodus: Kartennummer 4242 4242 4242 4242, beliebiges
        künftiges Ablaufdatum und CVC.
      </p>
    </div>
  );
}
