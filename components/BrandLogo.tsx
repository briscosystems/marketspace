"use client";

import { useEffect, useState } from "react";
import { brandColors } from "@/lib/branding";

type BrandLogoProps = {
  manufacturer: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  xs: { h: 20, text: 9, padX: 6 },
  sm: { h: 28, text: 11, padX: 8 },
  md: { h: 36, text: 14, padX: 10 },
  lg: { h: 48, text: 18, padX: 14 },
};

/**
 * Marken-Logo mit zwei Quellen:
 *   1) Datei unter /public/brand-logos/<slug>.svg  (bevorzugt)
 *   2) Datei unter /public/brand-logos/<slug>.png
 *   3) Fallback: stilisiertes Wordmark in Marken-Farbe
 *
 * Lädt die Bilder vor (`new Image()`) und zeigt erst dann das `<img>`-Element
 * — so wird das hässliche "broken image"-Icon vermieden, wenn keine Datei
 * vorhanden ist.
 */
export function BrandLogo({ manufacturer, size = "md", className = "" }: BrandLogoProps) {
  const slug = slugify(manufacturer);
  const candidates = [`/brand-logos/${slug}.svg`, `/brand-logos/${slug}.png`];
  const [foundSrc, setFoundSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const dims = sizeMap[size];

  useEffect(() => {
    let alive = true;
    setResolved(false);
    setFoundSrc(null);
    (async () => {
      for (const src of candidates) {
        const ok = await checkImage(src);
        if (!alive) return;
        if (ok) {
          setFoundSrc(src);
          setResolved(true);
          return;
        }
      }
      if (alive) setResolved(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Beim ersten Render (oder während die Logo-Suche läuft): Wordmark zeigen,
  // damit kein Layout-Sprung und kein broken-image-Icon entsteht.
  if (!resolved || !foundSrc) {
    return <Wordmark manufacturer={manufacturer} size={size} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ height: dims.h }}
      title={manufacturer}
    >
      <img
        src={foundSrc}
        alt={manufacturer}
        style={{ height: dims.h, width: "auto", maxWidth: dims.h * 4 }}
      />
    </span>
  );
}

function checkImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Wordmark({
  manufacturer,
  size,
  className,
}: {
  manufacturer: string;
  size: keyof typeof sizeMap;
  className: string;
}) {
  const { primary, text } = brandColors(manufacturer);
  const dims = sizeMap[size];
  const display = manufacturer.toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-md font-bold tracking-wide ${className}`}
      style={{
        backgroundColor: primary,
        color: text,
        height: dims.h,
        paddingLeft: dims.padX,
        paddingRight: dims.padX,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: dims.text,
        letterSpacing: "0.06em",
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.18)",
      }}
      title={`${manufacturer} (Platzhalter — Logo unter /brand-logos/${slugify(manufacturer)}.{svg,png} ablegen)`}
    >
      {display}
    </span>
  );
}
