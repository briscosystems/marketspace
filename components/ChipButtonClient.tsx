"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

/**
 * Multi-Select-Chip — togglet einen Wert in einem URL-Parameter (pipe-separiert).
 * Navigiert mit router.replace, sodass die umliegende Server-Page neu rendert.
 */
export function ChipButtonClient({
  name,
  value,
  isSelected,
  children,
}: {
  name: string;
  value: string;
  isSelected: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const current = (sp.get(name) ?? "").split("|").filter(Boolean);
    const next = isSelected ? current.filter((v) => v !== value) : [...current, value];
    const params = new URLSearchParams(sp.toString());
    if (next.length > 0) params.set(name, next.join("|"));
    else params.delete(name);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        isSelected
          ? "border-brand-500 bg-brand-500 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      } ${isPending ? "opacity-60" : ""}`}
    >
      {isSelected && <span className="mr-1">✓</span>}
      {children}
    </button>
  );
}
