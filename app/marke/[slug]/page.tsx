import { redirect } from "next/navigation";

// Kurze, teilbare Marken-URL (/marke/<slug>) → leitet auf das Hersteller-
// Schaufenster (/manufacturers/<slug>) weiter. Praktisch für Marketing-Links
// von Marke-Mitgliedern.
export default async function MarkeRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/manufacturers/${slug}`);
}
