// GET /api/trial-info
// Liefert die aktuellen Trial-Konditionen (Dauer + Startguthaben) für die
// Werbetexte auf öffentlichen Seiten.
//
// Warum als Endpunkt: Die Registrierungsseite läuft im Browser und kommt nicht an
// die Superadmin-Einstellungen. Die Zahlen dürfen aber NICHT fest im Text stehen —
// sonst wirbt die Seite irgendwann mit 10 Tagen, während die Software 30 gewährt.
//
// Bewusst öffentlich: Es sind genau die Angaben, mit denen wir werben.
import { NextResponse } from "next/server";
import { getSettingInt } from "@/lib/credits";

export async function GET() {
  const [days, credits] = await Promise.all([
    getSettingInt("trialDays"),
    getSettingInt("welcomeCredits"),
  ]);
  return NextResponse.json({ days, credits });
}
