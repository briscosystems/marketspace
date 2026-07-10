"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { CURRENCY_OPTIONS } from "@/lib/currency";

/** Gewünschte Anzeige-/Abrechnungswährung im eigenen Profil wählen. */
export function CurrencyEditor({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    setCurrency(next);
    setSaving(true);
    setError(null);
    const res = await fetch(withBasePath("/api/profile/currency"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-700" htmlFor="currency">
        Währung
      </label>
      <select
        id="currency"
        value={currency}
        onChange={(e) => save(e.target.value)}
        disabled={saving}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        <option value="">Automatisch (nach Land)</option>
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
