import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UmsatzChart, type UmsatzPoint } from "@/components/UmsatzChart";
import { SavingsEditor } from "@/components/SavingsEditor";
import { currencyForUser, convertCurrency, formatCurrency } from "@/lib/currency";
import { transactionProductLabel } from "@/lib/transaction-label";
import { withBasePath } from "@/lib/base-path";
import { activeTier, hasAnalytics } from "@/lib/membership-tiers";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { Wallet, Download, Lock } from "lucide-react";

export const metadata = { title: "Meine Umsätze — Brisco Marketplace" };

export default async function UmsaetzePage() {
  const t = await getT();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        {t("rev.pleaseLoginPre")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">{t("rev.login")}</Link>{t("rev.pleaseLoginSuffix")}
      </div>
    );
  }
  const userId = session.user.id;

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        country: true,
        preferredCurrency: true,
        membershipTier: true,
        membershipValidUntil: true,
      },
    }),
    prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { manufacturer: true, productName: true } },
        rfq: { select: { manufacturer: true, productType: true } },
        buyer: { select: { pseudonym: true } },
        seller: { select: { pseudonym: true } },
      },
    }),
  ]);

  const currency = currencyForUser(user ?? {});
  const rows = transactions.map((tx) => {
    const isSale = tx.sellerId === userId;
    // Einsparung durch Produktwechsel: alter Preis × Menge − gezahlter Betrag
    const savingEur =
      !isSale && tx.replacedPricePerUnit != null
        ? tx.replacedPricePerUnit * tx.quantity - tx.totalEur
        : null;
    return {
      id: tx.id,
      date: tx.createdAt,
      isSale,
      product: transactionProductLabel(tx),
      counterpart: isSale ? tx.buyer.pseudonym : tx.seller.pseudonym,
      quantity: tx.quantity,
      unit: tx.quantityUnit,
      amount: convertCurrency(tx.totalEur, "EUR", currency),
      saving: savingEur != null ? convertCurrency(savingEur, "EUR", currency) : null,
      replacedProductName: tx.replacedProductName,
      replacedPricePerUnit: tx.replacedPricePerUnit,
      status: tx.status,
      completed: tx.status === "COMPLETED",
    };
  });

  const salesTotal = rows.filter((r) => r.isSale && r.completed).reduce((s, r) => s + r.amount, 0);
  const purchaseTotal = rows.filter((r) => !r.isSale && r.completed).reduce((s, r) => s + r.amount, 0);
  const savingsTotal = rows
    .filter((r) => r.completed && r.saving != null && r.saving > 0)
    .reduce((s, r) => s + (r.saving ?? 0), 0);

  // Chart nur mit abgeschlossenen Transaktionen (offene sind kein Umsatz)
  const points: UmsatzPoint[] = rows
    .filter((r) => r.completed)
    .map((r) => ({
      date: r.date.toISOString(),
      kind: r.isSale ? ("sale" as const) : ("purchase" as const),
      amount: r.amount,
      saving: r.saving != null && r.saving > 0 ? r.saving : undefined,
    }));

  const analyticsUnlocked = hasAnalytics(
    activeTier({
      membershipTier: user?.membershipTier ?? null,
      membershipValidUntil: user?.membershipValidUntil ?? null,
    }),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-brand-600" />
          <h1 className="page-title">{t("rev.title")}</h1>
        </div>
        <a
          href={withBasePath("/api/umsaetze/export")}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Download size={14} /> {t("rev.exportCsv")}
        </a>
      </div>

      {/* Summen */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="eyebrow">{t("rev.salesCompleted")}</div>
          <div className="stat-value mt-1 text-blue-700">{formatCurrency(salesTotal, currency)}</div>
        </div>
        <div className="card">
          <div className="eyebrow">{t("rev.purchasesCompleted")}</div>
          <div className="stat-value mt-1 text-amber-700">{formatCurrency(purchaseTotal, currency)}</div>
        </div>
        <div className="card">
          <div className="eyebrow">{t("rev.savedByswitch")}</div>
          <div className="stat-value mt-1 text-amber-600">{formatCurrency(savingsTotal, currency)}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {t("rev.vsPrevProduct")}
          </div>
        </div>
      </div>

      {/* Chart — Analysen nur mit Stufe Pro/Marke */}
      {analyticsUnlocked ? (
        <div className="card">
          <UmsatzChart points={points} currency={currency} />
        </div>
      ) : (
        <div className="card flex flex-col items-start gap-2 border-dashed">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock size={16} className="text-slate-400" />
            {t("rev.analyticsTitle")}
          </div>
          <p className="text-sm text-slate-600">
            {t("rev.analyticsBodyPre")} <strong>Pro</strong> {t("rev.analyticsAnd")}{" "}
            <strong>{t("rev.tierMarke")}</strong>. {t("rev.analyticsBodyPost")}
          </p>
          <Link
            href="/mitgliedschaft"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("rev.switchToPro")}
          </Link>
        </div>
      )}

      {/* Alle Transaktionen */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">{t("rev.colDate")}</th>
              <th className="px-4 py-3">{t("rev.colType")}</th>
              <th className="px-4 py-3">{t("rev.colProduct")}</th>
              <th className="px-4 py-3">{t("rev.colCounterpart")}</th>
              <th className="px-4 py-3">{t("rev.colQuantity")}</th>
              <th className="px-4 py-3 text-right">{t("rev.colAmount")}</th>
              <th className="px-4 py-3 text-right">{t("rev.colSaving")}</th>
              <th className="px-4 py-3">{t("rev.colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-slate-600">
                  <Link href={`/transactions/${r.id}`} className="hover:underline">
                    {r.date.toLocaleDateString("de-DE")}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`chip ${r.isSale ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {r.isSale ? t("rev.sale") : t("rev.purchase")}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.product}</td>
                <td className="px-4 py-3 text-slate-600">{r.counterpart}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.quantity.toLocaleString("de-DE")} {r.unit}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatCurrency(r.amount, currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  {!r.isSale ? (
                    <div className="space-y-1">
                      {r.saving != null && (
                        <div
                          className={`font-semibold ${r.saving >= 0 ? "text-amber-600" : "text-red-600"}`}
                          title={fill(t("rev.replacesTitle"), {
                            name: r.replacedProductName ?? "?",
                            price: r.replacedPricePerUnit?.toFixed(2) ?? "",
                            unit: r.unit,
                          })}
                        >
                          {r.saving >= 0 ? "+" : ""}
                          {formatCurrency(r.saving, currency)}
                        </div>
                      )}
                      <SavingsEditor
                        transactionId={r.id}
                        unit={r.unit}
                        initialName={r.replacedProductName}
                        initialPrice={r.replacedPricePerUnit}
                      />
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{t(`rev.status.${r.status}`)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  {t("rev.emptyTransactions")}{" "}
                  <Link href="/listings" className="font-medium text-brand-700 hover:underline">
                    {t("dash.leerTxLink")}
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
