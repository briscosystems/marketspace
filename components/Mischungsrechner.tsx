"use client";

import { useState } from "react";
import { Calculator, Droplet, TriangleAlert } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";
import { berechneMischung } from "@/lib/mischungsrechner";
import { QrTankScanner } from "@/components/QrTankScanner";

/**
 * Mischungsrechner: „Was muss ich jetzt reinkippen?"
 *
 * Am Tank sind Füllmenge, Sollkonzentration und die letzte Messung schon
 * bekannt — die Felder kommen deshalb vorbelegt. Gefragt wird nur noch, wie
 * viel fehlt.
 */
export function Mischungsrechner({
  tankVolumen,
  sollMin,
  sollMax,
  istKonzentration,
  kompakt = false,
}: {
  tankVolumen?: number | null;
  sollMin?: number | null;
  sollMax?: number | null;
  istKonzentration?: number | null;
  /** Ohne eigene Karten-Umrandung einbetten. */
  kompakt?: boolean;
}) {
  const { t } = useLocale();

  const zielVorgabe =
    sollMin != null && sollMax != null ? (sollMin + sollMax) / 2 : sollMin ?? sollMax ?? null;

  const [volumen, setVolumen] = useState(tankVolumen != null ? String(tankVolumen) : "");
  const [soll, setSoll] = useState(zielVorgabe != null ? String(zielVorgabe) : "");
  const [fehl, setFehl] = useState("");
  const [ist, setIst] = useState(istKonzentration != null ? String(istKonzentration) : "");

  const zahl = (s: string): number => Number(s.replace(",", "."));
  const vollstaendig =
    volumen.trim() !== "" && soll.trim() !== "" && fehl.trim() !== "" && ist.trim() !== "";

  const ergebnis = vollstaendig
    ? berechneMischung({
        tankVolumenL: zahl(volumen),
        sollProzent: zahl(soll),
        fehlVolumenL: zahl(fehl),
        istProzent: zahl(ist),
      })
    : null;

  const komma = (n: number) => n.toString().replace(".", ",");

  const inhalt = (
    <>
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-brand-600" />
        <h2 className="text-lg font-semibold text-slate-900">{t("mix.title")}</h2>
      </div>
      <p className="text-sm text-slate-600">{t("mix.intro")}</p>

      {/* Tank per QR-Code wählen: der Aufkleber kennt das Gesamtvolumen
          (Betreiber 2026-08-17). Nur zeigen, wenn nicht ohnehin am Tank. */}
      {tankVolumen == null && (
        <div className="flex flex-wrap items-center gap-2">
          <QrTankScanner kompakt />
          <span className="text-xs text-slate-500">{t("mix.qrHint")}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="mix-vol" className="mb-1 block text-sm font-medium text-slate-700">
            {t("mix.fVolume")}
          </label>
          <input
            id="mix-vol"
            inputMode="decimal"
            value={volumen}
            onChange={(e) => setVolumen(e.target.value)}
            placeholder="400"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="mix-fehl" className="mb-1 block text-sm font-medium text-slate-700">
            {t("mix.fMissing")}
          </label>
          <input
            id="mix-fehl"
            inputMode="decimal"
            value={fehl}
            onChange={(e) => setFehl(e.target.value)}
            placeholder="80"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="mix-soll" className="mb-1 block text-sm font-medium text-slate-700">
            {t("mix.fTarget")}
          </label>
          <input
            id="mix-soll"
            inputMode="decimal"
            value={soll}
            onChange={(e) => setSoll(e.target.value)}
            placeholder="7"
            className="input"
          />
          {sollMin != null && sollMax != null && (
            <p className="mt-1 text-xs text-slate-500">
              {fill(t("mix.fTargetHint"), { min: komma(sollMin), max: komma(sollMax) })}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="mix-ist" className="mb-1 block text-sm font-medium text-slate-700">
            {t("mix.fCurrent")}
          </label>
          <input
            id="mix-ist"
            inputMode="decimal"
            value={ist}
            onChange={(e) => setIst(e.target.value)}
            placeholder="5"
            className="input"
          />
        </div>
      </div>

      {ergebnis?.ok && (
        <div className="space-y-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Droplet className="h-3.5 w-3.5" />
                {t("mix.water")}
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {komma(ergebnis.wasserL)} <span className="text-base font-medium">l</span>
              </div>
            </div>
            <div className="rounded-lg bg-white/70 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("mix.concentrate")}
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {komma(ergebnis.konzentratL)} <span className="text-base font-medium">l</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-emerald-900">
            {fill(t("mix.resultLine"), {
              nachfuell: komma(ergebnis.nachfuellProzent),
              ergebnis: komma(ergebnis.ergebnisProzent),
            })}
          </p>
          <p className="flex items-start gap-1.5 rounded-lg bg-amber-100 p-2.5 text-sm font-medium text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t("mix.waterFirst")}
          </p>
        </div>
      )}

      {ergebnis && !ergebnis.ok && ergebnis.grund === "zu_mager" && (
        <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-medium">{t("mix.tooLeanTitle")}</p>
          <p>
            {fill(t("mix.tooLeanText"), {
              maximal: komma(ergebnis.maximalProzent ?? 0),
              empfehlung: komma(ergebnis.empfehlungProzent ?? 0),
            })}
          </p>
        </div>
      )}

      {ergebnis && !ergebnis.ok && ergebnis.grund === "zu_fett" && (
        <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
          {fill(t("mix.tooRichText"), { maximal: komma(ergebnis.maximalProzent ?? 0) })}
        </div>
      )}

      {ergebnis && !ergebnis.ok && ergebnis.grund === "eingabe" && (
        <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">{t("mix.badInput")}</div>
      )}
    </>
  );

  return kompakt ? <div className="space-y-4">{inhalt}</div> : <section className="card space-y-4">{inhalt}</section>;
}
