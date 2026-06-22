"use client";

import { brandColors } from "@/lib/branding";

type Props = {
  name: string;
  logoPath?: string | null;
  height?: number;
  className?: string;
};

/**
 * Zeigt das Hersteller-Logo aus dem DB-Pfad (z.B. /brand-logos/BlaserSwisslubeLogo.png).
 * Falls kein Pfad: stilisiertes Wordmark in der Markenfarbe als Fallback.
 *
 * Unterscheidet sich von <BrandLogo>: <BrandLogo> sucht über Hersteller-Name +
 * Slug-Konvention; <ManufacturerLogo> nimmt den expliziten Pfad aus der Manufacturer-
 * Tabelle — robuster gegenüber abweichenden Dateinamen.
 */
export function ManufacturerLogo({ name, logoPath, height = 48, className = "" }: Props) {
  if (logoPath) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ height, minWidth: height }}
        title={name}
      >
        <img
          src={logoPath}
          alt={name}
          style={{ maxHeight: height, maxWidth: height * 3.5, objectFit: "contain" }}
        />
      </span>
    );
  }

  const { primary, text } = brandColors(name);
  return (
    <span
      className={`inline-flex items-center rounded-md font-bold tracking-wide ${className}`}
      style={{
        backgroundColor: primary,
        color: text,
        height,
        paddingLeft: Math.max(8, height / 5),
        paddingRight: Math.max(8, height / 5),
        fontSize: Math.max(11, height / 3.5),
        letterSpacing: "0.06em",
      }}
      title={`${name} (kein Logo hinterlegt)`}
    >
      {name.toUpperCase()}
    </span>
  );
}
