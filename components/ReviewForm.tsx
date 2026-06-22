"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TAGS = [
  { id: "FAST_RESPONSE", label: "Schnelle Antwort" },
  { id: "QUALITY_AS_DESCRIBED", label: "Qualität wie beschrieben" },
  { id: "ON_TIME_DELIVERY", label: "Pünktliche Lieferung" },
  { id: "FAIR_NEGOTIATION", label: "Faire Verhandlung" },
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
  const router = useRouter();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [hover, setHover] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleTag(t: Tag) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Bitte mindestens 1 Stern vergeben.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/transactions/${transactionId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined, tags }),
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
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <div className="text-sm text-slate-600">
          Bewerte {revieweeLabel} (1–5 Sterne)
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
                aria-label={`${n} Sterne`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-sm text-slate-600">Tags (Mehrfachauswahl)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const active = tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  active
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">Kommentar (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input"
          placeholder="Wie ist der Deal gelaufen?"
        />
      </div>
      {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Speichern …" : initial ? "Bewertung aktualisieren" : "Bewertung absenden"}
      </button>
    </form>
  );
}
