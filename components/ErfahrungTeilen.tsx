"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Mic, MicOff, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

/**
 * Praxis-Erfahrung teilen — per Text oder Diktat.
 *
 * Das Diktat nutzt die eingebaute Spracherkennung des Browsers (am Smartphone
 * die des Systems): gesprochener Text landet direkt im Feld, der Nutzer sieht
 * und korrigiert ihn VOR dem Absenden. Es wird nie Audio übertragen — nur der
 * fertige Text. Auf Browsern ohne Spracherkennung erscheint der Knopf nicht.
 *
 * Motivation nach dem belegten Muster (Punkte-Belohnung verdreifacht Beiträge):
 * Credits nach Freigabe — für jede geprüfte Erfahrung gleich, positiv wie
 * negativ. Das steht auch so dabei (Transparenzpflicht).
 */
export function ErfahrungTeilen({
  productId,
  productName,
  credits = 2,
}: {
  productId?: string;
  productName?: string;
  credits?: number;
}) {
  const { t, locale } = useLocale();
  const { status } = useSession();
  const [text, setText] = useState("");
  const [hoert, setHoert] = useState(false);
  const [kannDiktat, setKannDiktat] = useState(false);
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [warSprache, setWarSprache] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setKannDiktat(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function diktatStartStop() {
    if (hoert) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Erkennung = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Erkennung) return;
    const rec = new Erkennung();
    rec.lang = locale === "en" ? "en-US" : locale === "nl" ? "nl-NL" : "de-DE";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: SpeechResultEventLike) => {
      let neu = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) neu += e.results[i][0].transcript;
      }
      if (neu) {
        setText((alt) => (alt ? alt.trimEnd() + " " + neu.trim() : neu.trim()));
        setWarSprache(true);
      }
    };
    rec.onend = () => setHoert(false);
    rec.onerror = () => setHoert(false);
    recRef.current = rec;
    setHoert(true);
    rec.start();
  }

  async function senden() {
    setLaedt(true);
    setFehler(null);
    try {
      const res = await fetch(withBasePath("/api/erfahrungen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          text,
          source: warSprache ? "VOICE" : "TEXT",
        }),
      });
      const daten = await res.json();
      if (!res.ok) {
        setFehler(daten?.error ?? t("erf.fehler"));
        return;
      }
      setGesendet(true);
    } finally {
      setLaedt(false);
    }
  }

  if (gesendet) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <span>{fill(t("erf.danke"), { n: credits })}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-slate-900">
          {productName ? fill(t("erf.titelProdukt"), { p: productName }) : t("erf.titel")}
        </h3>
        <span className="chip bg-brand-50 text-brand-800 ring-1 ring-brand-200">
          <Sparkles size={11} /> {fill(t("erf.belohnung"), { n: credits })}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{t("erf.hinweis")}</p>

      {status !== "authenticated" ? (
        <p className="mt-3 text-sm text-slate-600">
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            {t("erf.anmelden")}
          </Link>
        </p>
      ) : (
        <>
          <div className="relative mt-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={t("erf.platzhalter")}
              className="input min-h-[6rem] pr-12"
            />
            {kannDiktat && (
              <button
                type="button"
                onClick={diktatStartStop}
                title={hoert ? t("erf.diktatStopp") : t("erf.diktat")}
                aria-label={hoert ? t("erf.diktatStopp") : t("erf.diktat")}
                className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full transition ${
                  hoert
                    ? "animate-pulse bg-red-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-800"
                }`}
              >
                {hoert ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>
          {hoert && <p className="mt-1 text-xs font-medium text-red-600">{t("erf.hoert")}</p>}
          {fehler && <p className="mt-1 text-xs text-red-600">{fehler}</p>}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">{t("erf.fair")}</span>
            <button
              type="button"
              onClick={senden}
              disabled={laedt || text.trim().length < 40}
              className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={14} /> {laedt ? t("erf.sendet") : t("erf.senden")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechResultEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
};
