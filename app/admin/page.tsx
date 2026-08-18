import Link from "next/link";
import { BlockUserButton } from "@/components/admin/BlockUserButton";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
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
  approveExperience,
  rejectExperience,
  editExperience,
  deleteExperience,
  deleteExperienceMedia,
  deleteListingPhoto,
  approveProductSubmission,
  answerProblemCase,
  closeProblemCase,
  deleteProblemCase,
  adminDeleteListing,
  createCreditAktion,
  redactMessage,
  deleteMessage,
  toggleCreditAktion,
  adminDeleteRfq,
  rejectProductSubmission,
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
  // Alle Erfahrungsberichte — offene zuerst. Der Betreiber sieht nicht nur die
  // Warteschlange, sondern die ganze Sammlung inklusive Bildern, KI-Vorurteil
  // und Bearbeitungsvermerk (Betreiber 2026-08-10).
  const alleErfahrungen = await prisma.experienceReport.findMany({
    select: {
      id: true,
      text: true,
      source: true,
      status: true,
      aiVerdict: true,
      aiNote: true,
      adminNote: true,
      problems: true,
      machine: true,
      outcome: true,
      productFreetext: true,
      createdAt: true,
      creditsAwarded: true,
      user: { select: { pseudonym: true, email: true } },
      product: { select: { name: true, manufacturer: { select: { name: true } } } },
      media: { select: { id: true, kind: true, data: true, caption: true, anonymisiert: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 200,
  });
  const offeneErfahrungen = alleErfahrungen.filter((e) => e.status === "PENDING");

  // Problemfälle: was Anwender geschildert und beigelegt haben (2026-08-12).
  const problemFaelle = await prisma.problemCase.findMany({
    select: {
      id: true,
      text: true,
      machine: true,
      links: true,
      aiVerdict: true,
      aiSummary: true,
      status: true,
      adminNote: true,
      createdAt: true,
      productFreetext: true,
      product: { select: { name: true, manufacturer: { select: { name: true } } } },
      user: { select: { pseudonym: true } },
      files: { select: { id: true, kind: true, name: true, data: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
  });
  const offeneFaelle = problemFaelle.filter((f) => f.status === "OFFEN");
  const unklareFaelle = problemFaelle.filter((f) => f.aiVerdict === "UNKLAR" && f.status === "OFFEN");

  // Von Anbietern gemeldete Produkte — mit Pflicht-Belegen (2026-08-11).
  const produktMeldungen = await prisma.productSubmission.findMany({
    select: {
      id: true,
      name: true,
      manufacturer: true,
      productType: true,
      chemistry: true,
      isoViscosity: true,
      sdsFileName: true,
      tdsFileName: true,
      sdsFile: true,
      tdsFile: true,
      status: true,
      adminNote: true,
      createdAt: true,
      user: { select: { pseudonym: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
  const offeneMeldungen = produktMeldungen.filter((m) => m.status === "PENDING");

  // Angebotsfotos: neueste zuerst. Anbieter können ihre eigenen Fotos selbst
  // löschen — hier hat der Betreiber zusätzlich das Eingriffsrecht
  // (Betreiber 2026-08-10).
  // Neueste Chat-Nachrichten — Notfall-Eingriff (2026-08-16).
  const letzteNachrichten = await prisma.message.findMany({
    select: {
      id: true,
      body: true,
      createdAt: true,
      sender: { select: { pseudonym: true } },
      conversation: {
        select: {
          buyer: { select: { pseudonym: true } },
          seller: { select: { pseudonym: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  // Anmelde-Aktionen (Messe usw.) — Verwaltung im Abschnitt „Aktionen".
  const alleAktionen = await prisma.creditAktion.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Alle Angebote und Suchen — der Betreiber muss Inhalte löschen können,
  // z. B. Fake-Angebote aus der Aufbauphase (2026-08-14).
  const alleAngebote = await prisma.listing.findMany({
    select: {
      id: true,
      productName: true,
      manufacturer: true,
      productType: true,
      status: true,
      quantity: true,
      quantityUnit: true,
      createdAt: true,
      seller: { select: { pseudonym: true, email: true } },
      _count: { select: { transactions: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const alleSuchen = await prisma.rfq.findMany({
    select: {
      id: true,
      productType: true,
      productName: true,
      manufacturer: true,
      status: true,
      quantity: true,
      quantityUnit: true,
      createdAt: true,
      buyer: { select: { pseudonym: true, email: true } },
      _count: { select: { offers: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const angebotsFotos = await prisma.listingPhoto.findMany({
    select: {
      id: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          productName: true,
          seller: { select: { pseudonym: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const erfahrungsStatistik = {
    gesamt: alleErfahrungen.length,
    offen: offeneErfahrungen.length,
    freigegeben: alleErfahrungen.filter((e) => e.status === "APPROVED").length,
    abgelehnt: alleErfahrungen.filter((e) => e.status === "REJECTED").length,
    mitBild: alleErfahrungen.filter((e) => e.media.length > 0).length,
    kiUnklar: alleErfahrungen.filter((e) => e.aiVerdict === "UNCLEAR").length,
    kiUnplausibel: alleErfahrungen.filter((e) => e.aiVerdict === "IMPLAUSIBLE").length,
  };
  const [users, settings, usageAgg, purchaseAgg, referralCodes, revenueByUser, emailLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["RESELLER", "OEM", "ENDKUNDE"] } },
      select: {
        id: true,
        pseudonym: true,
        email: true,
        companyName: true,
        role: true,
        trustTier: true,
        searchBoost: true,
        creditBalance: true,
        trialEndsAt: true,
        membershipTier: true,
        membershipValidUntil: true,
        blockedAt: true,
        blockedReason: true,
        _count: { select: { listings: true, referrals: true, buyerTxns: true, sellerTxns: true } },
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
      select: {
        sent: true,
        sendError: true, id: true, kind: true, to: true, subject: true, createdAt: true },
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
      </section>

      {/* Abo-Übersicht: wie viele Kunden auf welcher Stufe stehen. „Aktiv" heißt
          bezahlte Stufe mit gültigem Ablaufdatum; abgelaufene Stufen zählen als
          „ohne Zugang". */}
      <section className="card">
        <h2 className="section-title">Kunden nach Abo-Stufe</h2>
        {(() => {
          const jetzt = Date.now();
          const aktiv = (u: (typeof users)[number]) =>
            !!u.membershipValidUntil && u.membershipValidUntil.getTime() > jetzt;
          const marke = users.filter((u) => aktiv(u) && u.membershipTier === "MARKE").length;
          const pro = users.filter((u) => aktiv(u) && u.membershipTier === "PRO").length;
          const basis = users.filter(
            (u) => aktiv(u) && (u.membershipTier === "BASIS" || !u.membershipTier),
          ).length;
          const trial = users.filter(
            (u) => !aktiv(u) && !!u.trialEndsAt && u.trialEndsAt.getTime() > jetzt,
          ).length;
          const ohne = users.filter(
            (u) => !aktiv(u) && !(u.trialEndsAt && u.trialEndsAt.getTime() > jetzt),
          ).length;
          const gesperrt = users.filter((u) => u.blockedAt).length;
          const kachel = (label: string, wert: number, extra = "") => (
            <div className={`rounded-xl border border-slate-200 bg-white p-4 ${extra}`}>
              <div className="eyebrow">{label}</div>
              <div className="stat-value mt-1">{wert}</div>
            </div>
          );
          return (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
              {kachel("Marke", marke)}
              {kachel("Pro", pro)}
              {kachel("Basis", basis)}
              {kachel("Kennenlernphase", trial)}
              {kachel("Ohne Zugang", ohne)}
              {kachel("Gesperrt", gesperrt, gesperrt > 0 ? "border-red-300 bg-red-50" : "")}
            </div>
          );
        })()}
        <p className="mt-2 text-xs text-slate-500">
          {users.length} Kundenkonten gesamt (ohne Admin). „Basis" umfasst auch aktive Abos ohne
          gesetzte Stufe.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Problemfälle{" "}
          <span className="text-sm font-normal text-slate-500">
            ({offeneFaelle.length} offen, davon {unklareFaelle.length} von der KI bewusst offen gelassen)
          </span>
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Anwender schildern ihr Problem und legen Fotos, Datenblätter, Sicherheitsdatenblätter,
          Laborberichte und Links bei. Die KI grenzt ein und rät nicht — was sie nicht belegen kann,
          landet hier zur Beantwortung von Hand.
        </p>
        {problemFaelle.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Fälle.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {problemFaelle.map((f) => (
              <div key={f.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      f.aiVerdict === "EINGEGRENZT"
                        ? "bg-emerald-100 text-emerald-900"
                        : f.aiVerdict === "UNKLAR"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {f.aiVerdict === "EINGEGRENZT"
                      ? "KI: eingegrenzt"
                      : f.aiVerdict === "UNKLAR"
                        ? "KI: unklar → prüfen"
                        : "ohne KI-Prüfung"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {f.status === "OFFEN" ? "offen" : f.status === "BEANTWORTET" ? "beantwortet" : "geschlossen"}
                  </span>
                  <span className="font-medium text-slate-800">
                    {f.product
                      ? `${f.product.manufacturer.name} ${f.product.name}`
                      : f.productFreetext || "ohne Produktangabe"}
                  </span>
                  {f.machine && <span>· {f.machine}</span>}
                  <span className="ml-auto">
                    {f.user.pseudonym} · {f.createdAt.toLocaleDateString("de-CH")}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{f.text}</p>
                {f.aiSummary && (
                  <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    <strong>KI:</strong> {f.aiSummary}
                  </p>
                )}
                {f.links.length > 0 && (
                  <ul className="mt-1 text-xs text-blue-700">
                    {f.links.map((l) => (
                      <li key={l}>
                        <a href={l} target="_blank" rel="noreferrer" className="underline">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {f.files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {f.files.map((datei) =>
                      datei.kind === "FOTO" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={datei.id} href={datei.data} target="_blank" rel="noreferrer">
                          <img
                            src={datei.data}
                            alt={datei.name}
                            className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        </a>
                      ) : (
                        <a
                          key={datei.id}
                          href={datei.data}
                          download={datei.name}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200"
                        >
                          {datei.name}
                        </a>
                      ),
                    )}
                  </div>
                )}
                {f.adminNote && (
                  <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-900">
                    <strong>Antwort:</strong> {f.adminNote}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  <form action={answerProblemCase} className="flex flex-1 gap-1">
                    <input type="hidden" name="id" value={f.id} />
                    <input
                      type="text"
                      name="antwort"
                      placeholder="Antwort an den Anwender"
                      className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Antworten
                    </button>
                  </form>
                  <form action={closeProblemCase}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Schließen
                    </button>
                  </form>
                  <form action={deleteProblemCase}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Gemeldete Produkte{" "}
          <span className="text-sm font-normal text-slate-500">
            ({offeneMeldungen.length} offen, {produktMeldungen.length} gesamt)
          </span>
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Anbieter melden Produkte, die noch nicht im Katalog stehen. Datenblatt und
          Sicherheitsdatenblatt sind Pflicht; der Melder hat bestätigt, dass die Angaben stimmen
          und wir die Unterlagen verwenden dürfen. Freigabe legt das Produkt im Katalog an.
        </p>
        {produktMeldungen.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Meldungen.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {produktMeldungen.map((m) => (
              <div key={m.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-800">
                    {m.manufacturer} {m.name}
                  </span>
                  <span>· {m.productType}</span>
                  {m.chemistry && <span>· {m.chemistry}</span>}
                  {m.isoViscosity && <span>· ISO {m.isoViscosity}</span>}
                  <span className="ml-auto">
                    {m.user.pseudonym} · {m.createdAt.toLocaleDateString("de-CH")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      m.status === "PENDING"
                        ? "bg-amber-100 text-amber-900"
                        : m.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-50 text-red-800"
                    }`}
                  >
                    {m.status === "PENDING" ? "offen" : m.status === "APPROVED" ? "freigegeben" : "abgelehnt"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={m.tdsFile}
                    download={m.tdsFileName}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    Datenblatt: {m.tdsFileName}
                  </a>
                  <a
                    href={m.sdsFile}
                    download={m.sdsFileName}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    Sicherheitsdatenblatt: {m.sdsFileName}
                  </a>
                </div>
                {m.status === "PENDING" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={approveProductSubmission}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Freigeben (Produkt anlegen)
                      </button>
                    </form>
                    <form action={rejectProductSubmission} className="flex gap-1">
                      <input type="hidden" name="id" value={m.id} />
                      <input
                        type="text"
                        name="grund"
                        placeholder="Grund (intern)"
                        className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                      >
                        Ablehnen
                      </button>
                    </form>
                  </div>
                )}
                {m.adminNote && <p className="mt-1 text-xs text-slate-500">{m.adminNote}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Chat-Aufsicht</h2>
        <p className="mb-3 text-xs text-slate-500">
          Die 40 neuesten Nachrichten. Nur für den Notfall (Beleidigung, Kontaktdaten-Tausch,
          versehentlich geteilte Geheimnisse): „Entfernen" ersetzt den Text durch einen sichtbaren
          Vermerk — beide Seiten sehen, dass eingegriffen wurde. „Löschen" entfernt die Nachricht
          ganz.
        </p>
        {letzteNachrichten.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Nachrichten.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {letzteNachrichten.map((m) => (
              <div key={m.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
                <span className="text-xs text-slate-500">
                  {m.createdAt.toLocaleString("de-CH")} · {m.sender.pseudonym} →{" "}
                  {m.conversation.buyer.pseudonym === m.sender.pseudonym
                    ? m.conversation.seller.pseudonym
                    : m.conversation.buyer.pseudonym}
                </span>
                <p className="w-full whitespace-pre-line text-slate-800">
                  {m.body.slice(0, 500)}
                  {m.body.length > 500 ? "…" : ""}
                </p>
                <div className="flex gap-2">
                  <form action={redactMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                    >
                      Entfernen (mit Vermerk)
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Anmelde-Aktionen</h2>
        <p className="mb-3 text-xs text-slate-500">
          Zeitlich begrenzte Gutschriften für Neuanmeldungen — z. B. die Messe-Aktion. Ohne Code
          gilt die Aktion für jede Anmeldung im Zeitraum; mit Code nur bei Eingabe des Codes.
          Beträge in Euro; gespeichert wird in Credits (1 Credit = 0,10&nbsp;€).
        </p>

        <form action={createCreditAktion} className="mb-4 grid gap-2 sm:grid-cols-6">
          <input name="titel" placeholder="Titel (z. B. Messe Herbst 2026)" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" />
          <input name="code" placeholder="Code (leer = ohne Code)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <input name="eurAnmeldung" placeholder="€ je Anmeldung" required inputMode="decimal" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <input name="eurEmpfehlung" placeholder="€ je Empfehlung" inputMode="decimal" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <div className="flex gap-2 sm:col-span-6">
            <label className="flex items-center gap-1 text-xs text-slate-600">von
              <input type="date" name="von" required className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-600">bis
              <input type="date" name="bis" required className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </label>
            <button type="submit" className="ml-auto rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
              Aktion anlegen
            </button>
          </div>
        </form>

        {alleAktionen.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Aktionen.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {alleAktionen.map((a) => {
              const jetzt = new Date();
              const laeuft = a.active && a.startsAt <= jetzt && a.endsAt >= jetzt;
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="font-medium text-slate-900">{a.titel}</span>
                  {a.code && <code className="rounded bg-slate-100 px-1.5 text-xs">{a.code}</code>}
                  <span className="text-xs text-slate-500">
                    {(a.creditsAnmeldung / 10).toFixed(0)} € je Anmeldung
                    {a.creditsEmpfehlung > 0 && ` · ${(a.creditsEmpfehlung / 10).toFixed(0)} € je Empfehlung`}
                    {" · "}
                    {a.startsAt.toLocaleDateString("de-CH")} – {a.endsAt.toLocaleDateString("de-CH")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      laeuft
                        ? "bg-emerald-100 text-emerald-900"
                        : a.active
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {laeuft ? "läuft" : a.active ? "außerhalb Zeitraum" : "beendet"}
                  </span>
                  <form action={toggleCreditAktion} className="ml-auto">
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      {a.active ? "Beenden" : "Reaktivieren"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Angebote &amp; Suchen verwalten{" "}
          <span className="text-sm font-normal text-slate-500">
            ({alleAngebote.length} Angebote, {alleSuchen.length} Suchen)
          </span>
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Löschen entfernt den Eintrag endgültig. Gespräche und abgeschlossene Transaktionen
          bleiben erhalten — nur ihr Verweis auf den Eintrag wird geleert.
        </p>

        <h3 className="mb-1 text-sm font-semibold text-slate-800">Angebote</h3>
        {alleAngebote.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Angebote.</p>
        ) : (
          <div className="mb-4 divide-y divide-slate-100">
            {alleAngebote.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <Link href={`/listings/${l.id}`} className="font-medium text-slate-900 hover:underline">
                  {l.manufacturer} {l.productName}
                </Link>
                <span className="text-xs text-slate-500">
                  · {l.productType} · {l.quantity} {l.quantityUnit}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    l.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {l.status}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {l.seller.pseudonym} ({l.seller.email}) · {l.createdAt.toLocaleDateString("de-CH")}
                  {l._count.transactions > 0 && ` · ${l._count.transactions} Transaktion(en)`}
                  {l._count.conversations > 0 && ` · ${l._count.conversations} Gespräch(e)`}
                </span>
                <form action={adminDeleteListing}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                  >
                    Löschen
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <h3 className="mb-1 text-sm font-semibold text-slate-800">Suchen</h3>
        {alleSuchen.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Suchen.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {alleSuchen.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <Link href={`/rfqs/${r.id}`} className="font-medium text-slate-900 hover:underline">
                  {[r.manufacturer, r.productName ?? r.productType].filter(Boolean).join(" ")}
                </Link>
                <span className="text-xs text-slate-500">
                  · {r.quantity} {r.quantityUnit}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "OPEN"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.status}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {r.buyer.pseudonym} ({r.buyer.email}) · {r.createdAt.toLocaleDateString("de-CH")}
                  {r._count.offers > 0 && ` · ${r._count.offers} Angebot(e) darauf`}
                </span>
                <form action={adminDeleteRfq}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                  >
                    Löschen
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Hochgeladene Angebotsfotos{" "}
            <span className="text-sm font-normal text-slate-500">
              (neueste {angebotsFotos.length})
            </span>
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Anbieter können ihre eigenen Fotos selbst löschen. Hier greift der Betreiber ein, wenn
            ein Bild nicht bleiben kann — fremdes Katalogbild, mitfotografierte Papiere, falsches
            Motiv.
          </p>
          {angebotsFotos.length === 0 ? (
            <p className="text-sm text-slate-500">Noch keine Fotos hochgeladen.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {angebotsFotos.map((f) => (
                <div key={f.id} className="w-28">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/listing-photos/${f.id}?v=klein`}
                      alt=""
                      className="h-28 w-28 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <form action={deleteListingPhoto} className="absolute right-1 top-1">
                      <input type="hidden" name="photoId" value={f.id} />
                      <button
                        type="submit"
                        title="Dieses Foto löschen"
                        className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs font-bold text-red-700 shadow hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-600" title={f.listing.productName}>
                    {f.listing.productName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400" title={f.listing.seller.email}>
                    {f.listing.seller.pseudonym}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      {/* Moderations-Warteschlange: Erfahrungsberichte freigeben (= Prämie
          gutschreiben) oder ablehnen. Jede geprüfte Erfahrung wird gleich
          belohnt — positiv wie negativ. */}
      {offeneErfahrungen.length > 0 && (
        <section className="card space-y-3">
          <h2 className="section-title">
            Erfahrungsberichte prüfen{" "}
            <span className="text-sm font-normal text-slate-500">({offeneErfahrungen.length} offen)</span>
          </h2>
          {/* Analyse über alle Berichte — nicht nur die Warteschlange
              (Betreiber 2026-08-10). */}
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {erfahrungsStatistik.gesamt} Berichte gesamt
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
              {erfahrungsStatistik.offen} offen
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900">
              {erfahrungsStatistik.freigegeben} freigegeben
            </span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-800">
              {erfahrungsStatistik.abgelehnt} abgelehnt
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-900">
              {erfahrungsStatistik.mitBild} mit Bild/Anhang
            </span>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-900">
              KI unklar: {erfahrungsStatistik.kiUnklar} · unplausibel: {erfahrungsStatistik.kiUnplausibel}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {alleErfahrungen.map((e) => (
              <div key={e.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{e.user.pseudonym}</span>
                  <span>({e.user.email})</span>
                  <span>
                    →{" "}
                    {e.product
                      ? `${e.product.manufacturer.name} ${e.product.name}`
                      : e.productFreetext ?? "ohne Produktbezug"}
                  </span>
                  {e.source === "VOICE" && <span className="chip bg-slate-100 text-slate-500">diktiert</span>}
                  <span className="ml-auto">{e.createdAt.toLocaleDateString("de-CH")}</span>
                </div>
                {/* Vor-Einschätzung der KI — Entscheidungshilfe, keine
                    Entscheidung. „unklar" heißt ausdrücklich: nicht geraten. */}
                {e.aiVerdict !== "NOT_CHECKED" && (
                  <p
                    className={`mt-1.5 rounded-lg px-2.5 py-1.5 text-xs ring-1 ${
                      e.aiVerdict === "PLAUSIBLE"
                        ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                        : e.aiVerdict === "IMPLAUSIBLE"
                          ? "bg-red-50 text-red-900 ring-red-200"
                          : "bg-amber-50 text-amber-900 ring-amber-200"
                    }`}
                  >
                    <strong>
                      KI-Vorprüfung:{" "}
                      {e.aiVerdict === "PLAUSIBLE"
                        ? "plausibel"
                        : e.aiVerdict === "IMPLAUSIBLE"
                          ? "unplausibel"
                          : "unklar — bitte selbst ansehen"}
                    </strong>
                    {e.aiNote ? ` · ${e.aiNote}` : ""}
                  </p>
                )}
                {(e.problems.length > 0 || e.machine || e.outcome) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-slate-600">
                    {e.problems.map((pr) => (
                      <span key={pr} className="rounded bg-slate-100 px-1.5 py-0.5">
                        {pr}
                      </span>
                    ))}
                    {e.machine && <span className="rounded bg-slate-100 px-1.5 py-0.5">{e.machine}</span>}
                    {e.outcome && <span className="rounded bg-slate-100 px-1.5 py-0.5">{e.outcome}</span>}
                  </div>
                )}
                <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-sm text-slate-800">
                  {e.text}
                </p>
                {/* Angehängte Bilder und Laborberichte — der Betreiber muss sie
                    sehen, bevor er freigibt. */}
                {e.media.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {e.media.map((m) =>
                      m.kind === "PHOTO" ? (
                        <div key={m.id} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.data}
                            alt={m.caption ?? ""}
                            className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                          {/* Einzelnes Bild entfernen, ohne den Bericht zu
                              verlieren (Betreiber 2026-08-10). */}
                          <form action={deleteExperienceMedia} className="absolute right-1 top-1">
                            <input type="hidden" name="mediaId" value={m.id} />
                            <button
                              type="submit"
                              title="Dieses Bild entfernen"
                              className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs font-bold text-red-700 shadow hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      ) : (
                        <a
                          key={m.id}
                          href={m.data}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
                        >
                          {m.kind === "VIDEO_LINK" ? "Video ansehen" : "Laborbericht öffnen"}
                          {m.kind === "LAB_REPORT" && !m.anonymisiert && (
                            <span className="ml-1 font-semibold text-red-700">· nicht als anonymisiert bestätigt</span>
                          )}
                        </a>
                      ),
                    )}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <form action={approveExperience}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Freigeben (+2 Credits)
                    </button>
                  </form>
                  <form action={rejectExperience} className="flex gap-1">
                    <input type="hidden" name="id" value={e.id} />
                    <input
                      type="text"
                      name="grund"
                      placeholder="Grund (intern)"
                      className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                    >
                      Ablehnen
                    </button>
                  </form>
                  {/* Betreiber-Rechte: jeden Bericht jederzeit korrigieren
                      (Tippfehler, versehentlich genannter Firmenname) oder
                      endgültig löschen (Betreiber 2026-08-10). */}
                  <details className="w-full">
                    <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                      Bearbeiten / löschen
                    </summary>
                    <form action={editExperience} className="mt-2 space-y-1">
                      <input type="hidden" name="id" value={e.id} />
                      <textarea
                        name="text"
                        defaultValue={e.text}
                        rows={4}
                        className="w-full rounded-md border border-slate-300 p-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Korrektur speichern
                      </button>
                    </form>
                    <form action={deleteExperience} className="mt-2">
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800"
                      >
                        Endgültig löschen
                      </button>
                    </form>
                    {e.adminNote && <p className="mt-1 text-xs text-slate-500">{e.adminNote}</p>}
                  </details>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card space-y-2">
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
                  <td colSpan={8} className="py-4 text-center text-slate-500">
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
                <div className="stat-value mt-1">
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
                <div className="stat-value mt-1">
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
                <div className="stat-value mt-1">
                  {aiTokensAll.toLocaleString("de-DE")}
                </div>
                <div className="text-xs text-slate-500">Input + Output + Cache</div>
              </div>
              <div className="card">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ø Kosten / Aufruf
                </div>
                <div className="stat-value mt-1">
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
          {/* Live-Beweis: Test-Mail — an das eigene Postfach oder gezielt an eine
              Adresse, bei der etwas nicht ankam (Betreiber 2026-08-18). */}
          {mailStatus.configured && (
            <form action={sendTestEmail} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="email"
                name="to"
                placeholder="Adresse (leer = an mich)"
                className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Mail size={14} />
                Test-E-Mail senden
              </button>
              <span className="text-xs text-slate-500">
                Ergebnis steht danach unten im Protokoll (Spalte „Versand").
              </span>
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
              <th className="px-4 py-3">Versand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emailLogs.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-slate-600">
                  {e.createdAt.toLocaleString("de-DE")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {{
                    MEMBERSHIP_RENEWAL_REMINDER: "Erinnerung",
                    MEMBERSHIP_RENEWED: "Bestätigung",
                    PASSWORD_RESET: "Passwort zurücksetzen",
                    ADMIN_NEW_USER: "Neue Registrierung",
                    RFQ_EXPIRED: "Anfrage ausgelaufen",
                  }[e.kind] ?? e.kind}
                </td>
                <td className="px-4 py-3 text-slate-600">{e.to}</td>
                <td className="px-4 py-3 text-slate-900">{e.subject}</td>
                <td className="px-4 py-3">
                  {e.sent === true ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">
                      versendet
                    </span>
                  ) : e.sent === false ? (
                    <span
                      title={e.sendError ?? "Grund unbekannt"}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 ring-1 ring-red-200"
                    >
                      fehlgeschlagen
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">unbekannt</span>
                  )}
                </td>
              </tr>
            ))}
            {emailLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
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

      {/* Karten statt Tabelle (Betreiber 2026-08-18): Acht Spalten mit Formularen
          liefen rechts aus dem Bild — die Sperre war nur per Scrollbalken
          erreichbar. Jede Zeile ist jetzt eine Karte, die sich umbricht. */}
      <section className="space-y-3">
        {users.length === 0 && (
          <p className="card text-center text-slate-500">Noch keine Kundenkonten vorhanden.</p>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className={`card space-y-3 ${
              u.blockedAt ? "bg-red-50/70" : u.searchBoost > 0 ? "bg-amber-50/60" : ""
            }`}
          >
            {/* Kopf: wer, Stufe, Zahlen */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold text-slate-900">{u.pseudonym}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {u.trustTier}
              </span>
              <span className="text-xs text-slate-500">
                {u.companyName ? `${u.companyName} · ` : ""}
                {u.email}
              </span>
              <span className="ml-auto text-xs text-slate-500">
                {u._count.listings} Angebote · {formatCurrency(revenueBySellerId.get(u.id) ?? 0, "EUR")} Umsatz
                {u._count.referrals > 0 ? ` · ${u._count.referrals} geworben` : ""}
              </span>
            </div>

            {u.blockedAt && (
              <p className="text-xs font-semibold text-red-700" title={u.blockedReason ?? undefined}>
                gesperrt seit {u.blockedAt.toLocaleDateString("de-CH")}
                {u.blockedReason ? ` · ${u.blockedReason}` : ""}
              </p>
            )}

            {/* Werkzeuge: umbrechen statt abschneiden */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <form action={updateSearchBoost} className="flex items-end gap-2">
                <label className="text-xs text-slate-500">
                  Boost (0–100)
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="number"
                    name="boost"
                    min={0}
                    max={100}
                    defaultValue={u.searchBoost}
                    className="mt-0.5 block w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Speichern
                </button>
              </form>

              <form action={adjustCredits} className="flex items-end gap-2">
                <label className="text-xs text-slate-500">
                  Credits: <strong className="text-slate-900">{u.creditBalance}</strong>
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="number"
                    name="amount"
                    placeholder="±"
                    className="mt-0.5 block w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  title="Credits gutschreiben (+) oder abziehen (−)"
                >
                  Buchen
                </button>
              </form>

              <form action={setTrialDays} className="flex items-end gap-2">
                <label className="text-xs text-slate-500">
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
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="number"
                    name="days"
                    min={0}
                    max={365}
                    placeholder="Trial-Tage"
                    className="mt-0.5 block w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  title="Trial ab heute auf X Tage setzen (0 = beenden)"
                >
                  Set
                </button>
              </form>

              <form action={setFreeMembership} className="flex items-end gap-2">
                <label className="text-xs text-slate-500">
                  Gratis-Konto
                  <input type="hidden" name="userId" value={u.id} />
                  <select
                    name="months"
                    defaultValue="12"
                    className="mt-0.5 block rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-sm text-emerald-900"
                  >
                    <option value="1">1 Monat</option>
                    <option value="3">3 Monate</option>
                    <option value="6">6 Monate</option>
                    <option value="12">12 Monate</option>
                    <option value="24">24 Monate</option>
                    <option value="36">36 Monate</option>
                    <option value="0">entfernen</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  title="Mitgliedschaft ab heute auf X Monate setzen"
                >
                  Gratis
                </button>
              </form>

              <div className="ml-auto flex items-end gap-2">
                <BlockUserButton userId={u.id} pseudonym={u.pseudonym} blocked={!!u.blockedAt} />
                {u.role !== "ADMIN" && (
                  <DeleteUserButton
                    userId={u.id}
                    pseudonym={u.pseudonym}
                    hatGeschaefte={(u._count.buyerTxns ?? 0) + (u._count.sellerTxns ?? 0) > 0}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
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
