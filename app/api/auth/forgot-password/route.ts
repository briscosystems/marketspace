import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

  // Kein User-Enumeration nach außen: Die Antwort ist immer "ok". Existiert das
  // Konto, erzeugen wir einen Token. Da im Prototyp noch kein Mailversand läuft,
  // geben wir den Link in der Antwort zurück, damit er getestet werden kann.
  // PRODUKTIV: resetUrl NICHT zurückgeben, sondern ausschließlich per E-Mail
  // an den Posteingang zustellen.
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
  const resetUrl = `${origin}/reset-password?token=${token}`;

  // Solange kein echter Versand existiert: in den Server-Log schreiben.
  console.log(`[Passwort-Reset] Link für ${email}: ${resetUrl}`);

  return NextResponse.json({ ok: true, resetUrl });
}
