"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

type Initial = {
  priceEur: number;
  quantity: number;
  quantityUnit: string;
  deliveryDays: number;
  notes: string | null;
  alternativeProduct: string | null;
  alternativeReason: string | null;
} | null | undefined;

export function SubmitOfferForm({
  rfqId,
  initial,
  defaultUnit,
}: {
  rfqId: string;
  initial: Initial;
  defaultUnit: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      priceEur: Number(fd.get("priceEur")),
      quantity: Number(fd.get("quantity")),
      quantityUnit: fd.get("quantityUnit") || defaultUnit,
      deliveryDays: Number(fd.get("deliveryDays")),
      notes: (fd.get("notes") as string) || undefined,
      alternativeProduct: (fd.get("alternativeProduct") as string) || undefined,
      alternativeReason: (fd.get("alternativeReason") as string) || undefined,
    };
    const res = await fetch(withBasePath(`/api/rfqs/${rfqId}/offers`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Angebot konnte nicht abgegeben werden.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Preis pro Einheit (€) *</label>
          <input
            name="priceEur"
            type="number"
            step="0.01"
            required
            defaultValue={initial?.priceEur}
            className="input"
          />
        </div>
        <div>
          <label className="label">Anbietbare Menge *</label>
          <input
            name="quantity"
            type="number"
            step="any"
            required
            defaultValue={initial?.quantity}
            className="input"
          />
        </div>
        <div>
          <label className="label">Einheit</label>
          <input
            name="quantityUnit"
            defaultValue={initial?.quantityUnit ?? defaultUnit}
            className="input"
          />
        </div>
        <div>
          <label className="label">Lieferzeit (Tage) *</label>
          <input
            name="deliveryDays"
            type="number"
            min={1}
            required
            defaultValue={initial?.deliveryDays}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">Anmerkungen</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
          className="input"
          placeholder="Z. B. Selbstabholung möglich, Mehrwertsteuer ausgewiesen, …"
        />
      </div>
      <div className="rounded bg-slate-50 p-3 space-y-3">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          Optional: Alternativvorschlag
        </div>
        <div>
          <label className="label">Alternativ-Produkt</label>
          <input
            name="alternativeProduct"
            defaultValue={initial?.alternativeProduct ?? ""}
            className="input"
            placeholder="z. B. Fuchs Renolin B 46 statt Shell Tellus S2 M 46"
          />
        </div>
        <div>
          <label className="label">Begründung</label>
          <textarea
            name="alternativeReason"
            rows={2}
            defaultValue={initial?.alternativeReason ?? ""}
            className="input"
            placeholder="Gleiche Viskosität, gleiche DIN-Freigabe, ähnliche Additivchemie"
          />
        </div>
      </div>
      {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Speichern …" : initial ? "Angebot aktualisieren" : "Angebot abgeben"}
      </button>
    </form>
  );
}
