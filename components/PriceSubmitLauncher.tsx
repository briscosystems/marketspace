"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PriceSubmitDialog } from "@/components/PriceSubmitDialog";

export function PriceSubmitLauncher({
  productId,
  productName,
  manufacturer,
}: {
  productId: string;
  productName: string;
  manufacturer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        <Plus size={12} /> Preis melden
      </button>
      {open && (
        <PriceSubmitDialog
          productId={productId}
          productName={productName}
          manufacturer={manufacturer}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
