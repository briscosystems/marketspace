"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * „Frist verlängern" auf der eigenen Anfrage (Betreiber 2026-08-16).
 *
 * Für offene UND ausgelaufene Anfragen: Datum wählen, Knopf drücken — eine
 * ausgelaufene Anfrage wird damit wieder geöffnet, statt sie neu eintippen
 * zu müssen. Vorbelegt sind 14 Tage ab heute.
 */
export function FristVerlaengern({ rfqId }: { rfqId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const vorschlag = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [datum, setDatum] = useState(vorschlag);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function verlaengern() {
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/verlaengern`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: datum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("rfqd.verlFehler"));
      router.refresh();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("rfqd.verlFehler"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex items-center gap-1.5 text-sm text-slate-600">
        <CalendarClock className="h-4 w-4 text-slate-400" />
        {t("rfqd.verlLabel")}
        <input
          type="date"
          value={datum}
          min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
          onChange={(e) => setDatum(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={verlaengern}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("rfqd.verlKnopf")}
      </button>
      {fehler && <span className="text-sm text-red-600">{fehler}</span>}
    </div>
  );
}
