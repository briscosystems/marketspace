import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  pseudonym: z.string().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
  role: z.enum(["RESELLER", "OEM"]).default("RESELLER"),
  companyName: z.string().min(2),
  vatId: z.string().optional(),
  country: z.string().length(2),
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
  const { email, password, pseudonym, role, companyName, vatId, country } = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { pseudonym }] },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Email oder Pseudonym bereits vergeben" },
      { status: 409 }
    );
  }

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
    },
    select: { id: true, pseudonym: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}
