"use client";

import { useState } from "react";
import {
  FlaskConical,
  Database,
  TrendingUp,
  Lock,
  ArrowRight,
  Loader2,
  Gift,
} from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Willkommensseite für Testkunden — steht vor dem Marktplatz.
 *
 * Bewusst deutsch (wie die Rechtstexte): Das Testkunden-Programm läuft im
 * deutschsprachigen Raum, und der Text muss unmissverständlich sein.
 *
 * Inhalt nach Betreiber-Vorgabe 2026-08-13:
 *  1. Willkommen, Sie sind Testkunde.
 *  2. **Ehrlich sagen, dass dies ein Prototyp ist** und noch zu wenige ECHTE
 *     Daten im System stehen.
 *  3. Dass die Plattform mit jedem Feedback besser wird.
 *  4. Knopf „Eintreten" — damit bestätigt der Testkunde, den Zugang während
 *     der Testphase nicht weiterzugeben. Mit Begründung, nicht als Floskel.
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Kopf im Haus-Dunkelgrau, wie die gedruckte Testkunden-Information */}
      <div className="bg-graphite-900 px-6 py-10 text-white sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/brisco-systems-logo-light.svg`}
              alt="BRISCO Systems"
              className="h-8 w-auto"
            />
            <span className="text-sm font-medium text-white/60">Marketplace</span>
          </div>
          <span className="mt-6 inline-block rounded-full bg-brand-400 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-graphite-900">
            Testbetrieb 2026
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Willkommen, Testkunde.
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Sie gehören zu einer kleinen Zahl von Betrieben und Händlern, die Brisco Marketplace
            vor allen anderen benutzen dürfen — die herstellerunabhängige Plattform für
            Kühlschmierstoffe, Industrieöle und Schmierstoffe. Bevor Sie eintreten, drei Dinge,
            die Sie wissen sollten.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-6 py-8 sm:px-10">
        {/* 1. Prototyp */}
        <section className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <FlaskConical className="h-5 w-5" />
            Das hier ist ein Prototyp.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950">
            Kein fertiges Produkt. Sie werden Ecken finden, an denen etwas fehlt, hakt oder
            unfertig aussieht. Genau deshalb sind Sie hier: Wir wollen das erfahren, bevor die
            Plattform öffentlich wird — nicht danach.
          </p>
        </section>

        {/* 2. Zu wenig echte Daten */}
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Database className="h-5 w-5 text-slate-500" />
            Es sind noch zu wenige echte Daten im System.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Der Produktkatalog mit über tausend Produkten, die Sicherheitsdatenblätter und die
            Beständigkeits-Angaben sind <strong>echt und belegt</strong>. Was noch fehlt, ist das
            Leben darin: <strong>echte Angebote, echte Preise, echte Erfahrungsberichte</strong>{" "}
            aus Betrieben. Der Marktplatz ist praktisch leer, weil er gerade erst öffnet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Rechnen Sie also nicht damit, heute für jedes Produkt drei Angebote zu finden. Was Sie
            heute sehen, ist das Werkzeug — nicht der volle Markt.
          </p>
        </section>

        {/* 3. Feedback macht es besser */}
        <section className="rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
            <TrendingUp className="h-5 w-5" />
            Jede Rückmeldung macht die Plattform besser.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-900">
            Das ist keine Höflichkeitsfloskel, sondern die Funktionsweise: Jeder
            Erfahrungsbericht, jedes gemeldete Problem, jede Korrektur an einem Datenblatt und
            jedes eingestellte Angebot verbessert die Antworten für alle — auch für Sie selbst,
            beim nächsten Mal. Eine Plattform über Kühlschmierstoffe ist genau so gut wie die
            Praxis, die darin steht.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-900">
            <strong>Kritik ist ausdrücklich erwünscht.</strong> Was Ihnen nicht passt, was Sie
            nicht finden, was falsch ist: bitte melden. Lob hilft uns weniger als ein klarer
            Einwand.
          </p>
        </section>

        {/* Goodie kurz */}
        <section className="flex items-start gap-3 rounded-2xl bg-white p-5 text-sm text-slate-700 shadow-soft ring-1 ring-slate-200">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p>
            Als Testkunde erhalten Sie <strong>200 KI-Credits</strong> und{" "}
            <strong>ein Jahr Mitgliedschaft kostenlos</strong> — ohne Kreditkarte, ohne
            automatische Verlängerung. Auf Ihre Geschäfte nehmen wir keine Provision.
          </p>
        </section>

        {/* Bestätigung + Begründung */}
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Lock className="h-5 w-5 text-slate-500" />
            Bitte behalten Sie diesen Zugang für sich.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Mit „Eintreten" bestätigen Sie, dass Sie diesen Link während der Testphase{" "}
            <strong>nicht an weitere Personen weitergeben</strong>. Warum wir darauf bestehen:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                <strong>Wir müssen wissen, wessen Rückmeldung wir vor uns haben.</strong> Ein
                Hinweis aus einer Schleiferei wiegt anders als einer aus dem Handel. Bei einem
                weitergereichten Link wissen wir das nicht mehr.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                <strong>Ein unvorbereiteter Besucher urteilt über etwas, das es noch nicht
                gibt.</strong> Wer ohne diese Erklärung auf einen halbleeren Marktplatz stößt,
                hält ihn für gescheitert — und erzählt das weiter. Dieser Eindruck lässt sich
                später kaum korrigieren.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                <strong>Hier stehen Geschäftsdaten anderer Teilnehmer.</strong> Angebote, Mengen
                und Preis-Richtwerte gehören den Betrieben, die sie eingestellt haben. Ein
                weitergegebener Link öffnet sie Unbeteiligten — auch dem Wettbewerb.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                <strong>In der Testphase sind die Regeln noch nicht endgültig.</strong> AGB,
                Datenschutzerklärung und Abläufe werden gerade geprüft. Solange das läuft, soll
                der Teilnehmerkreis überschaubar und namentlich bekannt bleiben.
              </span>
            </li>
          </ul>

          <p className="mt-4 text-sm text-slate-600">
            Sie kennen jemanden, der dabei sein sollte? Sehr gern — schreiben Sie uns an{" "}
            <a href="mailto:jgosch@brisco.ch" className="font-medium text-brand-700 underline">
              jgosch@brisco.ch
            </a>
            , dann laden wir ihn selbst ein.
          </p>

          {fehler && (
            <p className="mt-4 text-sm text-red-600">
              Das hat nicht geklappt. Bitte laden Sie die Seite neu und versuchen Sie es noch
              einmal.
            </p>
          )}

          <button
            type="button"
            onClick={eintreten}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-lift disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Eintreten
            {!busy && <ArrowRight className="h-5 w-5" />}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Mit dem Klick bestätige ich: Ich weiß, dass dies ein Prototyp mit noch wenigen echten
            Daten ist, und ich gebe den Zugang während der Testphase nicht weiter.
          </p>
        </section>

        <p className="pb-4 text-center text-xs text-slate-500">
          Brisco Systems GmbH · Huebacherweg 27 · CH-8335 Hittnau · markt.brisco.ch
        </p>
      </div>
    </div>
  );
}
