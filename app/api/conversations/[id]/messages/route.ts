import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findContactData, aiContactCheck } from "@/lib/contact-filter";

async function assertMember(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });
  if (!convo) return { ok: false as const, status: 404, error: "Not found" };
  if (convo.buyerId !== userId && convo.sellerId !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const check = await assertMember(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { pseudonym: true, id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

const sendSchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const check = await assertMember(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nachricht darf nicht leer sein." }, { status: 400 });
  }

  // Kontaktdaten-Filter Stufe 1 (Regex, jede Nachricht): E-Mail, Telefon,
  // Links. Schützt das Pseudonym-Modell — Austausch direkter Kontaktdaten
  // ist nicht erlaubt (siehe AGB / lib/contact-filter.ts).
  const finding = findContactData(parsed.data.body);
  if (finding.found) {
    return NextResponse.json(
      {
        error: `Deine Nachricht enthält ${finding.reason}. Der Austausch direkter Kontaktdaten ist auf Brisco nicht erlaubt — die Kommunikation läuft pseudonym über die Plattform.`,
      },
      { status: 422 },
    );
  }

  // Stufe 2 (KI, einmalig pro neuem Account): prüft die erste Nachricht auf
  // raffiniert verschleierte Kontaktdaten. Kosten trägt Brisco (gedeckelt,
  // siehe lib/contact-filter.ts). Zeitstempel wird unabhängig vom Ergebnis
  // gesetzt — genau eine Prüfung pro Account.
  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiContactCheckAt: true },
  });
  if (sender && sender.aiContactCheckAt === null) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { aiContactCheckAt: new Date() },
    });
    const ai = await aiContactCheck(parsed.data.body);
    if (ai?.flagged) {
      return NextResponse.json(
        {
          error: `Deine Nachricht wurde von unserer automatischen Prüfung zurückgehalten${ai.reason ? ` (${ai.reason})` : ""}. Der Austausch direkter Kontaktdaten ist auf Brisco nicht erlaubt.`,
        },
        { status: 422 },
      );
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { pseudonym: true, id: true } } },
  });
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json(message, { status: 201 });
}
