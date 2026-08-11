/**
 * Die vier Einstiege der Plattform — nach Zielgruppengröße geordnet:
 * Problem klären (Instandhaltung), Anbieten (Reseller), Passendes finden
 * (Einkauf), Marke zeigen (Hersteller).
 *
 * Beschriftung (Betreiber 2026-08-11): **Überschrift plus eine kurze Zeile,
 * die sagt, was passiert.** Die Überschrift allein war zu blass („Probleme
 * lösen" — womit?), und der Erklärsatz stand nur beim Überfahren mit der Maus:
 * auf dem Handy hat ihn niemand gesehen. Genau davor warnt die Recherche zu
 * B2B-Startseiten — Wichtiges gehört sichtbar auf die Kachel, nicht in ein
 * Hover-Element.
 *
 * Gestaltung: keine harte Farbleiste mehr, sondern ein farbiges Symbolfeld,
 * ein weicher Farbschleier beim Überfahren und ein Ring in der Kachelfarbe —
 * dieselbe Sprache wie die übrigen Karten der Seite (rounded-2xl, shadow-soft
 * → shadow-lift).
 *
 * Steht bewusst auf BEIDEN Startseiten: für Gäste UND im angemeldeten
 * Dashboard (Betreiber 2026-08-10).
 */
import Link from "next/link";
import { OilBarrels, SearchCanister } from "@/components/OilBarrels";
import { Camera, Building2, ArrowRight } from "lucide-react";

type Kachel = {
  href: string;
  titel: string;
  zeile: string;
  symbol: React.ReactNode;
  /** Farbklassen fest je Kachel — Tailwind baut nur, was wörtlich dasteht. */
  verlauf: string;
  ring: string;
  titelHover: string;
  pfeil: string;
  symbolFeld: string;
};

export function EinstiegsKarten({ t }: { t: (k: string) => string }) {
  const kacheln: Kachel[] = [
    {
      href: "/erkennen",
      titel: t("home.groupProblemTitle"),
      zeile: t("home.groupProblemLine"),
      symbol: <Camera className="h-6 w-6" />,
      verlauf: "from-rose-50",
      ring: "hover:ring-rose-300",
      titelHover: "group-hover:text-rose-700",
      pfeil: "group-hover:text-rose-500",
      symbolFeld: "bg-rose-50 text-rose-600",
    },
    {
      href: "/listings/new",
      titel: t("home.groupResellerTitle"),
      zeile: t("home.groupResellerLine"),
      symbol: <OilBarrels className="h-11 w-auto" />,
      verlauf: "from-blue-50",
      ring: "hover:ring-blue-300",
      titelHover: "group-hover:text-blue-700",
      pfeil: "group-hover:text-blue-500",
      symbolFeld: "",
    },
    {
      href: "/kss-finder",
      titel: t("home.groupBuyerTitle"),
      zeile: t("home.groupBuyerLine"),
      symbol: <SearchCanister className="h-11 w-auto" />,
      verlauf: "from-amber-50",
      ring: "hover:ring-amber-300",
      titelHover: "group-hover:text-amber-700",
      pfeil: "group-hover:text-amber-500",
      symbolFeld: "",
    },
    {
      href: "/register",
      titel: t("home.groupMfrTitle"),
      zeile: t("home.groupMfrLine"),
      symbol: <Building2 className="h-6 w-6" />,
      verlauf: "from-brand-50",
      ring: "hover:ring-brand-300",
      titelHover: "group-hover:text-brand-700",
      pfeil: "group-hover:text-brand-500",
      symbolFeld: "bg-brand-50 text-brand-700",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kacheln.map((k) => (
        <Link
          key={k.href}
          href={k.href}
          className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-1 hover:shadow-lift ${k.ring}`}
        >
          {/* Weicher Farbschleier beim Überfahren — Farbe ohne harte Kante. */}
          <span
            className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${k.verlauf} to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
          />
          <div className="relative flex h-12 items-center">
            {k.symbolFeld ? (
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl transition duration-200 group-hover:scale-105 ${k.symbolFeld}`}
              >
                {k.symbol}
              </span>
            ) : (
              <span className="inline-flex transition duration-200 group-hover:scale-105">
                {k.symbol}
              </span>
            )}
          </div>
          <h3
            className={`relative mt-3 text-lg font-bold leading-tight text-slate-900 transition-colors ${k.titelHover}`}
          >
            {k.titel}
          </h3>
          <p className="relative mt-1 text-sm leading-snug text-slate-600">{k.zeile}</p>
          <ArrowRight
            className={`relative mt-3 h-5 w-5 text-slate-300 transition duration-200 group-hover:translate-x-1 ${k.pfeil}`}
          />
        </Link>
      ))}
    </section>
  );
}
