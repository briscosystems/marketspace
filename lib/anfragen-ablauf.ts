/**
 * Abgelaufene Anfragen: Status setzen und den Einkäufer benachrichtigen.
 *
 * Betreiber 2026-08-12: „Wenn Anfragen aufgrund des Datums abgelaufen sind, so
 * muss der User informiert werden und das Angebot auf ausgelaufen stehen."
 *
 * Vorher blieb eine Anfrage nach der Frist auf „offen" stehen — für Anbieter
 * sah es aus, als könnte man noch anbieten, und der Einkäufer erfuhr nie, dass
 * seine Frist verstrichen ist.
 *
 * Ablauf:
 *  1. Alle Anfragen mit Status OPEN und verstrichener Frist heraussuchen.
 *  2. Jede EINZELN umstellen (`updateMany` mit Status-Bedingung). Nur wenn
 *     genau diese Zeile umgestellt wurde, geht auch eine E-Mail raus — so
 *     verschickt ein zweiter Aufruf im selben Moment keine zweite Mail.
 *  3. E-Mail an den Einkäufer; sie landet wie jede andere im EmailLog.
 *
 * Die Funktion wird beim Aufruf der Anfragenseiten und beim Deploy ausgeführt
 * und **wirft nie** — eine hängende Mail darf keine Seite zerlegen.
 */
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

const BASIS_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://markt.brisco.ch";

export async function anfragenAblaufenLassen(): Promise<number> {
  try {
    const faellig = await prisma.rfq.findMany({
      where: { status: "OPEN", deadline: { lt: new Date() } },
      select: {
        id: true,
        productType: true,
        productName: true,
        manufacturer: true,
        quantity: true,
        quantityUnit: true,
        deadline: true,
        buyerId: true,
        buyer: { select: { email: true, pseudonym: true } },
        _count: { select: { offers: true } },
      },
      take: 200,
    });
    if (faellig.length === 0) return 0;

    let umgestellt = 0;
    for (const a of faellig) {
      const treffer = await prisma.rfq.updateMany({
        where: { id: a.id, status: "OPEN" },
        data: { status: "EXPIRED" },
      });
      if (treffer.count !== 1) continue; // jemand anderes war schneller
      umgestellt++;

      const bezeichnung = [a.manufacturer, a.productName ?? a.productType]
        .filter(Boolean)
        .join(" ");
      const angebote =
        a._count.offers === 0
          ? "Es ist kein Angebot eingegangen."
          : a._count.offers === 1
            ? "Es liegt 1 Angebot vor — du kannst es weiterhin ansehen."
            : `Es liegen ${a._count.offers} Angebote vor — du kannst sie weiterhin ansehen.`;

      await sendEmail({
        userId: a.buyerId,
        kind: "RFQ_EXPIRED",
        to: a.buyer.email,
        subject: `Deine Anfrage ist ausgelaufen: ${bezeichnung}`,
        body:
          `Hallo ${a.buyer.pseudonym},\n\n` +
          `die Frist deiner Anfrage ist am ${a.deadline.toLocaleDateString("de-CH")} abgelaufen. ` +
          `Sie steht jetzt auf „ausgelaufen" und wird Anbietern nicht mehr als offen angezeigt.\n\n` +
          `Anfrage: ${bezeichnung}\n` +
          `Menge: ${a.quantity} ${a.quantityUnit}\n` +
          `${angebote}\n\n` +
          `Du brauchst das Produkt noch? Stell die Anfrage einfach neu ein:\n` +
          `${BASIS_URL}/rfqs/new\n\n` +
          `Zur Anfrage: ${BASIS_URL}/rfqs/${a.id}\n\n` +
          `Brisco Marketplace\n`,
      }).catch(() => ({ sent: false }));
    }
    return umgestellt;
  } catch {
    // Bewusst still: Diese Aufräumarbeit darf nie eine Seite oder einen
    // Deploy scheitern lassen.
    return 0;
  }
}
