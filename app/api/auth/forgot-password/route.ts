import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { withBasePath } from "@/lib/base-path";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  // Keine User-Enumeration nach außen: Die Antwort ist IMMER "ok" — unabhängig
  // davon, ob das Konto existiert und ob der Mailversand geklappt hat. Sonst
  // könnte ein Angreifer durchprobieren, welche Adressen registriert sind.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const origin = new URL(req.url).origin;
  const resetUrl = `${origin}${withBasePath("/reset-password")}?token=${token}`;
  const stunden = Math.round(RESET_TOKEN_TTL_MS / 3_600_000);

  // Der Link geht AUSSCHLIESSLICH per E-Mail raus. Bis 2026-07-15 gab die Route
  // ihn zusätzlich in der Antwort zurück — damit konnte jeder, der eine fremde
  // E-Mail-Adresse kannte, das zugehörige Konto übernehmen.
  await sendEmail({
    userId: user.id,
    kind: "PASSWORD_RESET",
    to: user.email,
    subject: "Brisco Marketplace — Passwort zurücksetzen",
    body: [
      `Hallo ${user.pseudonym},`,
      "",
      "für dein Brisco-Konto wurde ein Zurücksetzen des Passworts angefordert.",
      "Über diesen Link vergibst du ein neues Passwort:",
      "",
      resetUrl,
      "",
      `Der Link ist ${stunden} Stunden gültig und kann nur einmal verwendet werden.`,
      "",
      "Warst du das nicht? Dann ignoriere diese E-Mail einfach — dein Passwort",
      "bleibt unverändert, und niemand erfährt von dieser Anfrage.",
      "",
      "Brisco Systems GmbH",
    ].join("\n"),
  });

  return NextResponse.json({ ok: true });
}
