import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { BrandLogo } from "@/components/BrandLogo";
import { packagingForProduct } from "@/lib/product-packaging";

/**
 * Die eine Darstellung eines Katalogprodukts.
 *
 * Vorher sah dasselbe Produkt auf acht Seiten acht Mal anders aus — mal mit
 * Gebindebild, mal ohne Logo, mal ohne Produktart. Diese Karte ist der
 * gemeinsame Nenner: Gebindebild, Herstellerlogo, Name, Produktart-Chip und
 * optionale Zusatz-Chips (Viskosität, Chemie, Kennzeichen).
 *
 * Bewusst ohne Zustände, damit sie auf Server-Seiten direkt einsetzbar ist.
 */
export function ProduktZeile({
  href,
  produktId,
  name,
  hersteller,
  kategorie,
  chips = [],
  zusatz,
  kompakt = false,
}: {
  href: string;
  /** Für die stabile Wahl des Gebindebilds (immer dasselbe Bild je Produkt). */
  produktId: string;
  name: string;
  hersteller: string;
  /** Fertig übersetzte Produktart (z. B. über t(`cat.${category}`)). */
  kategorie?: string | null;
  /** Weitere kurze Angaben: ISO VG, Chemie, „bor-frei" … */
  chips?: (string | null | undefined)[];
  /** Rechte Spalte, z. B. Preis-Richtwert oder Datum. */
  zusatz?: React.ReactNode;
  kompakt?: boolean;
}) {
  const sichtbareChips = chips.filter(Boolean) as string[];
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lift"
    >
      <ProductImage
        manufacturer={hersteller}
        productName={name}
        packaging={packagingForProduct(kategorie ?? "OTHER", produktId)}
        size={kompakt ? "xs" : "sm"}
        className="transition-transform duration-200 group-hover:scale-105"
      />
      <div className="min-w-0 flex-1">
        <BrandLogo manufacturer={hersteller} size="xs" />
        <div className="mt-1 truncate text-sm font-bold text-slate-900 group-hover:text-brand-700">
          {name}
        </div>
        {(kategorie || sichtbareChips.length > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {kategorie && <span className="chip bg-slate-100 text-slate-600">{kategorie}</span>}
            {sichtbareChips.map((c) => (
              <span key={c} className="chip bg-slate-100 text-slate-600">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      {zusatz && <div className="shrink-0 text-right text-sm">{zusatz}</div>}
    </Link>
  );
}
