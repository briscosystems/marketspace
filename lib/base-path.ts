// Basispfad-Helfer für den Betrieb unter einer Unteradresse (z. B. /marketplace2026).
//
// Next.js prefixt <Link>, next/image, router.push() und redirect() automatisch mit
// dem basePath. NICHT automatisch: rohe fetch("/api/…")-Aufrufe, <a href="/…">-Anker
// und <img src="/…">. Für genau diese Fälle diese Helfer verwenden.
//
// Der Wert kommt aus NEXT_PUBLIC_BASE_PATH (zur Build-Zeit eingebettet). Lokal leer →
// alles läuft wie bisher unter "/". In Produktion z. B. "/marketplace2026".

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefixt einen absoluten In-App-Pfad ("/api/…", "/vertrauen") mit dem basePath. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path; // externe/relative URLs unangetastet lassen
  return `${BASE_PATH}${path}`;
}
