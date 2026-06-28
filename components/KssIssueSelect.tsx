"use client";

import { AlertTriangle, Check } from "lucide-react";
import { KSS_ISSUES, type KssIssueId, type IssueQueryScope } from "@/lib/kss-issues";

export function KssIssueSelect({
  value,
  onChange,
  scope = "both",
  title = "Welche Probleme MUSS das Produkt vermeiden?",
  hint = "Mehrfachauswahl. Wird sowohl bei der Vorfilterung als auch beim KI-Vergleich berücksichtigt.",
}: {
  value: KssIssueId[];
  onChange: (next: KssIssueId[]) => void;
  scope?: IssueQueryScope;
  title?: string;
  hint?: string;
}) {
  const list = KSS_ISSUES.filter((i) => {
    if (scope === "both") return true; // alle Probleme anzeigen
    return i.scope.includes("general") || i.scope.includes(scope);
  });

  function toggle(id: KssIssueId) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <AlertTriangle size={14} className="text-amber-500" />
        {title}
      </div>
      {hint && <div className="mb-3 text-xs text-slate-500">{hint}</div>}
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((i) => {
          const selected = value.includes(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => toggle(i.id)}
              className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                selected
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  selected
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selected && <Check size={11} strokeWidth={3} />}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{i.label}</div>
                <div className="text-xs text-slate-500">{i.short}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
