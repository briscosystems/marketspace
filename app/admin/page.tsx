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
} from "./actions";
import { getAllSettings, AI_ACTION_COSTS, packagePriceChf } from "@/lib/credits";
import { isMembershipActive } from "@/lib/membership";

// Interne Eigentümer-Konsole. Für alle außer ADMIN existiert die Seite "nicht"
// (404), damit ihre Existenz nicht verraten wird.
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

  const [users, settings, usageAgg, purchaseAgg, referralCodes] = await Promise.all([
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
  ]);

  const usedCredits = Math.abs(usageAgg._sum.amount ?? 0);
  const purchasedCredits = purchaseAgg._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      {/* ============ Monetarisierung: Credits, Trial, Referral ============ */}
      <section>
        <div className="eyebrow text-rose-600">Intern · nur Eigentümer</div>
        <h1 className="page-title">Monetarisierung</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          KI-Funktionen kosten Credits. Hier stellst du Startguthaben, Trial-Dauer,
          Referral-Prämie und den Verkaufspreis pro Credit ein. Kalkulationsbasis:
          teuerste KI-Aktion (Web-Recherche) kostet dich ≈ 7 Rp — bei
          Verkaufspreis {settings.creditPriceRp} Rp/Credit und{" "}
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
            name="creditPriceRp"
            label="Credit-Preis (Rp)"
            hint={`Paket M (200) = CHF ${packagePriceChf(200, settings.creditPriceRp).toFixed(2)}`}
            defaultValue={settings.creditPriceRp}
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
