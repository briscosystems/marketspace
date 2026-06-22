"use client";

import { useEffect } from "react";

/**
 * Registriert den Service-Worker im Client. Wirft optional einen Log-Eintrag,
 * macht sonst nichts visuell. Sobald registriert, ist die PWA installierbar.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Im Dev-Modus skippen — Next.js Hot-Reload kollidiert mit cached HTML
    if (process.env.NODE_ENV !== "production" && !window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return;
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("[Brisco PWA] Service-Worker registriert:", reg.scope);
      } catch (e) {
        console.warn("[Brisco PWA] SW-Registrierung fehlgeschlagen:", e);
      }
    };

    // Nach Window-Load registrieren, damit der erste Render nicht blockiert
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
