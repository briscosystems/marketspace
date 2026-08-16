"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

const TAGS = [
  { id: "FAST_RESPONSE", labelKey: "revf.tagFast" },
  { id: "QUALITY_AS_DESCRIBED", labelKey: "revf.tagQuality" },
  { id: "ON_TIME_DELIVERY", labelKey: "revf.tagOnTime" },
  { id: "FAIR_NEGOTIATION", labelKey: "revf.tagFair" },
] as const;

type Tag = (typeof TAGS)[number]["id"];

export function ReviewForm({
  transactionId,
  initial,
  revieweeLabel,
}: {
  transactionId: string;
  initial?: { rating: number; comment: string | null; tags: Tag[] } | null;
  revieweeLabel: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [hover, setHover] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: Tag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t("revf.minStern"));
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(withBasePath(`/api/transactions/${transactionId}/reviews`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined, tags }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("revf.fehler"));
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <div className="text-sm text-slate-600">
          {fill(t("revf.bewerte"), { name: revieweeLabel })}
        </div>
        <div className="mt-1 flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover ?? rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRating(n)}
                className={`leading-none transition-colors ${active ? "text-amber-500" : "text-slate-300"}`}
                aria-label={fill(t("revf.sterneAria"), { n })}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-sm text-slate-600">{t("revf.tags")}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = tags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  active
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t(tag.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">{t("revf.kommentar")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input"
          placeholder={t("revf.kommentarPlatzhalter")}
        />
      </div>
      {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? t("revf.speichert") : initial ? t("revf.aktualisieren") : t("revf.absenden")}
      </button>
    </form>
  );
}
