import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePseudonym } from "@/lib/pseudonym";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendEmail } from "@/lib/mailer";
import { withBasePath } from "@/lib/base-path";

const rfqSchema = z.object({
  productType: z.string().min(2),
  manufacturer: z.string().optional(),
  isoViscosity: z.string().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]).optional(),
  applicationArea: z.string().optional(),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  locationRegion: z.string().min(2),
  deadline: z.string().datetime(),
  budgetMinEur: z.number().positive().optional(),
  budgetMaxEur: z.number().positive().optional(),
  notes: z.string().optional(),
  visibility: z.enum(["PUBLIC", "VERIFIED_ONLY"]).default("PUBLIC"),
  workpieceMaterial: z.string().optional(),
  requiredCertifications: z.array(z.string()).default([]),
  avoidIssues: z.array(z.string()).default([]),
  // Nur nötig, wenn niemand angemeldet ist: Anfragen sind ohne Konto möglich.
  email: z.string().email().optional(),
});

/**
 * Legt für eine anonyme Anfrage ein Konto an (oder findet ein bestehendes).
 *
 * Warum überhaupt ein Konto: Der Fragesteller muss die Antworten der Händler
 * lesen können — dafür braucht es einen Ort. Er soll dafür aber nicht VOR der
 * Anfrage ein Formular ausfüllen (Baymard: 18–26 % Abbruch allein durch
 * Kontozwang). Also: erst die Anfrage, das Konto entsteht dabei. Das Passwort
 * setzt er über denselben Link, den auch „Passwort vergessen" verschickt.
 */
async function kontoFuerAnfrage(email: string, origin: string): Promise<string> {
  const adresse = email.toLowerCase();
  const vorhanden = await prisma.user.findUnique({
    where: { email: adresse },
    select: { id: true },
  });
  if (vorhanden) return vorhanden.id;

  let pseudonym = generatePseudonym();
  for (let i = 0; i < 12; i++) {
    const belegt = await prisma.user.findUnique({ where: { pseudonym }, select: { id: true } });
    if (!belegt) break;
    pseudonym = generatePseudonym();
  }

  const nutzer = await prisma.user.create({
    data: {
      email: adresse,
      // Zufälliges Passwort: Es ist niemandem bekannt, auch uns nicht. Der
      // Zugang läuft über den Link zum Passwortsetzen aus der Bestätigungsmail.
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
      pseudonym,
      role: "ENDKUNDE",
      country: "CH",
    },
    select: { id: true, email: true },
  });

  const token = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: nutzer.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  const link = `${origin}${withBasePath("/reset-password")}?token=${token}`;

  // Ohne await: Die Antwort darf nicht auf den Mailserver warten.
  void sendEmail({
    userId: nutzer.id,
    kind: "PASSWORD_RESET",
    to: nutzer.email,
    subject: "Brisco Marketplace — deine Anfrage ist online",
    body: [
      "Danke für deine Anfrage.",
      "",
      "Wir haben dir dafür automatisch einen Zugang angelegt — damit siehst du,",
      "welche Händler dir antworten. Vergib hier dein Passwort:",
      link,
      "",
      `Der Link ist ${Math.round(RESET_TOKEN_TTL_MS / 3_600_000)} Stunden gültig.`,
      "Wenn du keine Anfrage gestellt hast, ignoriere diese Nachricht einfach.",
    ].join("\n"),
  });

  return nutzer.id;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => null);
  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, ...data } = parsed.data;

  // Angemeldet? Dann gehört die Anfrage dem Konto. Sonst reicht eine
  // E-Mail-Adresse — das Konto entsteht im Hintergrund.
  let buyerId = session?.user?.id ?? null;
  let kontoAngelegt = false;
  if (!buyerId) {
    if (!email) {
      return NextResponse.json(
        { error: "Bitte gib deine E-Mail-Adresse an — dorthin schicken wir die Antworten." },
        { status: 400 },
      );
    }
    buyerId = await kontoFuerAnfrage(email, new URL(req.url).origin);
    kontoAngelegt = true;
  }

  const rfq = await prisma.rfq.create({
    data: {
      ...data,
      deadline: new Date(data.deadline),
      buyerId,
    },
  });
  return NextResponse.json({ ...rfq, kontoAngelegt }, { status: 201 });
}
