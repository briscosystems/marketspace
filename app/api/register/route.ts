import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findPseudonymLeak } from "@/lib/pseudonym";
import { getAllSettings, grantCredits } from "@/lib/credits";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  pseudonym: z.string().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
  role: z.enum(["RESELLER", "OEM", "ENDKUNDE"]).default("RESELLER"),
  companyName: z.string().min(2),
  vatId: z.string().optional(),
  country: z.string().length(2),
  // Empfehlungs-Code = Pseudonym des Werbers (optional, aus ?ref=…)
  referralCode: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, pseudonym, role, companyName, vatId, country, referralCode } =
    parsed.data;

  // Schutz: Pseudonym darf die Identität nicht verraten (Firma, E-Mail,
  // USt-ID, bekannter Hersteller) — sonst kann die Plattform umgangen werden.
  const manufacturers = await prisma.manufacturer.findMany({
    select: { name: true },
  });
  const leak = findPseudonymLeak(pseudonym, {
    companyName,
    email,
    vatId,
    manufacturerNames: manufacturers.map((m) => m.name),
  });
  if (leak) {
    return NextResponse.json({ error: leak }, { status: 422 });
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { pseudonym }] },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Email oder Pseudonym bereits vergeben" },
      { status: 409 }
    );
  }

  // Monetarisierungs-Einstellungen (Superadmin) → Trial + Startguthaben
  const settings = await getAllSettings();
  const trialEndsAt = new Date(Date.now() + settings.trialDays * 24 * 60 * 60 * 1000);

  // Referral: Empfehlungs-Code ist das Pseudonym des Werbers
  const referrer = referralCode
    ? await prisma.user.findUnique({
        where: { pseudonym: referralCode },
        select: { id: true, pseudonym: true },
      })
    : null;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      pseudonym,
      role,
      companyName,
      vatId,
      country: country.toUpperCase(),
      trialEndsAt,
      referredById: referrer?.id,
    },
    select: { id: true, pseudonym: true, role: true },
  });

  // Startguthaben für die Kennenlernphase
  if (settings.welcomeCredits > 0) {
    await grantCredits(
      user.id,
      settings.welcomeCredits,
      "WELCOME",
      "Startguthaben Kennenlernphase",
    );
  }
  // Referral-Prämie für den Werber
  if (referrer && settings.referralCredits > 0) {
    await grantCredits(
      referrer.id,
      settings.referralCredits,
      "REFERRAL",
      `Neukunde geworben: ${user.pseudonym}`,
    );
  }

  return NextResponse.json(user, { status: 201 });
}
