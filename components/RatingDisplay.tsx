export function RatingDisplay({
  avg,
  count,
  size = "sm",
}: {
  avg: number | null | undefined;
  count: number;
  size?: "sm" | "xs";
}) {
  if (!count || avg == null) {
    return <span className="text-xs text-slate-400">noch keine Bewertungen</span>;
  }
  const stars = "★★★★★";
  const rounded = Math.round(avg);
  const text = size === "xs" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-1 ${text}`}>
      <span className="font-medium text-amber-500">
        <span className="opacity-100">{stars.slice(0, rounded)}</span>
        <span className="opacity-30">{stars.slice(rounded)}</span>
      </span>
      <span className="text-slate-600">
        {avg.toFixed(1)}
        <span className="text-slate-400"> · {count}</span>
      </span>
    </span>
  );
}
