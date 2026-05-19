import { Sparkles, Medal, Award, Crown, Gem } from "lucide-react";

type Tier = "UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM" | "DIAMOND";

type TierStyle = {
  label: string;
  short: string;
  classes: string;
  iconColor: string;
  title: string;
  Icon: typeof Sparkles;
  level: number;
};

export const TIER_STYLES: Record<Tier, TierStyle> = {
  UNVERIFIED: {
    label: "Neuling",
    short: "Neu",
    classes: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    iconColor: "text-slate-400",
    title: "Neuer Reseller — noch keine abgeschlossene Transaktion",
    Icon: Sparkles,
    level: 1,
  },
  VERIFIED: {
    label: "Bronze-Partner",
    short: "Bronze",
    classes:
      "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-900 ring-1 ring-orange-300/60",
    iconColor: "text-orange-600",
    title: "Verifiziert · mind. 1 abgeschlossene Transaktion",
    Icon: Medal,
    level: 2,
  },
  TRADE_ASSURED: {
    label: "Silber-Partner",
    short: "Silber",
    classes:
      "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 ring-1 ring-slate-300",
    iconColor: "text-slate-500",
    title: "≥ 10 Transaktionen · Rating ≥ 4,2 · keine offenen Beschwerden",
    Icon: Award,
    level: 3,
  },
  PREMIUM: {
    label: "Gold-Partner",
    short: "Gold",
    classes:
      "bg-gradient-to-r from-yellow-100 to-amber-200 text-amber-900 ring-1 ring-amber-400/70",
    iconColor: "text-amber-600",
    title: "≥ 50 000 € Umsatz · Rating ≥ 4,5 · seit ≥ 6 Monaten aktiv",
    Icon: Crown,
    level: 4,
  },
  DIAMOND: {
    label: "Diamant-Partner",
    short: "Diamant",
    classes:
      "bg-gradient-to-r from-cyan-100 via-sky-100 to-violet-200 text-violet-900 ring-1 ring-violet-300",
    iconColor: "text-violet-500",
    title: "≥ 200 000 € Umsatz · Rating ≥ 4,7 · ≥ 50 Bewertungen · ≥ 12 Monate aktiv",
    Icon: Gem,
    level: 5,
  },
};

export function TrustBadge({
  tier,
  size = "sm",
  showLabel = true,
}: {
  tier: Tier;
  size?: "sm" | "xs" | "md";
  showLabel?: boolean;
}) {
  const s = TIER_STYLES[tier];
  const dims =
    size === "xs"
      ? { px: "px-2 py-0.5", text: "text-[10px]", icon: 12, gap: "gap-1" }
      : size === "md"
        ? { px: "px-3 py-1", text: "text-sm", icon: 16, gap: "gap-1.5" }
        : { px: "px-2 py-0.5", text: "text-xs", icon: 14, gap: "gap-1" };
  const { Icon } = s;
  return (
    <span
      title={s.title}
      className={`inline-flex items-center rounded-full font-medium ${s.classes} ${dims.px} ${dims.text} ${dims.gap}`}
    >
      <Icon size={dims.icon} className={s.iconColor} strokeWidth={2.25} />
      {showLabel && <span>{s.label}</span>}
    </span>
  );
}

export function TierProgress({ tier }: { tier: Tier }) {
  const current = TIER_STYLES[tier].level;
  return (
    <div className="flex items-center gap-0.5" title={`Tier ${current} von 5`}>
      {(Object.values(TIER_STYLES) as TierStyle[])
        .sort((a, b) => a.level - b.level)
        .map((t) => (
          <t.Icon
            key={t.level}
            size={12}
            className={t.level <= current ? t.iconColor : "text-slate-200"}
            strokeWidth={2.25}
          />
        ))}
    </div>
  );
}
