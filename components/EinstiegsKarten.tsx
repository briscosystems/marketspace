/**
 * Die vier Einstiege der Plattform — jetzt als farbige Bereiche mit den
 * konkreten Handlungen darin.
 *
 * Betreiber 2026-08-12: „Die Funktionen sind immer noch zu verwirrend. Viel zu
 * viele. Der User weiss gar nicht, was er alles machen kann. Die Kacheln müssen
 * viel besser präsentiert werden. Eventuell mit Farben hinterlegt."
 *
 * Was die Recherche zu Dashboards sagt (Eleken, UX Collective, Pencil & Paper):
 * nicht weniger zeigen, sondern **nach Absicht gruppieren**, Farbe **als
 * Kategorie-Kennung** einsetzen (sparsam, mit Bedeutung) und die häufigen
 * Handlungen direkt erreichbar machen, statt sie hinter einer Kachel zu
 * verstecken. Genau das ist hier umgesetzt:
 *
 *  - VIER farbige Bereiche statt vier weißer Kacheln — die Farbe sagt, worum
 *    es geht: rot = Problem, amber = Suchen, blau = Anbieten, grün = Marke.
 *    (amber/blau ist Hausregel: „Suchen" amber, „Anbieten" blau.)
 *  - In jedem Bereich stehen die **konkreten Handlungen** als Zeilen. Man sieht
 *    ohne Klick, was möglich ist.
 *  - Darunter eine ruhige Zeile zum **Nachschlagen** (Wissen, Datenblätter,
 *    Preise, Hersteller, Beständigkeiten) — vorhanden, aber nicht laut.
 *
 * Reihenfolge nach Zielgruppengröße (Entscheidung 2026-08-10): Instandhaltung
 * und Einkauf zuerst, Reseller und Hersteller danach.
 *
 * Steht bewusst auf BEIDEN Startseiten und auf /dashboard.
 */
import Link from "next/link";
import { OilBarrels, SearchCanister } from "@/components/OilBarrels";
import { Building2, ArrowRight, BookOpen } from "lucide-react";
import { BrainQuestion } from "@/components/ProblemIcon";

type Aktion = { href: string; text: string };

type Bereich = {
  href: string;
  titel: string;
  symbol: React.ReactNode;
  aktionen: Aktion[];
  /** Farbklassen wörtlich — Tailwind baut nur, was im Quelltext steht. */
  karte: string;
  symbolFeld: string;
  titelFarbe: string;
  linkFarbe: string;
};

export function EinstiegsKarten({
  t,
  angemeldet = false,
  markeHref,
}: {
  t: (k: string) => string;
  /** Angemeldete landen nicht auf der Registrierung. */
  angemeldet?: boolean;
  /** Ziel der Marken-Kachel: eigenes Schaufenster, sonst die Marke-Stufe. */
  markeHref?: string;
}) {
  const markeZiel = markeHref ?? (angemeldet ? "/mitgliedschaft#marke" : "/register");

  const bereiche: Bereich[] = [
    {
      href: "/erkennen",
      titel: t("home.groupProblemTitle"),
      symbol: <BrainQuestion className="h-10 w-10" />,
      aktionen: [
        { href: "/erkennen", text: t("ek.problem1") },
        { href: "/erkennen#etikett", text: t("ek.problem2") },
        { href: "/tanks", text: t("ek.problem3") },
      ],
      karte: "bg-rose-50 ring-rose-200 hover:ring-rose-400",
      symbolFeld: "bg-white text-rose-600 ring-1 ring-rose-200",
      titelFarbe: "text-rose-950",
      linkFarbe: "text-rose-900 hover:bg-rose-100",
    },
    {
      href: "/kss-finder",
      titel: t("home.groupBuyerTitle"),
      symbol: <SearchCanister className="h-14 w-auto" />,
      aktionen: [
        { href: "/kss-finder", text: t("ek.suchen1") },
        { href: "/listings", text: t("ek.suchen2") },
        { href: "/rfqs/new", text: t("ek.suchen3") },
      ],
      karte: "bg-amber-50 ring-amber-200 hover:ring-amber-400",
      symbolFeld: "",
      titelFarbe: "text-amber-950",
      linkFarbe: "text-amber-900 hover:bg-amber-100",
    },
    {
      href: "/listings/new",
      titel: t("home.groupResellerTitle"),
      symbol: <OilBarrels className="h-14 w-auto" />,
      aktionen: [
        { href: "/listings/new", text: t("ek.anbieten1") },
        { href: "/rfqs", text: t("ek.anbieten2") },
        { href: "/#mein-bereich", text: t("ek.anbieten3") },
      ],
      karte: "bg-blue-50 ring-blue-200 hover:ring-blue-400",
      symbolFeld: "",
      titelFarbe: "text-blue-950",
      linkFarbe: "text-blue-900 hover:bg-blue-100",
    },
    {
      href: markeZiel,
      titel: t("home.groupMfrTitle"),
      symbol: <Building2 className="h-9 w-9" />,
      aktionen: [
        { href: markeZiel, text: t("ek.marke1") },
        { href: "/manufacturers", text: t("ek.marke2") },
        { href: "/werbung", text: t("ek.marke3") },
      ],
      karte: "bg-brand-50 ring-brand-200 hover:ring-brand-400",
      symbolFeld: "bg-white text-brand-700 ring-1 ring-brand-200",
      titelFarbe: "text-brand-900",
      linkFarbe: "text-brand-900 hover:bg-brand-100",
    },
  ];

  /** Nachschlagen: vorhanden, aber bewusst leise — kein eigener Bereich. */
  const nachschlagen: Aktion[] = [
    { href: "/wissen", text: t("ek.ref1") },
    { href: "/sds", text: t("ek.ref2") },
    { href: "/prices", text: t("ek.ref3") },
    { href: "/manufacturers", text: t("ek.ref4") },
    { href: "/materials", text: t("ek.ref5") },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("ek.heading")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bereiche.map((b) => (
          <div
            key={b.titel}
            className={`flex flex-col rounded-2xl p-5 shadow-soft ring-1 transition duration-200 hover:shadow-lift ${b.karte}`}
          >
            <Link href={b.href} className="group">
              <div className="flex h-16 items-center">
                {b.symbolFeld ? (
                  <span
                    className={`grid h-16 w-16 place-items-center rounded-2xl transition duration-200 group-hover:scale-105 ${b.symbolFeld}`}
                  >
                    {b.symbol}
                  </span>
                ) : (
                  <span className="inline-flex transition duration-200 group-hover:scale-105">
                    {b.symbol}
                  </span>
                )}
              </div>
              <h3 className={`mt-3 text-lg font-bold leading-tight ${b.titelFarbe}`}>{b.titel}</h3>
            </Link>

            {/* Die konkreten Handlungen — sichtbar, nicht hinter einem Klick. */}
            <ul className="mt-3 space-y-0.5">
              {b.aktionen.map((a) => (
                <li key={a.href + a.text}>
                  <Link
                    href={a.href}
                    className={`group/link -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${b.linkFarbe}`}
                  >
                    <span>{a.text}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-40 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white/70 px-4 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200/80">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
          <BookOpen className="h-4 w-4" />
          {t("ek.refTitle")}
        </span>
        {nachschlagen.map((n) => (
          <Link key={n.href + n.text} href={n.href} className="hover:text-brand-700 hover:underline">
            {n.text}
          </Link>
        ))}
      </div>
    </section>
  );
}
