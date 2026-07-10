import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateSearchBoost,
  updateMonetizationSettings,
  adjustCredits,
  setTrialDays,
  createReferralCodeAction,
  deactivateReferralCode,
  resolveProtectionRelease,
  resolveProtectionRefund,
} from "./actions";
import { getAllSettings, AI_ACTION_COSTS, packagePriceEur } from "@/lib/credits";
import { isMembershipActive } from "@/lib/membership";
import { formatCurrency } from "@/lib/currency";

// Interne Eigentümer-Konsole. Für alle außer ADMIN existiert die Seite "nicht"
// (404), damit ihre Existenz nicht verraten wird.
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

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
    // System-E-Mails (Prototyp-Log, kein echter Versand — siehe lib/mailer.ts)
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
            label="Jahresgebühr Abo (€)"
            hint="Automatische Verlängerung, Default 350 €"
            defaultValue={settings.membershipPriceEur}
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
        <h2 className="page-title">Referral-Codes</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          Generiere Codes mit einer festen Credit-Anzahl. Nutzer lösen sie unter{" "}
          <code className="rounded bg-slate-100 px-1">/mitgliedschaft</code> ein — pro
          Code einmal pro Nutzer, insgesamt bis „Max. Einlösungen" oft.
        </p>
      </section>

      <section className="card">
        <form
          action={createReferralCodeAction}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
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
                      {c.active && (
                        <form action={deactivateReferralCode}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Deaktivieren
                          </button>
                        </form>
                      )}
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
        <h2 className="page-title">Käuferschutz</h2>
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
        <h2 className="page-title">Nutzung (letzte 30 Tage)</h2>
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

      {/* ============ System-E-Mails ============ */}
      <section>
        <h2 className="page-title">System-E-Mails</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          Kein echter E-Mail-Versand im Prototyp — hier siehst du, was verschickt
          worden wäre (Erinnerung ~30 Tage vor automatischer Abo-Verlängerung,
          Bestätigung danach). Details im Server-Log.
        </p>
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
        <h2 className="page-title">Sichtbarkeits-Steuerung &amp; Kunden</h2>
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
