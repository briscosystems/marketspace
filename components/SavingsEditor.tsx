"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Einsparung durch Produktwechsel erfassen (nur Käufer): Welches Produkt
 * wurde ersetzt und was hat es pro Einheit gekostet? Kleiner Inline-Dialog
 * in der Umsätze-Tabelle.
 */
export function SavingsEditor({
  transactionId,
  unit,
  initialName,
  initialPrice,
}: {
  transactionId: string;
  unit: string;
  initialName: string | null;
  initialPrice: number | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [price, setPrice] = useState(initialPrice != null ? String(initialPrice) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(remove = false) {
    setSaving(true);
    setError(null);
    const parsedPrice = parseFloat(price.replace(",", "."));
    const res = await fetch(withBasePath(`/api/transactions/${transactionId}/savings`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        remove
          ? { replacedProductName: null, replacedPricePerUnit: null }
          : { replacedProductName: name.trim(), replacedPricePerUnit: parsedPrice },
      ),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("sav.fehler"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
        title={t("sav.titleHint")}
      >
        <PiggyBank size={12} />
        {initialPrice != null ? t("sav.bearbeiten") : t("sav.erfassen")}
      </button>
    );
  }

  const parsedPrice = parseFloat(price.replace(",", "."));
  const canSave = name.trim().length >= 2 && Number.isFinite(parsedPrice) && parsedPrice > 0;

  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-left">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("sav.produktPlatzhalter")}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t("sav.preisPlatzhalter")}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
        <span className="text-xs text-slate-500">€ / {unit}</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving || !canSave}
          className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {t("sav.speichern")}
        </button>
        {initialPrice != null && (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600"
          >
            {t("sav.entfernen")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
        >
          {t("sav.abbrechen")}
        </button>
      </div>
    </div>
  );
}
