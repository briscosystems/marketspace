"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, CheckCircle2, XCircle, RotateCcw, Check } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";

type TierKey = "BASIS" | "PRO" | "MARKE";

export type TierOption = {
  tier: TierKey;
  name: string;
  audience: string;
  priceEur: number;
  features: string[];
  featured?: boolean;
};

/**
 * Abo-Steuerung mit Preisstufen (Basis/Pro/Marke): Stufe wählen und
 * abschließen (echtes Stripe-Abo), laufendes Abo kündigen bzw. Kündigung
 * zurücknehmen. Der "Abo kündigen"-Knopf ist bewusst IMMER sichtbar, sobald
 * ein Abo läuft (vgl. "Kündigungsbutton"-Gedanke aus § 312k BGB, siehe
 * Offenlegungstext auf dieser Seite). Kündigung wirkt zum Ende der bezahlten
 * Periode, ohne Vorlauffrist.
 */
export function MembershipActions({
  active,
  hasSubscription,
  cancelAtPeriodEnd,
  validUntil,
  currentPriceEur,
  currentTierName,
  tiers,
}: {
  active: boolean;
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  validUntil: string | null; // bereits formatiertes Datum
  currentPriceEur: number;
  currentTierName: string | null;
  tiers: TierOption[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<"success" | "cancel" | null>(null);
  const [selected, setSelected] = useState<TierKey>(
    tiers.find((t) => t.featured)?.tier ?? tiers[0]?.tier ?? "BASIS",
  );

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
      const resp = await fetch(withBasePath("/api/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selected }),
      });
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

  const selectedTier = tiers.find((t) => t.tier === selected);

  return (
    <div className="space-y-4">
      {notice === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> {t("memact.erfolg")}
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
              {t("memact.gekuendigt1").replace("{tier}", currentTierName ? ` (${currentTierName})` : "")}{" "}
              <strong>{validUntil}</strong>
              {t("memact.gekuendigt2")}
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
              Stufe <strong>{currentTierName ?? "—"}</strong> aktiv. Verlängert sich automatisch am{" "}
              <strong>{validUntil}</strong> für weitere 12 Monate ({currentPriceEur} €), sofern nicht
              vorher gekündigt.
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
        <div className="space-y-4">
          {/* Stufen-Auswahl */}
          <div className="grid gap-3 sm:grid-cols-3">
            {tiers.map((t) => {
              const isSel = t.tier === selected;
              return (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => setSelected(t.tier)}
                  aria-pressed={isSel}
                  className={`relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                    isSel
                      ? "border-brand-500 bg-brand-50/60 shadow-lift ring-1 ring-brand-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft"
                  }`}
                >
                  {t.featured && (
                    <span className="absolute -top-2 right-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Beliebt
                    </span>
                  )}
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t.audience}
                  </span>
                  <span className="mt-1 text-lg font-bold text-slate-900">{t.name}</span>
                  <span className="mt-0.5 text-xl font-bold tabular-nums text-brand-700">
                    {t.priceEur} €
                    <span className="text-xs font-normal text-slate-500"> / Jahr</span>
                  </span>
                  <ul className="mt-3 space-y-1.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-1.5 text-xs text-slate-600">
                        <Check size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            {selectedTier?.priceEur} € pro Jahr. Das Abo verlängert sich automatisch um jeweils 12
            Monate, sofern du nicht vorher kündigst — Kündigung jederzeit mit einem Klick, wirksam zum
            Ende der bezahlten Periode.
          </p>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {selectedTier?.name} abonnieren ({selectedTier?.priceEur} € / Jahr)
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Sichere Kartenzahlung über Stripe.
      </p>
    </div>
  );
}
