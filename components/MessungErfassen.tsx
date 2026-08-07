"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/** Minimaler Typ für die Browser-Spracherkennung (nicht in den DOM-Typen). */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function MessungErfassen({
  tankId,
  refraktometerFaktor,
  istQr = false,
  token,
}: {
  tankId: string;
  refraktometerFaktor: number | null;
  istQr?: boolean;
  /** Schlüssel aus dem QR-Code — erlaubt das Eintragen ohne Anmeldung. */
  token?: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [brix, setBrix] = useState("");
  const [ph, setPh] = useState("");
  const [nitrit, setNitrit] = useState("");
  const [keime, setKeime] = useState("");
  const [note, setNote] = useState("");

  const [hoert, setHoert] = useState(false);
  const [warSprache, setWarSprache] = useState(false);
  const erkennung = useRef<SpeechRecognitionLike | null>(null);

  const zahl = (s: string): number | null => {
    const n = Number(s.replace(",", "."));
    return s.trim() === "" || Number.isNaN(n) ? null : n;
  };

  const brixZahl = zahl(brix);
  const vorschau =
    brixZahl != null && refraktometerFaktor != null
      ? Math.round(brixZahl * refraktometerFaktor * 10) / 10
      : null;

  function diktatUmschalten() {
    if (hoert) {
      erkennung.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const r = new Ctor();
    r.lang = locale === "en" ? "en-US" : locale === "nl" ? "nl-NL" : "de-DE";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let neu = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) neu += e.results[i][0].transcript;
      }
      if (neu) {
        setNote((alt) => (alt ? alt + " " : "") + neu.trim());
        setWarSprache(true);
      }
    };
    r.onend = () => setHoert(false);
    r.onerror = () => setHoert(false);
    erkennung.current = r;
    r.start();
    setHoert(true);
  }

  const kannDiktieren =
    typeof window !== "undefined" &&
    !!((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/tanks/${tankId}/messungen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brix: zahl(brix),
          ph: zahl(ph),
          nitritePpm: zahl(nitrit),
          bacteria: keime || null,
          note: note || null,
          source: warSprache ? "VOICE" : istQr ? "QR" : "WEB",
          token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("tank.errSave"));
      setBrix("");
      setPh("");
      setNitrit("");
      setKeime("");
      setNote("");
      setWarSprache(false);
      setOk(true);
      router.refresh();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("tank.errSave"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={speichern} className="card space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t("tank.newMeasurement")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-brix" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.mBrix")}
          </label>
          <input
            id="m-brix"
            inputMode="decimal"
            value={brix}
            onChange={(e) => setBrix(e.target.value)}
            placeholder="4,5"
            className="input"
          />
          {vorschau != null && (
            <p className="mt-1 text-xs text-emerald-700">
              {t("tank.mBrixCalc")} <strong>{vorschau.toString().replace(".", ",")} %</strong>
            </p>
          )}
          {brixZahl != null && refraktometerFaktor == null && (
            <p className="mt-1 text-xs text-slate-500">{t("tank.mNoFactor")}</p>
          )}
        </div>
        <div>
          <label htmlFor="m-ph" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.mPh")}
          </label>
          <input
            id="m-ph"
            inputMode="decimal"
            value={ph}
            onChange={(e) => setPh(e.target.value)}
            placeholder="9,2"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="m-nitrit" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.mNitrite")}
          </label>
          <input
            id="m-nitrit"
            inputMode="decimal"
            value={nitrit}
            onChange={(e) => setNitrit(e.target.value)}
            placeholder="0"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="m-keime" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.mBacteria")}
          </label>
          <select id="m-keime" value={keime} onChange={(e) => setKeime(e.target.value)} className="input">
            <option value="">{t("tank.mNotMeasured")}</option>
            <option value="NONE">{t("tank.bactNone")}</option>
            <option value="LOW">{t("tank.bactLow")}</option>
            <option value="MEDIUM">{t("tank.bactMedium")}</option>
            <option value="HIGH">{t("tank.bactHigh")}</option>
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="m-note" className="block text-sm font-medium text-slate-700">
            {t("tank.mNote")}
          </label>
          {kannDiktieren && (
            <button
              type="button"
              onClick={diktatUmschalten}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                hoert ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {hoert ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {hoert ? t("tank.dictStop") : t("tank.dictStart")}
            </button>
          )}
        </div>
        <textarea
          id="m-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("tank.mNotePh")}
          className="input"
        />
      </div>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {ok && <p className="text-sm text-emerald-700">{t("tank.saved")}</p>}

      <button type="submit" disabled={busy} className="btn-primary inline-flex items-center gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("tank.saveMeasurement")}
      </button>
    </form>
  );
}
