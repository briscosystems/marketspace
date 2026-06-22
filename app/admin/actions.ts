"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Stellt sicher, dass NUR der Eigentümer (Rolle ADMIN) diese Aktionen ausführt.
 * Wirft sonst — die Seite selbst liefert für alle anderen ohnehin 404.
 */
async function assertOwner() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Nicht berechtigt.");
  }
}

/**
 * Setzt den versteckten Sichtbarkeits-Boost eines Resellers.
 * Höherer Wert ⇒ dessen Angebote erscheinen weiter oben in Suche & Vorschlägen.
 * Wert wird auf 0–100 begrenzt. Für normale Nutzer ist das komplett unsichtbar.
 */
export async function updateSearchBoost(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("boost") ?? 0);
  if (!userId) return;

  const boost = Math.max(0, Math.min(100, Math.round(Number.isFinite(raw) ? raw : 0)));
  await prisma.user.update({ where: { id: userId }, data: { searchBoost: boost } });

  // Seiten neu rendern, deren Reihenfolge vom Boost abhängt.
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
}
