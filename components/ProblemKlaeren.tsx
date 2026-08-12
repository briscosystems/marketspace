"use client";

import { useState, useEffect } from "react";
import { Loader2, FileUp, X, TriangleAlert, CheckCircle2, HelpCircle } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Katalogtreffer = {
  id: string;
  name: string;
  hersteller: string;
};

type Ursache = {
  ursache: string;
  sicherheit: "hoch" | "mittel" | "gering";
  begruendung: string;
  pruefschritt: string;
};

type Ergebnis = {
  id: string;
  keineKi?: boolean;
  hinweis?: string | null;
  verdict?: "EINGEGRENZT" | "UNKLAR";
  moeglicheUrsachen?: Ursache[];
  fehlendeAngaben?: string[];
  sofortmassnahmen?: string[];
  zusammenfassung?: string;
};

/**
 * Problem klären — der Anwender legt alles bei, was er hat.
 *
 * Betreiber 2026-08-12: Die Problemlösung geht weiter als ein Foto. Text,
 * Datenblatt, Sicherheitsdatenblatt, Laborbericht, Forenbeitrag und die
 * Erfahrungen anderer gehören dazu. Die Plattform speichert alles; die KI
 * grenzt ein — und **rät nicht**: Was sie nicht belegen kann, geht an die
 * manuelle Prüfung.
 */
export function ProblemKlaeren() {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [maschine, setMaschine] = useState("");
  const [produktSuche, setProduktSuche] = useState("");
  const [treffer, setTreffer] = useState<Katalogtreffer[]>([]);
  const [produkt, setProdukt] = useState<Katalogtreffer | null>(null);
  const [links, setLinks] = useState("");
  const [dateien, setDateien] = useState<{ name: string; data: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);

  // Produktsuche im Katalog — dieselbe Quelle wie beim Angebot.
  useEffect(() => {
    if (produkt || produktSuche.trim().length < 2) {
      setTreffer([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/produkt-suche?q=${encodeURIComponent(produktSuche.trim())}`);
        const data = await res.json();
        setTreffer(data.treffer ?? []);
      } catch {
        setTreffer([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [produktSuche, produkt]);

  async function dateiLesen(e: React.ChangeEvent<HTMLInputElement>) {
    const liste = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const datei of liste) {
      if (dateien.length >= 8) break;
      if (datei.size > 5 * 1024 * 1024) {
        setFehler(t("pk.tooBig"));
        continue;
      }
      const data = await new Promise<string>((auf) => {
        const leser = new FileReader();
        leser.onload = () => auf(String(leser.result));
        leser.readAsDataURL(datei);
      });
      setDateien((alt) => (alt.length >= 8 ? alt : [...alt, { name: datei.name, data }]));
    }
  }

  async function senden() {
    setBusy(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const res = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          productId: produkt?.id,
          productFreetext: produkt ? undefined : produktSuche.trim() || undefined,
          machine: maschine.trim() || undefined,
          links: links
            .split(/[\n,;]+/)
            .map((l) => l.trim())
            .filter(Boolean),
          dateien,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("pk.errGeneric"));
      setErgebnis(data);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("pk.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  const bereit = text.trim().length >= 30 && !busy;

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-900">{t("pk.title")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("pk.intro")}</p>

        <div>
          <label className="label">{t("pk.textLabel")}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder={t("pk.textPlaceholder")}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">{t("pk.textHint")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <label className="label">{t("pk.productLabel")}</label>
            <input
              type="text"
              value={produkt ? `${produkt.hersteller} ${produkt.name}` : produktSuche}
              onChange={(e) => {
                setProdukt(null);
                setProduktSuche(e.target.value);
              }}
              placeholder={t("pk.productPlaceholder")}
              className="input"
            />
            {treffer.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-slate-200">
                {treffer.map((k) => (
                  <li key={k.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setProdukt(k);
                        setTreffer([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{k.name}</span>{" "}
                      <span className="text-slate-500">{k.hersteller}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="label">{t("pk.machineLabel")}</label>
            <input
              type="text"
              value={maschine}
              onChange={(e) => setMaschine(e.target.value)}
              placeholder={t("pk.machinePlaceholder")}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">{t("pk.filesLabel")}</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200">
            <FileUp className="h-4 w-4" />
            {t("pk.filesAdd")}
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={dateiLesen}
              className="hidden"
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">{t("pk.filesHint")}</p>
          {dateien.length > 0 && (
            <ul className="mt-2 space-y-1">
              {dateien.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700"
                >
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setDateien(dateien.filter((_, j) => j !== i))}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    aria-label={t("pk.fileRemove")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label">{t("pk.linksLabel")}</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={2}
            placeholder={t("pk.linksPlaceholder")}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">{t("pk.linksHint")}</p>
        </div>

        {fehler && <p className="text-sm text-red-600">{fehler}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={senden}
            disabled={!bereit}
            className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("pk.submit")}
          </button>
          <span className="chip bg-brand-50 text-brand-800">{t("pk.cost")}</span>
        </div>
        <p className="text-xs text-slate-500">{t("pk.noGuess")}</p>
      </section>

      {ergebnis && (
        <section className="card space-y-4">
          {ergebnis.keineKi ? (
            <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">{ergebnis.hinweis}</p>
          ) : (
            <>
              <div
                className={`rounded-xl p-4 ring-1 ${
                  ergebnis.verdict === "EINGEGRENZT"
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : "bg-amber-50 text-amber-900 ring-amber-200"
                }`}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {ergebnis.verdict === "EINGEGRENZT" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <TriangleAlert className="h-5 w-5" />
                  )}
                  {ergebnis.verdict === "EINGEGRENZT" ? t("pk.narrowed") : t("pk.unclear")}
                </p>
                {ergebnis.zusammenfassung && <p className="mt-1 text-sm">{ergebnis.zusammenfassung}</p>}
              </div>

              {(ergebnis.moeglicheUrsachen ?? []).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">{t("pk.causes")}</h3>
                  {(ergebnis.moeglicheUrsachen ?? []).map((u, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        {u.ursache}
                        <span className="chip bg-white text-slate-600">{t(`pk.conf.${u.sicherheit}`)}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{u.begruendung}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">→ {u.pruefschritt}</p>
                    </div>
                  ))}
                </div>
              )}

              {(ergebnis.sofortmassnahmen ?? []).length > 0 && (
                <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-200">
                  <p className="text-sm font-semibold text-blue-900">{t("pk.now")}</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-blue-900">
                    {(ergebnis.sofortmassnahmen ?? []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(ergebnis.fehlendeAngaben ?? []).length > 0 && (
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-800">{t("pk.missing")}</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                    {(ergebnis.fehlendeAngaben ?? []).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-500">{t("pk.saved")}</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
