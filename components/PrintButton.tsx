"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Drucken / als PDF sichern" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <Printer size={14} />
      {label}
    </button>
  );
}
