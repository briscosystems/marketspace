import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import {
  APPLICATION_FACETS,
  listingMatchesApplication,
} from "@/lib/application-facets";
import {
  Cog,
  RotateCw,
  Drill,
  Wrench,
  Disc3,
  Scissors,
  Hammer,
  Droplets,
  Layers,
  Settings,
} from "lucide-react";

const FACET_ICON: Record<string, React.ReactNode> = {
  fraesen: <Cog className="h-5 w-5" />,
  drehen: <RotateCw className="h-5 w-5" />,
  bohren: <Drill className="h-5 w-5" />,
  gewindeschneiden: <Wrench className="h-5 w-5" />,
  schleifen: <Disc3 className="h-5 w-5" />,
  saegen: <Scissors className="h-5 w-5" />,
  umformen: <Hammer className="h-5 w-5" />,
  hydraulik: <Droplets className="h-5 w-5" />,
  gleitbahn: <Layers className="h-5 w-5" />,
  getriebe: <Settings className="h-5 w-5" />,
};

/**
 * Einstieg nach Anwendung — für Nutzer, die die Produktnamen nicht kennen:
 * "Ich fräse / ich brauche Hydrauliköl" → gefilterte Angebotsliste.
 * Zeigt nur Anwendungen, für die es gerade aktive Angebote gibt.
 */
export async function ApplicationEntry() {
  const rows = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { applicationArea: true, machiningOperations: true },
  });

  const t = await getT();
  const tiles = APPLICATION_FACETS.map((f) => ({
    facet: f,
    count: rows.filter((r) =>
      listingMatchesApplication(f, r.applicationArea, r.machiningOperations),
    ).length,
  })).filter((t) => t.count > 0);

  if (tiles.length === 0) return null;

  return (
    <section>
      {/* Der Erklärsatz unter der Überschrift ist entfallen — die Kacheln
          erklären sich selbst (Muster großer Marktplätze: Kategorien statt Fließtext). */}
      <h2 className="section-title">{t("appEntry.title")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(({ facet, count }) => (
          <Link
            key={facet.id}
            href={`/listings?application=${facet.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:border-brand-400 hover:shadow-lift"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              {FACET_ICON[facet.id] ?? <Cog className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                {t(facet.labelKey)}
              </div>
              <div className="hover-hint text-xs text-slate-500">
                {fill(t(count === 1 ? "appEntry.offers.one" : "appEntry.offers.other"), { n: count })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
