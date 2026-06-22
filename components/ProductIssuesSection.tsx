import Link from "next/link";
import { AlertTriangle, AlertOctagon, ExternalLink, Info, CheckCircle2 } from "lucide-react";

type Issue = {
  id: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  symptoms: string[];
  rootCause: string | null;
  workaround: string | null;
  preventiveMeasure: string | null;
  affectedMaterials: string[];
  affectedOperations: string[];
  reportedConcentration: number | null;
  reportedPh: number | null;
  sourceType: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  sourceDate: Date | null;
  isOfficial: boolean;
  reportCount: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  BIOLOGY: "Bakterien / Pilze / Geruch",
  FOAM: "Schaumbildung",
  CORROSION: "Korrosion",
  TOOL_WEAR: "Werkzeugverschleiß",
  OPERATOR_HEALTH: "Bediener-Gesundheit",
  SEAL_DAMAGE: "Dichtungen / Lackangriff",
  WORKPIECE_STAINS: "Werkstück-Flecken",
  RESIDUES: "Klebrige Rückstände",
  FILTRATION: "Filtration / Tramp-Oil",
  STABILITY: "Stabilität / Lagerung",
  PERFORMANCE: "Leistung",
  COMPATIBILITY: "Kompatibilität",
  REGULATORY: "Regulatorisch",
  SHELF_LIFE: "Lagerstabilität",
  OTHER: "Sonstiges",
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  FORUM: "Forum",
  MANUFACTURER: "Hersteller",
  DISTRIBUTOR: "Distributor",
  CASE_STUDY: "Fallstudie",
  REVIEW: "Bewertung",
  REGULATORY: "Behörde",
  SDS: "SDS",
  USER_REPORT: "User-Meldung",
  OTHER: "Sonstige",
};

const SEVERITY_STYLE: Record<string, { badge: string; icon: typeof AlertTriangle; label: string }> = {
  HIGH: {
    badge: "bg-red-100 text-red-800 ring-1 ring-red-300",
    icon: AlertOctagon,
    label: "Hoch",
  },
  MEDIUM: {
    badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    icon: AlertTriangle,
    label: "Mittel",
  },
  LOW: {
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
    icon: Info,
    label: "Niedrig",
  },
};

export function ProductIssuesSection({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;

  const sorted = [...issues].sort((a, b) => {
    const sevOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const sevDiff =
      (sevOrder[a.severity as keyof typeof sevOrder] ?? 3) -
      (sevOrder[b.severity as keyof typeof sevOrder] ?? 3);
    if (sevDiff !== 0) return sevDiff;
    if (a.isOfficial && !b.isOfficial) return -1;
    if (!a.isOfficial && b.isOfficial) return 1;
    return b.reportCount - a.reportCount;
  });

  const counts = {
    high: issues.filter((i) => i.severity === "HIGH").length,
    medium: issues.filter((i) => i.severity === "MEDIUM").length,
    low: issues.filter((i) => i.severity === "LOW").length,
  };

  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-700" />
          <h2 className="font-bold text-slate-900">
            Bekannte Praxis-Probleme{" "}
            <span className="text-sm font-normal text-slate-600">({issues.length})</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {counts.high > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 ring-1 ring-red-300">
              {counts.high} Hoch
            </span>
          )}
          {counts.medium > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-amber-300">
              {counts.medium} Mittel
            </span>
          )}
          {counts.low > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-300">
              {counts.low} Niedrig
            </span>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-xs text-slate-600">
        Dokumentierte Probleme aus Foren, Hersteller-Hinweisen, Distributoren und Behörden. Hilft
        Anwendern, Anwendungsfehler zu vermeiden.
      </p>

      <div className="mt-3 space-y-2">
        {sorted.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </section>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const sev = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.MEDIUM;
  const SevIcon = sev.icon;

  return (
    <details className="group rounded-lg border border-amber-200 bg-white open:bg-white">
      <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-2.5 hover:bg-amber-50/50">
        <SevIcon
          size={16}
          className={
            issue.severity === "HIGH"
              ? "text-red-600 shrink-0 mt-0.5"
              : issue.severity === "MEDIUM"
                ? "text-amber-600 shrink-0 mt-0.5"
                : "text-slate-400 shrink-0 mt-0.5"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
              {CATEGORY_LABEL[issue.category] ?? issue.category}
            </span>
            {issue.isOfficial && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 ring-1 ring-blue-300">
                ✓ Offiziell
              </span>
            )}
            {issue.reportCount > 1 && (
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                {issue.reportCount}× gemeldet
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {SOURCE_TYPE_LABEL[issue.sourceType] ?? issue.sourceType}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{issue.title}</div>
        </div>
        <span className="shrink-0 text-xs text-slate-400 group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>

      <div className="border-t border-amber-100 px-3 pb-3 pt-2 text-sm text-slate-700">
        <p className="mb-2">{issue.description}</p>

        {issue.symptoms.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Symptome:
            </span>{" "}
            <span className="text-xs">
              {issue.symptoms.map((s, i) => (
                <span key={s}>
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{s}</span>
                  {i < issue.symptoms.length - 1 && " "}
                </span>
              ))}
            </span>
          </div>
        )}

        {(issue.reportedConcentration != null || issue.reportedPh != null) && (
          <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-600">
            {issue.reportedConcentration != null && (
              <span>Konzentration: <strong>{issue.reportedConcentration}%</strong></span>
            )}
            {issue.reportedPh != null && (
              <span>pH: <strong>{issue.reportedPh}</strong></span>
            )}
          </div>
        )}

        {issue.rootCause && (
          <div className="mb-2 rounded border-l-4 border-red-300 bg-red-50/50 px-2 py-1.5">
            <div className="text-xs font-medium text-red-700">Ursache</div>
            <div className="text-xs text-slate-800">{issue.rootCause}</div>
          </div>
        )}

        {issue.workaround && (
          <div className="mb-2 rounded border-l-4 border-blue-300 bg-blue-50/50 px-2 py-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
              <CheckCircle2 size={11} /> Behebung
            </div>
            <div className="text-xs text-slate-800">{issue.workaround}</div>
          </div>
        )}

        {issue.preventiveMeasure && (
          <div className="mb-2 rounded border-l-4 border-emerald-300 bg-emerald-50/50 px-2 py-1.5">
            <div className="text-xs font-medium text-emerald-700">Vorbeugen</div>
            <div className="text-xs text-slate-800">{issue.preventiveMeasure}</div>
          </div>
        )}

        {(issue.affectedMaterials.length > 0 || issue.affectedOperations.length > 0) && (
          <div className="mb-2 flex flex-wrap gap-3 text-xs">
            {issue.affectedMaterials.length > 0 && (
              <div>
                <span className="text-slate-500">Materialien:</span>{" "}
                {issue.affectedMaterials.map((m) => (
                  <span
                    key={m}
                    className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
            {issue.affectedOperations.length > 0 && (
              <div>
                <span className="text-slate-500">Verfahren:</span>{" "}
                {issue.affectedOperations.map((o) => (
                  <span
                    key={o}
                    className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700"
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {issue.sourceUrl && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>Quelle:</span>
            <Link
              href={issue.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-brand-600 hover:underline"
            >
              {issue.sourceTitle || new URL(issue.sourceUrl).hostname}
              <ExternalLink size={10} />
            </Link>
            {issue.sourceAuthor && (
              <span className="text-slate-400">· {issue.sourceAuthor}</span>
            )}
            {issue.sourceDate && (
              <span className="text-slate-400">
                · {new Date(issue.sourceDate).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
