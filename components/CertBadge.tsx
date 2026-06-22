"use client";

import { useState } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  Leaf,
  Triangle,
  Wrench,
  Cookie,
  Star,
  Info,
  ExternalLink,
  X,
  type LucideIcon,
} from "lucide-react";
import { resolveCert, type CertIconKey } from "@/lib/certifications";

const ICON_MAP: Record<CertIconKey, LucideIcon> = {
  din: BadgeCheck,
  iso: BadgeCheck,
  reach: Leaf,
  trgs: Triangle,
  oem: Wrench,
  food: Cookie,
  halal: Star,
  kosher: Star,
  ecology: Leaf,
  ghs: Triangle,
  ce: ShieldCheck,
  vde: ShieldCheck,
  default: Info,
};

export function CertBadge({
  raw,
  size = "sm",
  interactive = true,
}: {
  raw: string;
  size?: "xs" | "sm";
  interactive?: boolean;
}) {
  const def = resolveCert(raw);
  const unknown = def.id.startsWith("unknown-");
  const Icon = ICON_MAP[def.icon];
  const [open, setOpen] = useState(false);

  const dims =
    size === "xs"
      ? { px: "px-1.5 py-0.5", text: "text-[10px]", icon: 11, gap: "gap-1" }
      : { px: "px-2 py-1", text: "text-xs", icon: 13, gap: "gap-1.5" };

  const content = (
    <span
      className={`inline-flex items-center rounded-md border bg-white font-medium ${dims.px} ${dims.text} ${dims.gap}`}
      style={{
        borderColor: `${def.color}40`,
        color: def.color,
        backgroundColor: unknown ? "#f8fafc" : "#fff",
      }}
    >
      <Icon size={dims.icon} strokeWidth={2.25} />
      <span className="whitespace-nowrap">{def.short}</span>
      {unknown && (
        <span
          className="ml-1 text-[9px] font-bold text-amber-600"
          title="Nicht im normierten Katalog"
        >
          ?
        </span>
      )}
    </span>
  );

  if (!interactive) return content;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={def.full}
        className="cursor-pointer transition-transform hover:scale-105"
      >
        {content}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-4 rounded-t-xl border-b px-5 py-4"
              style={{ borderColor: `${def.color}30`, backgroundColor: `${def.color}10` }}
            >
              <div className="flex items-start gap-3">
                <Icon size={28} strokeWidth={2} style={{ color: def.color }} />
                <div>
                  <div className="font-semibold text-slate-900">{def.full}</div>
                  <div
                    className="mt-0.5 text-xs uppercase tracking-wide"
                    style={{ color: def.color }}
                  >
                    {categoryLabel(def.category)}
                    {unknown && " · Unbekannter Eintrag"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Schließen"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
              <p>{def.details}</p>
              {!unknown && def.aliases.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Gebräuchliche Schreibweisen
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[def.short, ...def.aliases].map((a) => (
                      <span
                        key={a}
                        className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Original-Eintrag im Listing
                </div>
                <code className="rounded bg-slate-100 px-2 py-1 text-xs">{raw}</code>
              </div>
              {def.wikipedia && (
                <a
                  href={def.wikipedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline"
                >
                  Mehr Infos <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function categoryLabel(c: string): string {
  switch (c) {
    case "norm":
      return "Norm";
    case "oem":
      return "Werksfreigabe";
    case "food":
      return "Lebensmitteltauglich";
    case "religious":
      return "Religiöse Zertifizierung";
    case "ecology":
      return "Umwelt / Additive";
    case "labeling":
      return "Kennzeichnung";
    case "additive":
      return "Additiv-Eigenschaft";
    default:
      return c;
  }
}

export function CertBadgeList({
  certs,
  max = 4,
  size = "sm",
}: {
  certs: string[];
  max?: number;
  size?: "xs" | "sm";
}) {
  const [expanded, setExpanded] = useState(false);
  if (certs.length === 0) return null;
  const shown = expanded ? certs : certs.slice(0, max);
  const overflow = certs.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((c, i) => (
        <CertBadge key={`${c}-${i}`} raw={c} size={size} />
      ))}
      {overflow > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
        >
          +{overflow}
        </button>
      )}
    </div>
  );
}
