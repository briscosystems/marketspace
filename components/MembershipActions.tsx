"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/**
 * Abo-Steuerung: Abschluss (echtes Stripe-Abo), Kündigen, Kündigung
 * zurücknehmen. Der "Abo kündigen"-Knopf ist bewusst IMMER sichtbar, sobald
 * ein Abo läuft — kein Untermenü, kein Support-Kontakt nötig (vgl. den
 * "Kündigungsbutton"-Gedanken aus § 312k BGB, siehe Offenlegungstext auf
 * dieser Seite). Kündigung wirkt zum Ende der bereits bezahlten Periode,
 * ohne Vorlauffrist.
 */
export function MembershipActions({
  active,
  priceEur,
  hasSubscription,
  cancelAtPeriodEnd,
  validUntil,
}: {
  active: boolean;
  priceEur: number;
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  validUntil: string | null; // bereits formatiertes Datum
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
      window.history.replaceState({}, "", withBasePath("/mitgliedschaft"));
    } else if (status === "success" && sessionId) {
      (async () => {
        try {
          await fetch(withBasePath(`/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`));
        } catch {
          /* Webhook übernimmt sonst */
        }
        setNotice("success");
        window.history.replaceState({}, "", withBasePath("/mitgliedschaft"));
        router.refresh();
      })();
    }
  }, [router]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(withBasePath("/api/billing/checkout"), { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  async function callAction(path: "cancel" | "reactivate") {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(withBasePath(`/api/billing/${path}`), { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
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

      {active && hasSubscription ? (
        cancelAtPeriodEnd ? (
          <div className="space-y-2">
            <p className="text-sm text-amber-700">
              Gekündigt — dein Zugang läuft am <strong>{validUntil}</strong> aus. Danach
              erfolgt keine weitere Abbuchung.
            </p>
            <button
              type="button"
              onClick={() => callAction("reactivate")}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              Kündigung zurücknehmen
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Verlängert sich automatisch am <strong>{validUntil}</strong> für weitere 12 Monate
              ({priceEur} €), sofern nicht vorher gekündigt.
            </p>
            <button
              type="button"
              onClick={() => callAction("cancel")}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Abo kündigen
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {priceEur} € pro Jahr. Das Abo verlängert sich automatisch um jeweils 12 Monate,
            sofern du nicht vorher kündigst — Kündigung jederzeit mit einem Klick, wirksam zum
            Ende der bezahlten Periode.
          </p>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Jetzt zahlungspflichtig abonnieren ({priceEur} € / Jahr)
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Sichere Kartenzahlung über Stripe. Testmodus: Kartennummer 4242 4242 4242 4242, beliebiges
        künftiges Ablaufdatum und CVC.
      </p>
    </div>
  );
}
