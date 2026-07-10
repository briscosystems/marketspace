import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UmsatzChart, type UmsatzPoint } from "@/components/UmsatzChart";
import { SavingsEditor } from "@/components/SavingsEditor";
import { currencyForUser, convertCurrency, formatCurrency } from "@/lib/currency";
import { transactionProductLabel } from "@/lib/transaction-label";
import { withBasePath } from "@/lib/base-path";
import { Wallet, Download } from "lucide-react";

export const metadata = { title: "Meine Umsätze — Brisco Marketplace" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "offen",
  SHIPPED: "versendet",
  COMPLETED: "abgeschlossen",
  CANCELED: "storniert",
  DISPUTED: "reklamiert",
};

export default async function UmsaetzePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        Bitte zuerst{" "}
        <Link href="/login" className="text-brand-600 hover:underline">einloggen</Link>.
      </div>
    );
  }
  const userId = session.user.id;

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, preferredCurrency: true },
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-brand-600" />
          <h1 className="page-title">Meine Umsätze</h1>
        </div>
        <a
          href={withBasePath("/api/umsaetze/export")}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Download size={14} /> CSV exportieren
        </a>
      </div>

      {/* Summen */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-sm text-slate-500">Verkäufe (abgeschlossen)</div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(salesTotal, currency)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Käufe (abgeschlossen)</div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(purchaseTotal, currency)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Eingespart durch Produktwechsel</div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(savingsTotal, currency)}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            gegenüber dem vorher eingesetzten Produkt
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <UmsatzChart points={points} currency={currency} />
      </div>

      {/* Alle Transaktionen */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Art</th>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">Gegenseite</th>
              <th className="px-4 py-3">Menge</th>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3 text-right">Einsparung</th>
              <th className="px-4 py-3">Status</th>
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
                    {r.isSale ? "Verkauf" : "Kauf"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.product}</td>
                <td className="px-4 py-3 text-slate-600">{r.counterpart}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.quantity.toLocaleString("de-CH")} {r.unit}
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
                          title={`ersetzt: ${r.replacedProductName ?? "?"} (${r.replacedPricePerUnit?.toFixed(2)} €/${r.unit})`}
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
                <td className="px-4 py-3 text-slate-600">{STATUS_LABEL[r.status] ?? r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Noch keine Transaktionen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
