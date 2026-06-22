"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "ACTIVE" | "PAUSED" | "SOLD" | "ARCHIVED";

const labels: Record<Status, string> = {
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
  SOLD: "Verkauft",
  ARCHIVED: "Archiviert",
};

const colors: Record<Status, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  PAUSED: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  SOLD: "bg-slate-200 text-slate-700 hover:bg-slate-300",
  ARCHIVED: "bg-slate-100 text-slate-500 hover:bg-slate-200",
};

export function QuickStatusToggle({
  listingId,
  status,
}: {
  listingId: string;
  status: Status;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [saving, setSaving] = useState(false);

  async function setStatus(next: Status) {
    if (next === current || saving) return;
    setSaving(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (res.ok) {
      setCurrent(next);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {(["ACTIVE", "PAUSED", "SOLD"] as Status[]).map((s) => (
        <button
          key={s}
          type="button"
          disabled={saving || s === current}
          onClick={() => setStatus(s)}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            s === current ? colors[s] + " ring-1 ring-inset ring-current" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          } ${saving ? "opacity-50" : ""}`}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}
