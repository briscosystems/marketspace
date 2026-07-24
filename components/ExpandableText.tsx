"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Text mit Zeilen-Begrenzung (line-clamp), der sich per Klick vollständig
 * aufklappen lässt. Der „Mehr anzeigen"-Knopf erscheint nur, wenn der Text
 * tatsächlich abgeschnitten ist.
 */
export function ExpandableText({
  text,
  moreLabel,
  lessLabel,
  className = "text-sm text-slate-600",
  clampClass = "line-clamp-3",
}: {
  text: string;
  moreLabel: string;
  lessLabel: string;
  className?: string;
  clampClass?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Nach dem Rendern messen, ob der Text wirklich abgeschnitten ist.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div>
      <p ref={ref} className={`${className} ${expanded ? "" : clampClass}`}>
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-brand-700 hover:underline"
        >
          {expanded ? lessLabel : moreLabel}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      )}
    </div>
  );
}
