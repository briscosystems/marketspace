import { NextResponse } from "next/server";
import { GATE_COOKIE, gateCredentials, gateToken } from "@/lib/gate";
import { BASE_PATH } from "@/lib/base-path";

// Prüft die Gate-Zugangsdaten und setzt bei Erfolg das Zugangs-Cookie.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { user?: string; password?: string }
    | null;

  const cred = gateCredentials();
  if (!body || body.user !== cred.user || body.password !== cred.password) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, await gateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: BASE_PATH || "/",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
