"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

/**
 * Erfasst Seitenaufrufe und Suchbegriffe für die interne Nutzungs-Messung
 * (/admin → "Nutzung"). Datenschutzarm: keine Cookies, keine IP, kein
 * Fingerprinting — nur Pfad bzw. Suchbegriff. Wird im RootLayout gemountet.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const q = searchParams?.get("q") ?? null;
    const key = `${pathname}?q=${q ?? ""}`;
    if (lastTracked.current === key) return; // Re-Renders nicht doppelt zählen
    lastTracked.current = key;

    const send = (body: object) => {
      const payload = JSON.stringify(body);
      // sendBeacon blockiert die Navigation nicht; fetch als Fallback
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          withBasePath("/api/track"),
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch(withBasePath("/api/track"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    send({ kind: "pageview", path: pathname });
    if (q && q.trim()) send({ kind: "search", path: pathname, meta: q.trim().slice(0, 120) });
  }, [pathname, searchParams]);

  return null;
}
