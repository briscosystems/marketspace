import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeTier, hasStorefront } from "@/lib/membership-tiers";
import { AD_PLACEMENT_LABEL, adStatusLabel } from "@/lib/ads";
import { AdManager } from "@/components/AdManager";
import { Megaphone, Lock } from "lucide-react";

export const metadata = { title: "Werbung — Brisco Marketplace" };

export default async function WerbungPage() {
  const t = await getT();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        {t("ads.loginHint")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("ads.login")}
        </Link>
        .
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      membershipTier: true,
      membershipValidUntil: true,
      brandManufacturer: { select: { name: true, slug: true } },
    },
  });
  const isAdmin = user?.role === "ADMIN";
  const isMarke = hasStorefront(
    activeTier({
      membershipTier: user?.membershipTier ?? null,
      membershipValidUntil: user?.membershipValidUntil ?? null,
    }),
  );

  if (!isMarke && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-brand-600" />
          <h1 className="page-title">{t("ads.title")}</h1>
        </div>
        <div className="card flex flex-col items-start gap-3 border-dashed">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock size={16} className="text-slate-400" />
            {t("ads.lockTitle")}
          </div>
          <p className="text-sm text-slate-600">{t("ads.lockBody")}</p>
          <Link
            href="/mitgliedschaft"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("ads.switchToMarke")}
          </Link>
        </div>
      </div>
    );
  }

  const ads = await prisma.adBanner.findMany({
    where: isAdmin ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = ads.map((a) => ({
    id: a.id,
    eyebrow: a.eyebrow,
    headline: a.headline,
    chips: a.chips,
    image: a.image,
    ctaLabel: a.ctaLabel,
    ctaUrl: a.ctaUrl,
    origin: a.origin,
    placements: a.placements,
    active: a.active,
    startsAt: a.startsAt ? a.startsAt.toISOString() : null,
    endsAt: a.endsAt ? a.endsAt.toISOString() : null,
    status: adStatusLabel(a),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone size={20} className="text-brand-600" />
        <h1 className="page-title">{t("ads.title")}</h1>
      </div>
      <p className="text-sm text-slate-600">
        {t("ads.introBase")}
        {user?.brandManufacturer ? (
          <>
            {" "}{t("ads.introLinkedPre")}{" "}
            <Link
              href={`/manufacturers/${user.brandManufacturer.slug}`}
              className="text-brand-600 hover:underline"
            >
              {user.brandManufacturer.name}
            </Link>
            {t("ads.introLinkedPost")}
          </>
        ) : (
          <>. {t("ads.introTip")}</>
        )}
      </p>

      <AdManager
        initialAds={serialized}
        placements={(Object.keys(AD_PLACEMENT_LABEL) as (keyof typeof AD_PLACEMENT_LABEL)[]).map(
          (value) => ({ value, label: AD_PLACEMENT_LABEL[value] }),
        )}
      />
    </div>
  );
}
