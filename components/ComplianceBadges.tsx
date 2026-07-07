import { ShieldCheck } from "lucide-react";
import {
  complianceBadges,
  type ComplianceSource,
  type ComplianceTone,
} from "@/lib/compliance";

const TONE_CLASSES: Record<ComplianceTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
};

/**
 * Compliance-Siegel ("borfrei", "NSF/FDA H1", …) als kompakte Chip-Reihe.
 * Server-tauglich, kein Client-State — Erklärung per title-Tooltip.
 */
export function ComplianceBadges({
  product,
  size = "sm",
  max,
}: {
  product: ComplianceSource;
  size?: "xs" | "sm";
  max?: number;
}) {
  const badges = complianceBadges(product);
  if (badges.length === 0) return null;
  const shown = max ? badges.slice(0, max) : badges;

  const chip =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2 py-0.5 text-xs";
  const icon = size === "xs" ? 9 : 11;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((b) => (
        <span
          key={b.id}
          title={b.title}
          className={`inline-flex cursor-help items-center gap-1 rounded-full font-medium ring-1 ${chip} ${TONE_CLASSES[b.tone]}`}
        >
          <ShieldCheck size={icon} />
          {b.label}
        </span>
      ))}
      {max && badges.length > max && (
        <span className="text-[10px] text-slate-400">+{badges.length - max}</span>
      )}
    </div>
  );
}
