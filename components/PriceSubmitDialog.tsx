"use client";

import { useState } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type Props = {
  productId: string;
  productName: string;
  manufacturer: string;
  onClose: () => void;
};

const UNITS = [
  { value: "EUR_PER_L", label: "EUR / Liter" },
  { value: "EUR_PER_KG", label: "EUR / kg" },
  { value: "CHF_PER_L", label: "CHF / Liter" },
  { value: "CHF_PER_KG", label: "CHF / kg" },
  { value: "USD_PER_L", label: "USD / Liter" },
  { value: "USD_PER_KG", label: "USD / kg" },
  { value: "EUR_PER_PIECE", label: "EUR / Stück" },
] as const;

const PACKAGINGS = [
  { value: "", label: "—" },
  { value: "DRUM", label: "Fass (200L)" },
  { value: "IBC", label: "IBC (1000L)" },
  { value: "TANK", label: "Tank/Bulk" },
  { value: "CANISTER", label: "Kanister" },
  { value: "OTHER", label: "Sonstiges" },
] as const;

export function PriceSubmitDialog({ productId, productName, manufacturer, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [pricePerUnit, setPrice] = useState("");
  const [unit, setUnit] = useState<(typeof UNITS)[number]["value"]>("EUR_PER_L");
  const [observedAt, setObservedAt] = useState(today);
  const [packagingForm, setPackagingForm] = useState("");
  const [quantityMin, setQuantityMin] = useState("");
  const [regionCode, setRegionCode] = useState("DE");
  const [sourceLabel, setSourceLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit() {
    if (!pricePerUnit || parseFloat(pricePerUnit) <= 0) {
      setResult({ ok: false, message: "Bitte gültigen Preis eingeben" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(withBasePath("/api/prices/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          pricePerUnit: parseFloat(pricePerUnit),
          unit,
          observedAt,
          packagingForm: packagingForm || undefined,
          quantityMin: quantityMin ? parseFloat(quantityMin) : undefined,
          regionCode: regionCode || undefined,
          sourceLabel: sourceLabel || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      setResult({ ok: true, message: data.message ?? "Eingegangen — wartet auf Verifizierung" });
      setTimeout(onClose, 2500);
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="section-title">Preis melden</h2>
            <p className="text-xs text-slate-500">
              {manufacturer} · {productName}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ℹ️ Deine Meldung wird <strong>geprüft</strong>, bevor sie öffentlich
            in der Marktpreis-Statistik erscheint. Trade-Assured+ User oder Admins können
            verifizieren.
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="label">Preis *</label>
              <input
                type="number"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="z.B. 7.50"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Einheit *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} className="input">
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Beobachtungsdatum *</label>
              <input
                type="date"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                max={today}
                className="input"
              />
            </div>
            <div>
              <label className="label">Region</label>
              <input
                type="text"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="DE / CH / AT"
                className="input"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Gebindeform</label>
              <select value={packagingForm} onChange={(e) => setPackagingForm(e.target.value)} className="input">
                {PACKAGINGS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min. Menge (L/kg)</label>
              <input
                type="number"
                step="1"
                value={quantityMin}
                onChange={(e) => setQuantityMin(e.target.value)}
                placeholder="z.B. 200"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Quelle (optional)</label>
            <input
              type="text"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="z.B. eigener Einkauf, Distributor-Angebot, Webshop URL"
              className="input"
            />
          </div>

          <div>
            <label className="label">Notizen (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kontext / Konditionen, z.B. Stammkundenrabatt, Listenpreis ohne Rabatt, etc."
              className="input"
              rows={2}
            />
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 rounded px-3 py-2 text-sm ${
                result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={loading || result?.ok}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? "Sende…" : "Preis melden"}
          </button>
        </div>
      </div>
    </div>
  );
}
