"use client";

import { Check, Wrench, Disc3, Scissors, Hammer, MoreHorizontal } from "lucide-react";
import { MACHINING_OPERATIONS, type MachiningOperationId } from "@/lib/kss-automation";

const GROUP_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  spanend: { label: "Spanend", icon: Wrench },
  abrasiv: { label: "Abrasiv", icon: Disc3 },
  trennend: { label: "Trennend", icon: Scissors },
  umformend: { label: "Umformend", icon: Hammer },
  sonstige: { label: "Sonstige", icon: MoreHorizontal },
};

export function MachiningSelect({
  value,
  onChange,
}: {
  value: MachiningOperationId[];
  onChange: (next: MachiningOperationId[]) => void;
}) {
  function toggle(id: MachiningOperationId) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  const groups = Array.from(
    new Set(MACHINING_OPERATIONS.map((o) => o.group)),
  );

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const ops = MACHINING_OPERATIONS.filter((o) => o.group === g);
        const meta = GROUP_META[g];
        const Icon = meta.icon;
        return (
          <div key={g}>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon size={12} className="text-slate-400" />
              {meta.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ops.map((o) => {
                const selected = value.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    title={o.hint}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      selected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {selected && <Check size={11} strokeWidth={3} className="text-emerald-600" />}
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
