import Link from "next/link";
import { ShieldCheck, BadgeCheck, EyeOff, Lock, Star, Check } from "lucide-react";
import { TIER_STYLES } from "@/components/TrustBadge";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "So sorgen wir für Vertrauen — Brisco" };

// WORTLAUT-PFLICHT beim Käuferschutz: nie „Treuhand"/„Escrow" (Stripe-Vorgabe).
export default async function VertrauenPage() {
  const t = await getT();
  const tiers = Object.values(TIER_STYLES).sort((a, b) => a.level - b.level);

  const steps = [
    [t("trust.step1t"), t("trust.step1d")],
    [t("trust.step2t"), t("trust.step2d")],
    [t("trust.step3t"), t("trust.step3d")],
    [t("trust.step4t"), t("trust.step4d")],
  ];
  const benefits = [
    [t("trust.ben1t"), t("trust.ben1d")],
    [t("trust.ben2t"), t("trust.ben2d")],
    [t("trust.ben3t"), t("trust.ben3d")],
    [t("trust.ben4t"), t("trust.ben4d")],
    [t("trust.ben5t"), t("trust.ben5d")],
  ];
  const limits = [
    [t("trust.lim1t"), t("trust.lim1d")],
    [t("trust.lim2t"), t("trust.lim2d")],
    [t("trust.lim3t"), t("trust.lim3d")],
    [t("trust.lim4t"), t("trust.lim4d")],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="rounded-2xl bg-emerald-50/60 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} className="text-emerald-600" />
          <h1 className="page-title">{t("trust.title")}</h1>
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700">
          {t("trust.intro1a")}<strong>{t("trust.introQ1")}</strong>{t("trust.intro1b")}
          <strong>{t("trust.introQ2")}</strong>
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{t("trust.intro2")}</p>
      </div>

      {/* Verifizierungsstufen */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-brand-600" />
          <h2 className="section-title">{t("trust.tiersTitle")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("trust.tiersText")}</p>
        <div className="card divide-y divide-slate-100 p-0">
          {tiers.map((tier) => {
            const Icon = tier.Icon;
            return (
              <div key={tier.level} className="flex items-start gap-3 p-3">
                <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 ${tier.classes}`}>
                  <Icon size={14} className={tier.iconColor} strokeWidth={2.25} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{tier.label}</div>
                  <div className="text-xs text-slate-600">{tier.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Verifizierte Bewertungen */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-500" />
          <h2 className="section-title">{t("trust.reviewsTitle")}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("trust.reviewsText")}</p>
      </section>

      {/* Pseudonymität & Neutralität */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <EyeOff size={18} className="text-slate-600" />
          <h2 className="section-title">{t("trust.pseudoTitle")}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("trust.pseudoText1")}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t("trust.pseudoText2a")}<strong>{t("trust.pseudoSponsored")}</strong>{t("trust.pseudoText2b")}
        </p>
      </section>

      {/* Sicherer Ablauf */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-emerald-600" />
          <h2 className="section-title">{t("trust.docsTitle")}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t("trust.docsTextA")}
          <Link href="/agb" className="text-brand-600 hover:underline">{t("footer.terms")}</Link>.
        </p>
      </section>

      {/* Käuferschutz */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h2 className="section-title">{t("trust.protTitle")}</h2>
        </div>

        <p className="text-sm text-slate-600">{t("trust.protIntro")}</p>

        {/* Ablauf */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {t("trust.howItWorks")}
          </div>
          <ol className="mt-3 space-y-3 text-sm text-slate-700">
            {steps.map(([titel, text], i) => (
              <li key={titel} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-slate-900">{titel}</strong>
                  <span className="block text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Vorteile */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("trust.benefitsTitle")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {benefits.map(([titel, text]) => (
              <li key={titel} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>{titel}</strong>{text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Kosten */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("trust.costTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">
            <strong>2,5 % + 0,25 €</strong> {t("trust.costText")}
          </p>
        </div>

        {/* Ehrliche Grenzen */}
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{t("trust.limitsTitle")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {limits.map(([titel, text]) => (
              <li key={titel}>
                <strong>{titel}</strong>{text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          {t("trust.contractNote")}
          <Link href="/agb" className="text-brand-600 hover:underline">{t("trust.contractLink")}</Link>.
        </p>
      </section>
    </div>
  );
}
