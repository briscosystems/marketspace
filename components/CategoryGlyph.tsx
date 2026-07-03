import {
  Droplet,
  Droplets,
  Cog,
  Package,
  Disc3,
  Gauge,
  Wrench,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Wählt anhand des Produkttyps ein passendes Symbol (wie die Tropfen/Zahnräder
// im Konzept-Entwurf). Funktioniert in Server- und Client-Komponenten.
export function categoryIcon(productType: string): LucideIcon {
  const t = (productType || "").toLowerCase();
  if (t.includes("getriebe")) return Cog;
  if (t.includes("fett") || t.includes("grease")) return Package;
  if (t.includes("kss") || t.includes("emulsion") || t.includes("kühlschmier")) return Droplets;
  if (t.includes("schneid")) return Droplet;
  if (t.includes("schleif")) return Disc3;
  if (t.includes("kompressor")) return Gauge;
  if (t.includes("bahn") || t.includes("gleit")) return Wrench;
  if (t.includes("korrosion")) return ShieldCheck;
  if (t.includes("spezial")) return Sparkles;
  return Droplet;
}

export function CategoryGlyph({
  productType,
  className,
}: {
  productType: string;
  className?: string;
}) {
  const Icon = categoryIcon(productType);
  return <Icon className={className} strokeWidth={1.6} />;
}
