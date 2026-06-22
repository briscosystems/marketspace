"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { KssWizardDialog } from "@/components/KssWizardDialog";

export function KssWizardLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:from-purple-700 hover:to-blue-700"
      >
        <Sparkles size={16} />
        KI-Wizard starten
      </button>
      {open && <KssWizardDialog onClose={() => setOpen(false)} />}
    </>
  );
}
