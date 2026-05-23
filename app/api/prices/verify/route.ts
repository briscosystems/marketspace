// POST /api/prices/verify — Admin/Verifizierer setzt Status VERIFIED oder REJECTED.
// Body: { observationId, action: "approve" | "reject", rejectionReason? }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  // Nur ADMIN oder TRADE_ASSURED+ Tier darf verifizieren
  const role = session.user.role;
  const tier = session.user.trustTier;
  const allowed = role === "ADMIN" || tier === "TRADE_ASSURED" || tier === "PREMIUM";
  if (!allowed) {
    return NextResponse.json({ error: "Nur Admins oder Trade-Assured+ User können verifizieren" }, { status: 403 });
  }

  const body = (await req.json()) as {
    observationId: string;
    action: "approve" | "reject";
    rejectionReason?: string;
  };

  if (!body.observationId || !body.action) {
    return NextResponse.json({ error: "observationId, action erforderlich" }, { status: 400 });
  }

  const obs = await prisma.priceObservation.findUnique({ where: { id: body.observationId } });
  if (!obs) return NextResponse.json({ error: "Beobachtung nicht gefunden" }, { status: 404 });
  if (obs.status !== "PENDING") {
    return NextResponse.json({ error: `Schon ${obs.status}` }, { status: 409 });
  }
  if (obs.submittedByUserId === session.user.id) {
    return NextResponse.json({ error: "Eigene Meldung kann nicht selbst verifiziert werden" }, { status: 409 });
  }

  await prisma.priceObservation.update({
    where: { id: body.observationId },
    data: {
      status: body.action === "approve" ? "VERIFIED" : "REJECTED",
      verifiedByUserId: session.user.id,
      verifiedAt: new Date(),
      rejectionReason: body.action === "reject" ? body.rejectionReason : null,
    },
  });

  return NextResponse.json({ ok: true });
}
