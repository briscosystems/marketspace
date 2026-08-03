import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata = { title: "Anfrage eingegangen — Brisco Marketplace" };

/**
 * Bestätigung nach einer Anfrage ohne Konto.
 *
 * Die Anfrage-Detailseite kann noch nicht geöffnet werden, weil das Konto zwar
 * existiert, aber noch kein Passwort hat. Statt einer Fehlermeldung bekommt der
 * Besucher hier klar gesagt, was als Nächstes passiert.
 */
export default function AnfrageEingegangenPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <MailCheck size={26} />
        </span>
        <h1 className="page-title mt-4">Deine Anfrage läuft.</h1>
        <p className="mt-2 text-slate-600">
          Anbieter können jetzt antworten. Wir haben dir eine E-Mail geschickt: Darin
          steht ein Link, mit dem du dein Passwort setzt — danach siehst du alle Angebote zu
          deiner Anfrage an einem Ort.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Keine E-Mail bekommen? Schau im Spam-Ordner nach. Der Link ist 24 Stunden gültig; du
          kannst dir jederzeit über „Passwort vergessen" einen neuen schicken lassen.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/listings" className="btn-primary">
            Weiter im Katalog suchen
          </Link>
          <Link href="/forgot-password" className="btn-secondary">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    </div>
  );
}
