"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";

/**
 * "Über uns"-Text auf dem eigenen Schaufenster bearbeiten.
 * Wird nur gerendert, wenn der Betrachter das eigene Profil ansieht.
 */
export function AboutEditor({ initial }: { initial: string | null }) {
  const { t } = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(withBasePath("/api/profile/about"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ about: text.trim() || null }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("abed.fehler"));
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
      >
        <PencilLine size={14} />
        {initial ? t("abed.bearbeiten") : t("abed.ergaenzen")}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={1500}
        placeholder={t("abed.platzhalter")}
        className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? t("abed.speichert") : t("abed.speichern")}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setText(initial ?? "");
          }}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {t("abed.abbrechen")}
        </button>
      </div>
    </div>
  );
}
