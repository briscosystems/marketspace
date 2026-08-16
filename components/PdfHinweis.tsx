import { AlertCircle } from "lucide-react";
import { getT } from "@/lib/i18n-server";

/**
 * Herkunfts- und Haftungshinweis für Datenblätter (Betreiber 2026-08-15):
 * „Mach einen Disclaimer überall, wo der Kunde ein PDF herunterladen kann."
 *
 * Steht sichtbar an JEDER Stelle, an der ein PDF geöffnet oder geladen werden
 * kann — nicht nur in den AGB (dort steht die ausführliche Klausel unter
 * „Dokumente Dritter", mit der dieser Text bewusst wortgleich argumentiert).
 *
 * Rechtlich beachtet:
 *  - KEIN pauschaler Haftungsausschluss („wir haften nie") — der wäre nach
 *    Art. 100 OR/§ 309 BGB unwirksam. Stattdessen: „soweit gesetzlich
 *    zulässig", zwingende Haftung bleibt unberührt.
 *  - Verweis auf das maßgebliche Original beim Hersteller/Lieferanten — bei
 *    Sicherheitsdatenblättern entscheidend, weil Fassungen veralten.
 *  - Übernahme-/Prüfpflicht des Nutzers wird ausdrücklich benannt.
 */
export async function PdfHinweis({ className = "" }: { className?: string }) {
  const t = await getT();
  return (
    <p
      className={`flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{t("pdf.disclaimer")}</span>
    </p>
  );
}
