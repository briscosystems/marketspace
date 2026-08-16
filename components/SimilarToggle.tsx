"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompareList } from "@/components/compare/CompareStore";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

/**
 * Schalter "Nur ähnliche Produkte" für die Marktpreise-Seite.
 *
 * Referenz sind die per Vergleich-Häkchen ausgewählten Produkte (localStorage).
 * Aktiv → schreibt deren IDs in die URL (?similar=id1,id2) — der Server filtert
 * die Liste dann auf ähnliche Produkte (gleiche Kategorie, passende ISO VG).
 * Ändert sich die Auswahl bei aktivem Schalter, zieht die URL automatisch nach.
 */
export function SimilarToggle() {
  const { t } = useLocale();
  const { ids } = useCompareList("products");
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("similar");
  const active = current != null && current.length > 0;

  function buildUrl(similar: string | null): string {
    const p = new URLSearchParams(searchParams.toString());
    if (similar) p.set("similar", similar);
    else p.delete("similar");
    const qs = p.toString();
    return qs ? `/prices?${qs}` : "/prices";
  }

  // Auswahl geändert, während der Schalter aktiv ist → URL nachziehen
  // (auch: letztes Häkchen entfernt → Schalter automatisch aus).
  useEffect(() => {
    if (!active) return;
    const want = ids.join(",");
    if (want !== current) {
      router.replace(buildUrl(want.length > 0 ? want : null), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(","), active]);

  const disabled = !active && ids.length === 0;

  return (
    <label
      className={`inline-flex items-center gap-2 text-xs ${
        disabled ? "cursor-not-allowed text-slate-300" : "cursor-pointer text-slate-600"
      }`}
      title={disabled ? t("simt.titleDisabled") : t("simt.titleEnabled")}
    >
      <input
        type="checkbox"
        checked={active}
        disabled={disabled}
        onChange={(e) =>
          router.replace(buildUrl(e.target.checked ? ids.join(",") : null), { scroll: false })
        }
        className="h-4 w-4 rounded border-slate-300 accent-brand-600 disabled:opacity-40"
      />
      <span className="inline-flex items-center gap-1 font-medium">
        <Sparkles size={13} className={active ? "text-brand-600" : "text-slate-400"} />
        {t("simt.label")}
      </span>
      {ids.length > 0 ? (
        <span className="text-slate-400">{fill(t("simt.referenz"), { n: ids.length })}</span>
      ) : null}
    </label>
  );
}
