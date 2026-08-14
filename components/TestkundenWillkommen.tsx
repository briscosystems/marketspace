"use client";

import { useState } from "react";
import { FlaskConical, Database, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Willkommensseite für Testkunden — steht vor dem Marktplatz.
 *
 * Zweite Fassung (Betreiber 2026-08-13): „Viel zu viel Text auf der
 * Einstiegsseite!" Die erste Fassung erklärte in ganzen Absätzen. Jetzt: drei
 * kurze Karten, drei Halbsätze zur Begründung, ein Knopf — alles auf einen
 * Blick, ohne Scrollen.
 *
 * Die Aussagen bleiben dieselben und sind Betreiber-Vorgabe:
 * Prototyp · noch zu wenige echte Daten · besser mit jedem Feedback ·
 * „Eintreten" bestätigt, den Zugang nicht weiterzugeben.
 *
 * Bewusst deutsch, wie die Rechtstexte.
 */
export function TestkundenWillkommen() {
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState(false);

  async function eintreten() {
    setBusy(true);
    setFehler(false);
    try {
      const res = await fetch(`${BASE_PATH}/api/testkunde-eintritt`, { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      setFehler(true);
      setBusy(false);
    }
  }

  const karten = [
    {
      icon: <FlaskConical className="h-5 w-5" />,
      titel: "Prototyp",
      text: "Noch nicht fertig — Ecken und Kanten inklusive.",
      farbe: "bg-amber-50 text-amber-900 ring-amber-200",
    },
    {
      icon: <Database className="h-5 w-5" />,
      titel: "Wenig echte Daten",
      text: "Katalog und Datenblätter sind echt. Angebote und Erfahrungen fehlen noch.",
      farbe: "bg-white text-slate-800 ring-slate-200",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      titel: "Wird mit Ihnen besser",
      text: "Jede Rückmeldung verbessert die Plattform. Kritik ausdrücklich erwünscht.",
      farbe: "bg-brand-50 text-brand-900 ring-brand-200",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="bg-graphite-900 px-6 py-8 text-white sm:px-10">
        <div className="mx-auto max-w-3xl">
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
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Willkommen, Testkunde.</h1>
          <p className="mt-2 text-white/80">
            200 Credits und ein Jahr Mitgliedschaft sind für Sie hinterlegt.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-7 sm:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {karten.map((k) => (
            <div key={k.titel} className={`rounded-xl p-4 ring-1 ${k.farbe}`}>
              <p className="flex items-center gap-2 font-bold">
                {k.icon}
                {k.titel}
              </p>
              <p className="mt-1 text-sm leading-snug">{k.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
          <p className="font-bold text-slate-900">Bitte behalten Sie den Zugang für sich.</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>· Wir müssen wissen, von wem eine Rückmeldung kommt.</li>
            <li>· Wer unvorbereitet kommt, hält den leeren Marktplatz für gescheitert.</li>
            <li>· Hier stehen Angebote und Preise anderer Betriebe.</li>
          </ul>

          {fehler && (
            <p className="mt-3 text-sm text-red-600">
              Hat nicht geklappt — bitte Seite neu laden.
            </p>
          )}

          <button
            type="button"
            onClick={eintreten}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-lift disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Eintreten
            {!busy && <ArrowRight className="h-5 w-5" />}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Mit dem Klick bestätige ich: Prototyp verstanden, Zugang gebe ich nicht weiter.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Brisco Systems GmbH · CH-8335 Hittnau ·{" "}
          <a href="mailto:jgosch@brisco.ch" className="underline">
            jgosch@brisco.ch
          </a>
        </p>
      </div>
    </div>
  );
}
