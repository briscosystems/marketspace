import { Gauge, AlertTriangle } from "lucide-react";
import {
  AUTOMATION_FIT_COLOR,
  AUTOMATION_FIT_LABEL,
  estimateAutomation,
  type AutomationInput,
} from "@/lib/kss-automation";

export function AutomationBadge({
  input,
  size = "sm",
}: {
  input: AutomationInput;
  size?: "xs" | "sm";
}) {
  const p = estimateAutomation(input);
  if (p.score === 0) return null;
  const dims =
    size === "xs"
      ? { px: "px-1.5 py-0.5", text: "text-[10px]", icon: 11 }
      : { px: "px-2 py-0.5", text: "text-xs", icon: 13 };
  return (
    <span
      title={`${AUTOMATION_FIT_LABEL[p.fit]} · Score ${p.score}/5`}
      className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ${AUTOMATION_FIT_COLOR[p.fit]} ${dims.px} ${dims.text}`}
    >
      <Gauge size={dims.icon} strokeWidth={2.25} />
      <span>Automation {p.score}/5</span>
      {p.warnings.length > 0 && (
        <AlertTriangle size={dims.icon - 1} className="text-amber-600" />
      )}
    </span>
  );
}
