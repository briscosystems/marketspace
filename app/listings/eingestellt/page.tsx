import Link from "next/link";
import { PackageCheck, Camera } from "lucide-react";

export const metadata = { title: "Angebot eingestellt — Brisco Marketplace" };

/**
 * Bestätigung nach einem Angebot ohne vorheriges Konto.
 *
 * Das Angebot ist sofort öffentlich; die Bearbeitung (Fotos, Preis) ist erst
 * möglich, wenn das Passwort gesetzt ist. Das sagen wir hier klar, statt den
 * Anbieter in eine gesperrte Seite laufen zu lassen.
 */
export default async function AngebotEingestelltPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <PackageCheck size={26} />
        </span>
        <h1 className="page-title mt-4">Dein Angebot ist online.</h1>
        <p className="mt-2 text-slate-600">
          Käufer finden es ab sofort über die Suche. Wir haben dir eine E-Mail geschickt: Darin
          steht ein Link, mit dem du dein Passwort setzt.
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900">
          <Camera size={17} className="mt-0.5 shrink-0" />
          <span>
            <strong>Fotos fehlen noch.</strong> Sobald dein Passwort gesetzt ist, kannst du
            Aufnahmen von Fass, Etikett und Charge ergänzen — Angebote mit eigenen Fotos werden
            deutlich häufiger angefragt.
          </span>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {id && (
            <Link href={`/listings/${id}`} className="btn-primary">
              Angebot ansehen
            </Link>
          )}
          <Link href="/forgot-password" className="btn-secondary">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    </div>
  );
}
