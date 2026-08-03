import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateSearchBoost,
  updateMonetizationSettings,
  adjustCredits,
  setTrialDays,
  setFreeMembership,
  createReferralCodeAction,
  deactivateReferralCode,
  deleteReferralCode,
  resolveProtectionRelease,
  resolveProtectionRefund,
  sendTestEmail,
} from "./actions";
import { getAllSettings, AI_ACTION_COSTS, packagePriceEur } from "@/lib/credits";
import { isMembershipActive } from "@/lib/membership";
import { formatCurrency } from "@/lib/currency";
import { checkMailStatus } from "@/lib/mail-status";
import { withBasePath } from "@/lib/base-path";
import { costEur, AI_FEATURE_LABEL, type TokenCounts } from "@/lib/ai-usage";
import { Download, Mail } from "lucide-react";

// Interne Eigentümer-Konsole. Für alle außer ADMIN existiert die Seite "nicht"
// (404), damit ihre Existenz nicht verraten wird.
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

  const mailStatus = await checkMailStatus();
  const [users, settings, usageAgg, purchaseAgg, referralCodes, revenueByUser, emailLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["RESELLER", "OEM"] } },
      select: {
        id: true,
        pseudonym: true,
        email: true,
        companyName: true,
        trustTier: true,
        searchBoost: true,
        creditBalance: true,
        trialEndsAt: true,
        membershipValidUntil: true,
        _count: { select: { listings: true, referrals: true } },
      },
      orderBy: [{ searchBoost: "desc" }, { pseudonym: "asc" }],
    }),
    getAllSettings(),
    prisma.creditTransaction.aggregate({
      where: { kind: "USAGE", amount: { lt: 0 } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { kind: "PURCHASE" },
      _sum: { amount: true },
    }),
    prisma.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        credits: true,
        trialDays: true,
        maxUses: true,
        usedCount: true,
        active: true,
        expiresAt: true,
        note: true,
        createdAt: true,
      },
    }),
    // Umsatz je Verkäufer (abgeschlossene Transaktionen) — einheitlich in EUR,
    // damit Superadmin über alle Nutzer hinweg vergleichen kann.
    prisma.transaction.groupBy({
      by: ["sellerId"],
      where: { status: "COMPLETED" },
      _sum: { totalEur: true },
    }),
    // System-E-Mails (Versand über SMTP, siehe lib/mailer.ts; Log für den Superadmin)
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, kind: true, to: true, subject: true, createdAt: true },
    }),
  ]);

  // Käuferschutz: offene Problemfälle + geparkte Zahlungen
  const protectionCases = await prisma.transaction.findMany({
    where: { protectionStatus: { in: ["HELD", "DISPUTED"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { pseudonym: true } },
      seller: { select: { pseudonym: true } },
      listing: { select: { manufacturer: true, productName: true } },
      rfq: { select: { manufacturer: true, productType: true } },
    },
  });

  // Nutzungs-Messung der letzten 30 Tage (UsageEvent, siehe /api/track)
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [pageviewCount, topPages, topSearches, aiActionCounts] = await Promise.all([
    prisma.usageEvent.count({ where: { kind: "pageview", createdAt: { gte: since30d } } }),
    prisma.usageEvent.groupBy({
      by: ["path"],
      where: { kind: "pageview", createdAt: { gte: since30d }, path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.usageEvent.groupBy({
      by: ["meta"],
      where: { kind: "search", createdAt: { gte: since30d }, meta: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { meta: "desc" } },
      take: 10,
    }),
    prisma.usageEvent.groupBy({
      by: ["meta"],
      where: { kind: "ai_action", createdAt: { gte: since30d } },
      _count: { _all: true },
      orderBy: { _count: { meta: "desc" } },
    }),
  ]);

  // KI-Token-Verbrauch & Kosten (echte Zahlen aus den Anthropic-Antworten)
  const [aiUsage30d, aiByModelAll, aiCallsAll] = await Promise.all([
    prisma.aiTokenUsage.findMany({
      where: { createdAt: { gte: since30d } },
      select: {
        feature: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        cacheCreationTokens: true,
        cacheReadTokens: true,
        createdAt: true,
      },
    }),
    prisma.aiTokenUsage.groupBy({
      by: ["model"],
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheCreationTokens: true,
        cacheReadTokens: true,
      },
      _count: { _all: true },
    }),
    prisma.aiTokenUsage.count(),
  ]);

  const sumToks = (r: TokenCounts) =>
    r.inputTokens + r.outputTokens + r.cacheCreationTokens + r.cacheReadTokens;

  // Gesamtkosten aller Zeiten (Kosten je Modell aus den Summen berechnen)
  const aiCostAllEur = aiByModelAll.reduce(
    (acc, m) =>
      acc +
      costEur(m.model, {
        inputTokens: m._sum.inputTokens ?? 0,
        outputTokens: m._sum.outputTokens ?? 0,
        cacheCreationTokens: m._sum.cacheCreationTokens ?? 0,
        cacheReadTokens: m._sum.cacheReadTokens ?? 0,
      }),
    0,
  );
  const aiTokensAll = aiByModelAll.reduce(
    (acc, m) =>
      acc +
      (m._sum.inputTokens ?? 0) +
      (m._sum.outputTokens ?? 0) +
      (m._sum.cacheCreationTokens ?? 0) +
      (m._sum.cacheReadTokens ?? 0),
    0,
  );

  // Aufschlüsselung nach Funktion (letzte 30 Tage)
  const aiByFeature = new Map<
    string,
    { calls: number; tokens: number; eur: number }
  >();
  for (const r of aiUsage30d) {
    const cur = aiByFeature.get(r.feature) ?? { calls: 0, tokens: 0, eur: 0 };
    cur.calls += 1;
    cur.tokens += sumToks(r);
    cur.eur += costEur(r.model, r);
    aiByFeature.set(r.feature, cur);
  }
  const aiFeatureRows = [...aiByFeature.entries()]
    .map(([feature, v]) => ({ feature, ...v }))
    .sort((a, b) => b.eur - a.eur);
  const aiCost30dEur = aiFeatureRows.reduce((a, r) => a + r.eur, 0);
  const aiCalls30d = aiUsage30d.length;

  // Tages-Verlauf für den Chart (30 Balken, ältester links)
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const dailyMap = new Map<string, { eur: number; tokens: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(dayKey(d), { eur: 0, tokens: 0 });
  }
  for (const r of aiUsage30d) {
    const k = dayKey(r.createdAt);
    const cur = dailyMap.get(k);
    if (cur) {
      cur.eur += costEur(r.model, r);
      cur.tokens += sumToks(r);
    }
  }
  const dailySeries = [...dailyMap.entries()].map(([day, v]) => ({ day, ...v }));
  const dailyMaxEur = Math.max(0.0001, ...dailySeries.map((d) => d.eur));

  // ── Empfehlungs-Statistik: wie oft wurden welche Produkte/Hersteller
  //    vorgeschlagen? (Argumentationsbasis für Hersteller-Sponsoring) ──
  const [recPairsAll, recPairs30d] = await Promise.all([
    prisma.recommendationEvent.groupBy({
      by: ["manufacturerId", "productId"],
      _count: { _all: true },
    }),
    prisma.recommendationEvent.groupBy({
      by: ["manufacturerId", "productId"],
      _count: { _all: true },
      where: { createdAt: { gte: since30d } },
    }),
  ]);
  const pair30d = new Map(recPairs30d.map((p) => [`${p.manufacturerId}|${p.productId}`, p._count._all]));
  const recByManu = new Map<string, { total: number; d30: number; products: Set<string> }>();
  const recByProd = new Map<string, { total: number; d30: number; manufacturerId: string | null }>();
  for (const p of recPairsAll) {
    const d30 = pair30d.get(`${p.manufacturerId}|${p.productId}`) ?? 0;
    if (p.manufacturerId) {
      const m = recByManu.get(p.manufacturerId) ?? { total: 0, d30: 0, products: new Set<string>() };
      m.total += p._count._all;
      m.d30 += d30;
      m.products.add(p.productId);
      recByManu.set(p.manufacturerId, m);
    }
    const pr = recByProd.get(p.productId) ?? { total: 0, d30: 0, manufacturerId: p.manufacturerId };
    pr.total += p._count._all;
    pr.d30 += d30;
    recByProd.set(p.productId, pr);
  }
  const topManuIds = [...recByManu.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 15);
  const topProdIds = [...recByProd.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 15);
  const [recManuNames, recProdNames] = await Promise.all([
    prisma.manufacturer.findMany({
      where: { id: { in: topManuIds.map(([id]) => id) } },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { id: { in: topProdIds.map(([id]) => id) } },
      select: { id: true, name: true, manufacturer: { select: { name: true } } },
    }),
  ]);
  const manuName = new Map(recManuNames.map((m) => [m.id, m.name]));
  const prodInfo = new Map(recProdNames.map((p) => [p.id, { name: p.name, manu: p.manufacturer.name }]));
  const recTotal = recPairsAll.reduce((a, p) => a + p._count._all, 0);
  const rec30dTotal = recPairs30d.reduce((a, p) => a + p._count._all, 0);

  const usedCredits = Math.abs(usageAgg._sum.amount ?? 0);
  const purchasedCredits = purchaseAgg._sum.amount ?? 0;
  const revenueBySellerId = new Map(
    revenueByUser.map((r) => [r.sellerId, r._sum.totalEur ?? 0]),
  );

  return (
    <div className="space-y-8">
      {/* ============ Monetarisierung: Credits, Trial, Referral ============ */}
      <section>
        <div className="eyebrow text-rose-600">Intern · nur Eigentümer</div>
        <h1 className="page-title">Monetarisierung</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          KI-Funktionen kosten Credits. Hier stellst du Startguthaben, Trial-Dauer,
          Referral-Prämie und den Verkaufspreis pro Credit ein. Kalkulationsbasis:
          teuerste KI-Aktion (Web-Recherche) kostet dich ≈ 7 Ct — bei
          Verkaufspreis {settings.creditPriceCt} Ct/Credit und{" "}
          {AI_ACTION_COSTS.alternativesWeb} Credits pro Web-Recherche bleibt ≥ 100 %
          Marge (Details in FDS C.9).
        </p>
      </section>

      <section className="card">
        <form
          action={updateMonetizationSettings}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <SettingField
            name="welcomeCredits"
            label="Start-Credits Neukunde"
            hint="Guthaben für die Kennenlernphase"
            defaultValue={settings.welcomeCredits}
          />
          <SettingField
            name="trialDays"
            label="Trial-Dauer (Tage)"
            hint="Kennenlernphase ohne Abo"
            defaultValue={settings.trialDays}
          />
          <SettingField
            name="referralCredits"
            label="Referral-Prämie (Credits)"
            hint="pro geworbenem Neukunden"
            defaultValue={settings.referralCredits}
          />
          <SettingField
            name="creditPriceCt"
            label="Credit-Preis (Ct)"
            hint={`Paket M (200) = EUR ${packagePriceEur(200, settings.creditPriceCt).toFixed(2)}`}
            defaultValue={settings.creditPriceCt}
          />
          <SettingField
            name="membershipPriceEur"
            label="Abo Basis (€/Jahr)"
            hint="Einstieg für Reseller"
            defaultValue={settings.membershipPriceEur}
          />
          <SettingField
            name="membershipPriceProEur"
            label="Abo Pro (€/Jahr)"
            hint="Aktive Händler"
            defaultValue={settings.membershipPriceProEur}
          />
          <SettingField
            name="membershipPriceMarkeEur"
            label="Abo Marke (€/Jahr)"
            hint="OEM/Hersteller, Schaufenster"
            defaultValue={settings.membershipPriceMarkeEur}
          />
          <SettingField
            name="protectionFeeBp"
            label="Käuferschutz (Basispunkte)"
            hint={`250 = 2,5 % · aktuell ${(settings.protectionFeeBp / 100).toFixed(2)} %`}
            defaultValue={settings.protectionFeeBp}
          />
          <SettingField
            name="protectionFeeFixedCt"
            label="Käuferschutz Fixanteil (Ct)"
            hint="25 = 0,25 € je Transaktion"
            defaultValue={settings.protectionFeeFixedCt}
          />
          <SettingField
            name="basisListingLimit"
            label="Basis: max. Angebote"
            hint="Pro/Marke = unbegrenzt"
            defaultValue={settings.basisListingLimit}
          />
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Einstellungen speichern
            </button>
          </div>
        </form>
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-lg font-bold text-slate-900">{usageAgg._count._all}</div>
            <div className="text-xs text-slate-500">KI-Aufrufe gesamt</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{usedCredits}</div>
            <div className="text-xs text-slate-500">Credits verbraucht</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{purchasedCredits}</div>
            <div className="text-xs text-slate-500">Credits verkauft</div>
          </div>
        </div>
      </section>

      {/* ============ Referral-/Gutschein-Codes ============ */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Referral-Codes</h2>
          <CsvButton list="referrals" />
        </div>
        <p className="max-w-2xl text-sm text-slate-600">
          Generiere Codes mit einer festen Credit-Anzahl. Nutzer lösen sie unter{" "}
          <code className="rounded bg-slate-100 px-1">/mitgliedschaft</code> ein — pro
          Code einmal pro Nutzer, insgesamt bis „Max. Einlösungen" oft.
        </p>
      </section>

      <section className="card">
        <form
          action={createReferralCodeAction}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Code (optional)</span>
            <input
              type="text"
              name="code"
              placeholder="leer = zufällig"
              className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Credits</span>
            <input
              type="number"
              name="credits"
              min={1}
              defaultValue={20}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">+ Trial-Tage</span>
            <input
              type="number"
              name="trialDays"
              min={0}
              max={730}
              defaultValue={0}
              title="Verlängert beim Einlösen zusätzlich die Kennenlernphase um N Tage (z.B. GRUENDER30 = 90 Tage + 50 Credits)"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Max. Einlösungen</span>
            <input
              type="number"
              name="maxUses"
              min={1}
              defaultValue={1}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Gültig bis (optional)</span>
            <input type="date" name="expiresAt" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Vermerk (optional)</span>
            <input
              type="text"
              name="note"
              placeholder="z.B. Messe Hannover"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Code generieren
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto border-t border-slate-100 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Credits</th>
                <th className="py-2 pr-3">+ Trial</th>
                <th className="py-2 pr-3">Einlösungen</th>
                <th className="py-2 pr-3">Gültig bis</th>
                <th className="py-2 pr-3">Vermerk</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referralCodes.map((c) => {
                const expired = c.expiresAt ? c.expiresAt.getTime() < Date.now() : false;
                const exhausted = c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id}>
                    <td className="py-2 pr-3">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{c.code}</code>
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-900">{c.credits}</td>
                    <td className="py-2 pr-3 text-slate-600">
                      {c.trialDays > 0 ? `${c.trialDays} Tage` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {c.usedCount} / {c.maxUses}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {c.expiresAt ? c.expiresAt.toLocaleDateString("de-CH") : "unbegrenzt"}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{c.note ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {!c.active ? (
                        <span className="text-slate-400">deaktiviert</span>
                      ) : expired ? (
                        <span className="text-amber-600">abgelaufen</span>
                      ) : exhausted ? (
                        <span className="text-amber-600">ausgeschöpft</span>
                      ) : (
                        <span className="text-emerald-700">aktiv</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-3">
                        {c.active && (
                          <form action={deactivateReferralCode}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-amber-700 hover:underline"
                            >
                              Deaktivieren
                            </button>
                          </form>
                        )}
                        {/* Löschen nur bei nie eingelösten Codes — sonst ginge der
                            Beleg verloren, wer Credits erhalten hat. */}
                        {c.usedCount === 0 && (
                          <form action={deleteReferralCode}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-red-600 hover:underline"
                              title="Endgültig löschen (nur möglich, weil noch nie eingelöst)"
                            >
                              Löschen
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {referralCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500">
                    Noch keine Codes generiert.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ Käuferschutz ============ */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Käuferschutz</h2>
          <CsvButton list="protection" />
        </div>
        <p className="max-w-2xl text-sm text-slate-600">
          Geparkte Zahlungen und gemeldete Probleme. Bei einem Problemfall entscheidest
          du: Geld an den Verkäufer freigeben oder an den Käufer zurückerstatten.
        </p>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Transaktion</th>
              <th className="px-4 py-3">Käufer → Verkäufer</th>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entscheidung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {protectionCases.map((tx) => (
              <tr key={tx.id} className={tx.protectionStatus === "DISPUTED" ? "bg-red-50/50" : ""}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {tx.listing
                      ? `${tx.listing.manufacturer} ${tx.listing.productName}`
                      : tx.rfq
                        ? [tx.rfq.manufacturer, tx.rfq.productType].filter(Boolean).join(" ")
                        : tx.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-slate-500">{tx.createdAt.toLocaleDateString("de-DE")}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {tx.buyer.pseudonym} → {tx.seller.pseudonym}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatCurrency(tx.totalEur, "EUR")}
                </td>
                <td className="px-4 py-3">
                  {tx.protectionStatus === "DISPUTED" ? (
                    <span className="chip bg-red-100 text-red-800">Problem gemeldet</span>
                  ) : (
                    <span className="chip bg-blue-100 text-blue-800">geparkt</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {tx.protectionStatus === "DISPUTED" ? (
                    <div className="flex gap-2">
                      <form action={resolveProtectionRelease}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          An Verkäufer freigeben
                        </button>
                      </form>
                      <form action={resolveProtectionRefund}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          An Käufer erstatten
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">wartet auf Lieferbestätigung</span>
                  )}
                </td>
              </tr>
            ))}
            {protectionCases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                  Keine geparkten Zahlungen oder Problemfälle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ============ Nutzung (Web-Analytics) ============ */}
      <section>
        <h2 className="section-title">Nutzung (letzte 30 Tage)</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          Selbst gehostete, datenschutzarme Messung (keine IP, keine Cookies) —
          Grundlage, um die Seite gezielt zu verbessern: Welche Bereiche werden
          genutzt, wonach wird gesucht, welche KI-Funktionen kommen an?
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="text-sm font-semibold text-slate-800">Meistbesuchte Seiten</div>
            <div className="text-xs text-slate-500">{pageviewCount} Aufrufe gesamt</div>
          </div>
          <ul className="space-y-1 text-sm">
            {topPages.map((p) => (
              <li key={p.path} className="flex justify-between gap-2">
                <span className="truncate text-slate-600">{p.path}</span>
                <span className="shrink-0 font-medium text-slate-900">{p._count._all}</span>
              </li>
            ))}
            {topPages.length === 0 && <li className="text-slate-500">Noch keine Daten.</li>}
          </ul>
        </div>
        <div className="card">
          <div className="mb-2 text-sm font-semibold text-slate-800">Top-Suchbegriffe</div>
          <ul className="space-y-1 text-sm">
            {topSearches.map((s) => (
              <li key={s.meta} className="flex justify-between gap-2">
                <span className="truncate text-slate-600">„{s.meta}"</span>
                <span className="shrink-0 font-medium text-slate-900">{s._count._all}</span>
              </li>
            ))}
            {topSearches.length === 0 && <li className="text-slate-500">Noch keine Suchen.</li>}
          </ul>
        </div>
        <div className="card">
          <div className="mb-2 text-sm font-semibold text-slate-800">KI-Funktionen</div>
          <ul className="space-y-1 text-sm">
            {aiActionCounts.map((a) => (
              <li key={a.meta} className="flex justify-between gap-2">
                <span className="truncate text-slate-600">{a.meta}</span>
                <span className="shrink-0 font-medium text-slate-900">{a._count._all}</span>
              </li>
            ))}
            {aiActionCounts.length === 0 && (
              <li className="text-slate-500">Noch keine KI-Nutzung.</li>
            )}
          </ul>
        </div>
      </section>

      {/* ============ KI-Kosten & Token-Verbrauch ============ */}
      <section>
        <h2 className="section-title">KI-Kosten &amp; Token-Verbrauch</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          Echte Token-Zahlen aus jeder Claude-Antwort. Kosten sind aus den
          aktuellen Anthropic-Preisen (Haiku 4.5: 1/5&nbsp;$, Sonnet: 3/15&nbsp;$
          je Mio. Token; Cache-Treffer ~90&nbsp;% günstiger) berechnet und in Euro
          umgerechnet — ein Richtwert, keine Abrechnung.
        </p>

        {aiCallsAll === 0 ? (
          <div className="card mt-4 text-sm text-slate-500">
            Noch keine KI-Aufrufe erfasst. Sobald der KSS-Wizard, der Berater-Chat,
            der Vergleich oder die Alternativen-Suche genutzt werden (und ein
            ANTHROPIC_API_KEY hinterlegt ist), erscheinen hier Zahlen.
          </div>
        ) : (
          <>
            {/* Kennzahlen */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Kosten gesamt
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {aiCostAllEur.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </div>
                <div className="text-xs text-slate-500">{aiCallsAll} Aufrufe insgesamt</div>
              </div>
              <div className="card">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Kosten (30 Tage)
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {aiCost30dEur.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </div>
                <div className="text-xs text-slate-500">{aiCalls30d} Aufrufe</div>
              </div>
              <div className="card">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tokens gesamt
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {aiTokensAll.toLocaleString("de-DE")}
                </div>
                <div className="text-xs text-slate-500">Input + Output + Cache</div>
              </div>
              <div className="card">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ø Kosten / Aufruf
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {(aiCallsAll > 0 ? aiCostAllEur / aiCallsAll : 0).toLocaleString("de-DE", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}{" "}
                  €
                </div>
                <div className="text-xs text-slate-500">über alle Funktionen</div>
              </div>
            </div>

            {/* Tages-Chart (Kosten je Tag, letzte 30 Tage) */}
            <div className="card mt-4">
              <div className="mb-3 flex items-baseline justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Nutzung je Tag (Kosten, letzte 30 Tage)
                </div>
                <div className="text-xs text-slate-500">
                  Spitze: {dailyMaxEur.toLocaleString("de-DE", { maximumFractionDigits: 3 })} €
                </div>
              </div>
              <div className="flex h-32 items-end gap-[3px]">
                {dailySeries.map((d) => (
                  <div
                    key={d.day}
                    className="flex-1 rounded-t bg-brand-500/80 transition hover:bg-brand-600"
                    style={{
                      height: `${Math.max(2, (d.eur / dailyMaxEur) * 100)}%`,
                    }}
                    title={`${new Date(d.day).toLocaleDateString("de-DE")}: ${d.eur.toLocaleString(
                      "de-DE",
                      { minimumFractionDigits: 3, maximumFractionDigits: 3 },
                    )} € · ${d.tokens.toLocaleString("de-DE")} Tokens`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>{new Date(dailySeries[0].day).toLocaleDateString("de-DE")}</span>
                <span>heute</span>
              </div>
            </div>

            {/* Aufschlüsselung nach Funktion (30 Tage) */}
            <div className="card mt-4 overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2 font-semibold">Funktion (30 Tage)</th>
                    <th className="px-4 py-2 text-right font-semibold">Aufrufe</th>
                    <th className="px-4 py-2 text-right font-semibold">Tokens</th>
                    <th className="px-4 py-2 text-right font-semibold">Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  {aiFeatureRows.map((r) => (
                    <tr key={r.feature} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-800">
                        {AI_FEATURE_LABEL[r.feature] ?? r.feature}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">{r.calls}</td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {r.tokens.toLocaleString("de-DE")}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">
                        {r.eur.toLocaleString("de-DE", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}{" "}
                        €
                      </td>
                    </tr>
                  ))}
                  {aiFeatureRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-slate-500">
                        In den letzten 30 Tagen keine KI-Aufrufe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ============ Empfehlungs-Statistik (Sponsoring-Akquise) ============ */}
      <section className="card">
        <h2 className="section-title">Empfehlungs-Statistik (KI-Vorschläge)</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Wie oft Wizard, KI-Analyse und Alternativsuche Produkte vorgeschlagen haben —
          deine Argumentationsbasis, um Hersteller auf ein bezahltes Sponsoring anzusprechen
          („Ihr Produkt wurde N-mal empfohlen").
        </p>

        {recTotal === 0 ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            Noch keine Empfehlungen gezählt — die Zählung läuft ab jetzt bei jeder
            Wizard-Analyse und Alternativsuche automatisch mit.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <div className="stat-value">{recTotal.toLocaleString("de-CH")}</div>
                <div className="text-xs text-slate-500">Empfehlungen gesamt</div>
              </div>
              <div>
                <div className="stat-value">{rec30dTotal.toLocaleString("de-CH")}</div>
                <div className="text-xs text-slate-500">letzte 30 Tage</div>
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="overflow-x-auto">
                <div className="eyebrow mb-2">Top-Hersteller</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pr-2">Hersteller</th>
                      <th className="py-1.5 pr-2 text-right">Produkte</th>
                      <th className="py-1.5 pr-2 text-right">30 Tage</th>
                      <th className="py-1.5 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topManuIds.map(([id, v]) => (
                      <tr key={id} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2 font-medium text-slate-800">
                          {manuName.get(id) ?? id}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{v.products.size}</td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{v.d30.toLocaleString("de-CH")}</td>
                        <td className="py-1.5 text-right font-semibold tabular-nums">{v.total.toLocaleString("de-CH")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <div className="eyebrow mb-2">Top-Produkte</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pr-2">Produkt</th>
                      <th className="py-1.5 pr-2">Hersteller</th>
                      <th className="py-1.5 pr-2 text-right">30 Tage</th>
                      <th className="py-1.5 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProdIds.map(([id, v]) => (
                      <tr key={id} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2 font-medium text-slate-800">
                          {prodInfo.get(id)?.name ?? id}
                        </td>
                        <td className="py-1.5 pr-2 text-slate-500">{prodInfo.get(id)?.manu ?? "—"}</td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{v.d30.toLocaleString("de-CH")}</td>
                        <td className="py-1.5 text-right font-semibold tabular-nums">{v.total.toLocaleString("de-CH")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Zählweise: Wizard/KI-Analyse = jede ausgespielte Empfehlung (Top 3);
              Alternativsuche = die 5 obersten Treffer je Anzeige. Gesponserte Treffer sind enthalten.
            </p>
          </>
        )}
      </section>

      {/* ============ System-E-Mails ============ */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">System-E-Mails</h2>
          <CsvButton list="emails" />
        </div>
        <p className="max-w-2xl text-sm text-slate-600">
          Protokoll aller System-E-Mails: Passwort zurücksetzen, Erinnerung ~30 Tage vor
          automatischer Abo-Verlängerung, Bestätigung danach. Verschickt wird über SMTP
          (Zugangsdaten in den Server-Variablen).
        </p>

        {/* Live-Diagnose: prüft beim Laden die Anmeldung am Mailserver und benennt
            den Grund, falls nichts rausgeht. */}
        <div
          className={`mt-3 rounded-lg border p-3 text-sm ${
            mailStatus.loginOk
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-400 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="font-semibold">
            {mailStatus.loginOk ? "✓ " : "⚠ "}
            {mailStatus.headline}
          </div>
          <p className="mt-1">{mailStatus.detail}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
            {mailStatus.facts.map((f) => (
              <span key={f.label}>
                <span className="font-medium">{f.label}:</span> {f.value}
              </span>
            ))}
          </div>
          {/* Live-Beweis: Test-Mail an das eigene Admin-Postfach. */}
          {mailStatus.configured && (
            <form action={sendTestEmail} className="mt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Mail size={14} />
                Test-E-Mail an mich senden
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Art</th>
              <th className="px-4 py-3">An</th>
              <th className="px-4 py-3">Betreff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emailLogs.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-slate-600">
                  {e.createdAt.toLocaleString("de-DE")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {e.kind === "MEMBERSHIP_RENEWAL_REMINDER" ? "Erinnerung" : "Bestätigung"}
                </td>
                <td className="px-4 py-3 text-slate-600">{e.to}</td>
                <td className="px-4 py-3 text-slate-900">{e.subject}</td>
              </tr>
            ))}
            {emailLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  Noch keine System-E-Mails versendet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Sichtbarkeits-Steuerung &amp; Kunden</h2>
          <CsvButton list="users" />
        </div>
        <p className="max-w-2xl text-sm text-slate-600">
          Hier legst du fest, welche Reseller in Suche und Vorschlägen weiter oben
          erscheinen. Ein höherer Wert (0–100) schiebt deren Angebote nach vorne.
          <strong className="text-slate-800"> Diese Werte sind für niemanden sonst
          sichtbar</strong> — weder für die Reseller noch für Käufer. Sie tauchen in
          keiner öffentlichen Seite oder API auf.
        </p>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Reseller</th>
              <th className="px-4 py-3">Vertrauensstufe</th>
              <th className="px-4 py-3">Angebote</th>
              <th className="px-4 py-3">Umsatz</th>
              <th className="px-4 py-3">Boost (0–100)</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Trial / Abo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.searchBoost > 0 ? "bg-amber-50/60" : ""}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{u.pseudonym}</div>
                  <div className="text-xs text-slate-500">
                    {u.companyName ? `${u.companyName} · ` : ""}
                    {u.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.trustTier}</td>
                <td className="px-4 py-3 text-slate-600">{u._count.listings}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(revenueBySellerId.get(u.id) ?? 0, "EUR")}
                </td>
                <td className="px-4 py-3">
                  <form action={updateSearchBoost} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="number"
                      name="boost"
                      min={0}
                      max={100}
                      defaultValue={u.searchBoost}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Speichern
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="mb-1 font-semibold text-slate-900">
                    {u.creditBalance}
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      {u._count.referrals > 0 ? `· ${u._count.referrals} geworben` : ""}
                    </span>
                  </div>
                  <form action={adjustCredits} className="flex items-center gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="number"
                      name="amount"
                      placeholder="±"
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                      title="Credits gutschreiben (+) oder abziehen (−)"
                    >
                      ±
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="mb-1 text-xs">
                    {isMembershipActive(u.membershipValidUntil) ? (
                      <span className="font-medium text-emerald-700">
                        Abo bis {u.membershipValidUntil!.toLocaleDateString("de-CH")}
                      </span>
                    ) : u.trialEndsAt && u.trialEndsAt.getTime() > Date.now() ? (
                      <span className="text-blue-700">
                        Trial bis {u.trialEndsAt.toLocaleDateString("de-CH")}
                      </span>
                    ) : (
                      <span className="text-slate-400">abgelaufen / kein Abo</span>
                    )}
                  </div>
                  <form action={setTrialDays} className="flex items-center gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="number"
                      name="days"
                      min={0}
                      max={365}
                      placeholder="Tage"
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                      title="Trial ab heute auf X Tage setzen (0 = beenden)"
                    >
                      Set
                    </button>
                  </form>
                  {/* Gratis-Konto: Mitgliedschaft auf X Jahre — für Gründungs-Händler/Partner */}
                  <form action={setFreeMembership} className="mt-1 flex items-center gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="months"
                      defaultValue="12"
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-1 text-xs text-emerald-900"
                    >
                      <option value="1">1 Monat</option>
                      <option value="2">2 Monate</option>
                      <option value="3">3 Monate</option>
                      <option value="6">6 Monate</option>
                      <option value="12">12 Monate</option>
                      <option value="24">24 Monate</option>
                      <option value="36">36 Monate</option>
                      <option value="0">entfernen</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      title="Gratis-Konto: Mitgliedschaft ab heute auf X Monate setzen (entfernen = Abo-Datum löschen — Achtung, gilt auch für bezahlte Abos)"
                    >
                      Gratis
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Noch keine Reseller vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SettingField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </label>
  );
}

// Download-Knopf für eine Admin-Liste als CSV (Excel-kompatibel, Strichpunkt + BOM).
function CsvButton({ list }: { list: "users" | "referrals" | "protection" | "emails" }) {
  return (
    <a
      href={withBasePath(`/api/admin/export?list=${list}`)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      title="Als CSV herunterladen (öffnet in Excel)"
    >
      <Download size={15} />
      CSV
    </a>
  );
}
