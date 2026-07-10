// GET /api/cron/membership-reminders
// Von einem externen Scheduler täglich aufzurufen (z.B. Railway Cron Jobs
// oder ein Vercel-Cron), Header "Authorization: Bearer <CRON_SECRET>".
// Erinnert ~30 Tage vor automatischer Abo-Verlängerung — einheitliche Frist
// für alle Länder (deckt die strengste bekannte gesetzliche Frist ab,
// Frankreich Art. L215-1 Code de la consommation: 1–3 Monate vorher; siehe
// lib/membership-emails.ts für den vollen rechtlichen Hintergrund).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { getMembershipPriceEur } from "@/lib/membership";
import { sendEmail } from "@/lib/mailer";
import { renewalReminderEmail, MEMBERSHIP_REMINDER_DAYS_BEFORE } from "@/lib/membership-emails";
import { appBaseUrl } from "@/lib/stripe";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const target = new Date();
  target.setDate(target.getDate() + MEMBERSHIP_REMINDER_DAYS_BEFORE);
  const windowStart = new Date(target);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(target);
  windowEnd.setHours(23, 59, 59, 999);

  // Nur Nutzer, deren Abo tatsächlich automatisch verlängert wird (kein
  // Reminder für bereits gekündigte Abos) und die für dieses Verlängerungs-
  // Datum noch keine Erinnerung erhalten haben (Idempotenz bei mehrfachem
  // Cron-Lauf am selben Tag).
  const candidates = await prisma.user.findMany({
    where: {
      membershipValidUntil: { gte: windowStart, lte: windowEnd },
      membershipCancelAtPeriodEnd: false,
      stripeSubscriptionId: { not: null },
    },
    select: { id: true, email: true, pseudonym: true, membershipValidUntil: true },
  });

  const priceEur = await getMembershipPriceEur();
  const priceLabel = formatCurrency(priceEur, "EUR");
  let sent = 0;

  for (const user of candidates) {
    const alreadyReminded = await prisma.emailLog.findFirst({
      where: {
        userId: user.id,
        kind: "MEMBERSHIP_RENEWAL_REMINDER",
        createdAt: { gte: windowStart },
      },
    });
    if (alreadyReminded) continue;

    const email = renewalReminderEmail({
      pseudonym: user.pseudonym,
      renewalDate: user.membershipValidUntil!,
      priceLabel,
      cancelUrl: `${appBaseUrl()}/mitgliedschaft`,
    });
    await sendEmail({ userId: user.id, kind: "MEMBERSHIP_RENEWAL_REMINDER", to: user.email, ...email });
    sent++;
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
