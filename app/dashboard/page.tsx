import { redirect } from "next/navigation";

/**
 * /dashboard ist mit der Startseite verschmolzen (Betreiber 2026-08-16):
 * Zwei angemeldete Übersichten zeigten Ähnliches doppelt — deshalb sah der
 * Betreiber wiederholt eine „alte Version". Alle Verwaltungs-Abschnitte
 * stehen jetzt als „Mein Bereich" auf der Startseite; alte Links und
 * Lesezeichen landen dort.
 */
export default function DashboardRedirect() {
  redirect("/#mein-bereich");
}
