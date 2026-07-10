import { prisma } from "@/lib/prisma";
import type { EmailKind } from "@prisma/client";

/**
 * Kein echter E-Mail-Versand im Prototyp (siehe auch
 * app/api/auth/forgot-password/route.ts) — stattdessen Server-Log +
 * persistenter EmailLog-Eintrag, damit der Superadmin unter /admin sehen
 * kann, was verschickt worden wäre. PRODUKTIV: hier einen echten Versand
 * (z.B. Postmark/SES) einhängen.
 */
export async function sendEmail(params: {
  userId: string;
  kind: EmailKind;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  console.log(`[E-Mail] an ${params.to} — ${params.subject}\n${params.body}`);
  await prisma.emailLog.create({
    data: {
      userId: params.userId,
      kind: params.kind,
      to: params.to,
      subject: params.subject,
      body: params.body,
    },
  });
}
