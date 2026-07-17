// GET /api/admin/export?list=<name> — CSV-Download der Admin-Listen. Nur ADMIN.
//
// list = users | referrals | protection | emails
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { isMembershipActive } from "@/lib/membership";

function iso(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    // Wie die Admin-Seite selbst: Existenz nicht verraten.
    return new Response("not found", { status: 404 });
  }

  const list = new URL(req.url).searchParams.get("list") ?? "";
  const stamp = new Date().toISOString().slice(0, 10);

  if (list === "users") {
    const users = await prisma.user.findMany({
      where: { role: { in: ["RESELLER", "OEM", "ENDKUNDE"] } },
      orderBy: [{ searchBoost: "desc" }, { pseudonym: "asc" }],
      select: {
        pseudonym: true, email: true, companyName: true, vatId: true, country: true,
        role: true, trustTier: true, searchBoost: true, creditBalance: true,
        membershipTier: true, membershipValidUntil: true, trialEndsAt: true,
        createdAt: true, _count: { select: { listings: true } },
      },
    });
    const csv = toCsv(
      ["Pseudonym", "Email", "Firma", "USt-ID", "Land", "Rolle", "Vertrauensstufe",
       "Boost", "Credits", "Abo-Stufe", "Abo aktiv", "Abo gültig bis", "Trial bis",
       "Angebote", "Registriert"],
      users.map((u) => [
        u.pseudonym, u.email, u.companyName, u.vatId ?? "", u.country, u.role,
        u.trustTier, u.searchBoost, u.creditBalance, u.membershipTier ?? "",
        isMembershipActive(u.membershipValidUntil) ? "ja" : "nein",
        iso(u.membershipValidUntil), iso(u.trialEndsAt), u._count.listings, iso(u.createdAt),
      ]),
    );
    return csvResponse(`brisco-kunden-${stamp}.csv`, csv);
  }

  if (list === "referrals") {
    const codes = await prisma.referralCode.findMany({ orderBy: { createdAt: "desc" } });
    const csv = toCsv(
      ["Code", "Credits", "Max. Einlösungen", "Eingelöst", "Aktiv", "Gültig bis", "Vermerk", "Erstellt"],
      codes.map((c) => [
        c.code, c.credits, c.maxUses ?? "", c.usedCount, c.active ? "ja" : "nein",
        iso(c.expiresAt), c.note ?? "", iso(c.createdAt),
      ]),
    );
    return csvResponse(`brisco-referral-codes-${stamp}.csv`, csv);
  }

  if (list === "protection") {
    const cases = await prisma.transaction.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        buyer: { select: { pseudonym: true } },
        seller: { select: { pseudonym: true } },
        listing: { select: { manufacturer: true, productName: true } },
        rfq: { select: { manufacturer: true, productType: true } },
      },
    });
    const csv = toCsv(
      ["Transaktion", "Käufer", "Verkäufer", "Produkt", "Betrag EUR", "Status", "Käuferschutz", "Aktualisiert"],
      cases.map((tx) => [
        tx.id, tx.buyer.pseudonym, tx.seller.pseudonym,
        tx.listing ? `${tx.listing.manufacturer} ${tx.listing.productName}` :
          tx.rfq ? `${tx.rfq.manufacturer} ${tx.rfq.productType}` : "",
        tx.totalEur, tx.status, tx.protectionStatus ?? "", iso(tx.updatedAt),
      ]),
    );
    return csvResponse(`brisco-transaktionen-${stamp}.csv`, csv);
  }

  if (list === "emails") {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, kind: true, to: true, subject: true },
    });
    const csv = toCsv(
      ["Datum", "Art", "An", "Betreff"],
      logs.map((e) => [e.createdAt.toISOString(), e.kind, e.to, e.subject]),
    );
    return csvResponse(`brisco-emails-${stamp}.csv`, csv);
  }

  return new Response("unbekannte Liste", { status: 400 });
}
