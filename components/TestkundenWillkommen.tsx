"use client";

import { useState } from "react";
import {
  Sparkles,
  Wrench,
  MessagesSquare,
  ArrowRight,
  Loader2,
  Info,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { OilBarrels } from "@/components/OilBarrels";

/**
 * Willkommensseite für Testkunden — steht vor dem Marktplatz.
 *
 * Dritte Fassung (Betreiber 2026-08-13): „Das ist überhaupt nicht motivierend
 * und einladend … Der Text muss klar und deutlich sein, nicht zu viel und
 * nicht zu wenig."
 *
 * Gelernt: Die zweite Fassung war kurz, aber sie führte mit lauter Einschränkungen
 * („Prototyp", „wenig Daten", „behalten Sie es für sich"). Jetzt steht vorn,
 * was der Testkunde bekommt und bewirken kann; die Ehrlichkeit über den
 * Aufbaustand bleibt — als EIN klarer Satz, nicht als Entschuldigung in drei
 * Kästen. Die Zusage zur Vertraulichkeit steht knapp beim Knopf.
 *
 * Betreiber-Vorgaben, die drinbleiben müssen: Prototyp benennen · noch wenige
 * echte Daten · wird besser mit jedem Feedback · „Eintreten" bestätigt, den
 * Zugang nicht weiterzugeben.
 *
 * Bewusst deutsch, wie die Rechtstexte.
 */
export function TestkundenWillkommen() {
  const [busy, setBusy] = useState(false);
  const [passwort, setPasswort] = useState("");
  // Passwort im Klartext prüfen können (Betreiber 2026-08-18) — gerade auf dem
  // Handy vertippt man sich sonst und weiß nicht, woran es lag.
  const [sichtbar, setSichtbar] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  // Einfacher Test-Login (Betreiber 2026-08-15): ein fixes Passwort für alle
  // Testkunden. Geprüft wird auf dem Server — hier steht es nirgends.
  async function eintreten(e?: React.FormEvent) {
    e?.preventDefault();
    if (!passwort.trim() || busy) return;
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/testkunde-eintritt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwort }),
      });
      if (res.status === 401) {
        setFehler("Falsches Passwort — bitte prüfen Sie Ihre Einladung.");
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      setFehler("Hat nicht geklappt — bitte Seite neu laden.");
      setBusy(false);
    }
  }

  const karten = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      titel: "Alles frei für Sie",
      text: "200 KI-Credits und ein Jahr Mitgliedschaft geschenkt. Keine Karte, keine Provision.",
      farbe: "bg-brand-50 text-brand-900 ring-brand-200",
    },
    {
      icon: <Wrench className="h-5 w-5" />,
      titel: "Sofort nutzbar",
      text: "Problem per Foto und Laborbericht klären, Alternativen finden, Tanks überwachen.",
      farbe: "bg-white text-slate-800 ring-slate-200",
    },
    {
      icon: <MessagesSquare className="h-5 w-5" />,
      titel: "Sie bauen mit",
      text: "Ihre Rückmeldung ändert die Plattform — oft noch am selben Tag.",
      farbe: "bg-amber-50 text-amber-900 ring-amber-200",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="relative overflow-hidden bg-graphite-900 px-6 py-9 text-white sm:px-10">
        <span className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/brisco-systems-logo-light.svg`}
              alt="BRISCO Systems"
              className="h-7 w-auto"
            />
            <span className="text-sm font-medium text-white/60">Marketplace</span>
            <span className="ml-auto rounded-full bg-brand-400 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-graphite-900">
              Testbetrieb
            </span>
          </div>
          <div className="mt-5 flex items-end gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                Sie sind einer der Ersten.
              </h1>
              <p className="mt-2 max-w-xl text-white/85">
                Den richtigen Kühlschmierstoff finden, Probleme klären, faire Preise sehen —
                herstellerunabhängig. Und gerade jetzt, wo Lieferengpässe den Einkauf ausbremsen:
                Ersatzprodukt und Bezugsquelle in Minuten statt Wochen. Sie testen das vor allen
                anderen — und bestimmen mit, wie es wird.
              </p>
            </div>
            {/* Auflockerung: die Haus-Grafik mit dem Lime-Fass — kein Stockfoto. */}
            <OilBarrels className="hidden h-28 w-auto shrink-0 sm:block" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-7 sm:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {karten.map((k) => (
            <div key={k.titel} className={`rounded-xl p-4 shadow-soft ring-1 ${k.farbe}`}>
              <p className="flex items-center gap-2 font-bold">
                {k.icon}
                {k.titel}
              </p>
              <p className="mt-1 text-sm leading-snug">{k.text}</p>
            </div>
          ))}
        </div>

        {/* Aufbaustand als sachlicher Hinweis (Betreiber 2026-08-14):
            trainiert aus vielen Quellen, aber noch nicht vollständig —
            und mit jeder Interaktion besser. */}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            <strong>Hinweis:</strong> Wir haben die Plattform mit Informationen aus vielen Quellen
            trainiert — Datenblätter, Sicherheitsdatenblätter, Herstellerseiten, Fachforen.
            Einzelne Angaben können trotzdem noch fehlen oder noch nicht eingearbeitet sein. Mit
            jeder Interaktion wird die Plattform besser.
          </span>
        </p>

        <div className="mt-5 rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
          <form onSubmit={eintreten} className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-0 flex-1 sm:max-w-xs">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={sichtbar ? "text" : "password"}
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder="Passwort aus Ihrer Einladung"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-11 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={() => setSichtbar(!sichtbar)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={sichtbar ? "Passwort verbergen" : "Passwort anzeigen"}
                title={sichtbar ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {sichtbar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </label>
            <button
              type="submit"
              disabled={busy || !passwort.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-base font-bold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-lift disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Eintreten
              {!busy && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
          {fehler && <p className="mt-3 text-sm font-medium text-red-600">{fehler}</p>}
          <p className="mt-3 text-sm text-slate-600">
            Mit dem Eintreten bestätigen Sie, Passwort und Zugang während der Testphase{" "}
            <strong>für sich zu behalten</strong> — hier stehen Angebote und Preise anderer
            Betriebe, und wir wollen wissen, von wem eine Rückmeldung kommt.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Jemand, der dabei sein sollte? Schreiben Sie uns, wir laden ihn ein ·{" "}
          <a href="mailto:jgosch@brisco.ch" className="underline">
            jgosch@brisco.ch
          </a>
        </p>
      </div>
    </div>
  );
}
