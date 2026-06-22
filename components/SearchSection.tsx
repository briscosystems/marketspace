import type { ReactNode } from "react";

type ColorVariant = "emerald" | "slate" | "brand" | "amber";

const VARIANTS: Record<
  ColorVariant,
  {
    border: string;
    bg: string;
    stepBg: string;
    stepText: string;
    title: string;
    subtitle: string;
  }
> = {
  // Grün — primäre Eingabe / Suchaktion
  emerald: {
    border: "border-emerald-300",
    bg: "bg-emerald-50/40",
    stepBg: "bg-emerald-500",
    stepText: "text-white",
    title: "text-emerald-900",
    subtitle: "text-emerald-700/80",
  },
  // Slate — sekundärer Filter-Bereich
  slate: {
    border: "border-slate-300",
    bg: "bg-slate-50",
    stepBg: "bg-slate-600",
    stepText: "text-white",
    title: "text-slate-900",
    subtitle: "text-slate-600",
  },
  // Brand-Violett — Resultate / Output
  brand: {
    border: "border-brand-300",
    bg: "bg-brand-50/40",
    stepBg: "bg-brand-600",
    stepText: "text-white",
    title: "text-brand-900",
    subtitle: "text-brand-700/80",
  },
  // Amber — Status/Warnung
  amber: {
    border: "border-amber-300",
    bg: "bg-amber-50/60",
    stepBg: "bg-amber-500",
    stepText: "text-white",
    title: "text-amber-900",
    subtitle: "text-amber-700/80",
  },
};

/**
 * Such-Seiten-Sektion mit nummeriertem Schritt-Header und farbiger
 * Identität — wiederverwendbar auf /kss-finder, /sds, /listings.
 */
export function SearchSection({
  step,
  title,
  subtitle,
  color = "slate",
  rightSlot,
  children,
  className,
}: {
  step?: number | string;
  title: string;
  subtitle?: ReactNode;
  color?: ColorVariant;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const v = VARIANTS[color];
  return (
    <section
      className={`rounded-xl border-2 ${v.border} ${v.bg} shadow-sm ${className ?? ""}`}
    >
      {/* Header-Bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-inherit px-3 py-2">
        <div className="flex items-center gap-2">
          {step !== undefined && (
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${v.stepBg} ${v.stepText}`}
            >
              {step}
            </span>
          )}
          <div className="leading-tight">
            <h2 className={`text-sm font-bold uppercase tracking-wide ${v.title}`}>
              {title}
            </h2>
            {subtitle && <div className={`text-[11px] ${v.subtitle}`}>{subtitle}</div>}
          </div>
        </div>
        {rightSlot}
      </header>

      {/* Body */}
      <div className="p-3">{children}</div>
    </section>
  );
}
