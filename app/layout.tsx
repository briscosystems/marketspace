import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HeaderNav } from "@/components/HeaderNav";
import { Providers } from "./providers";
import { CompareBar } from "@/components/compare/CompareBar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { GateLogin } from "@/components/GateLogin";
import { GATE_COOKIE, gateEnabled, isGateTokenValid } from "@/lib/gate";
import { withBasePath } from "@/lib/base-path";
import { Search, ShieldCheck, FileText, Check } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brisco Marketplace — Industrieöle, KSS & Schmierstoffe",
  description: "B2B-Marktplatz für Industrieöle, KSS und Schmierstoffe — Anbieten & Suchen",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brisco",
    startupImage: ["/icons/apple-touch-icon.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  applicationName: "Brisco",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#abd91a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vorgeschaltete Zugangssperre: solange kein gültiges Gate-Cookie vorliegt, nur die
  // weiße Login-Seite zeigen (nur in Produktion aktiv, siehe gateEnabled()).
  if (gateEnabled()) {
    const store = await cookies();
    const ok = await isGateTokenValid(store.get(GATE_COOKIE)?.value);
    if (!ok) {
      return (
        <html lang="de">
          <body>
            <GateLogin />
          </body>
        </html>
      );
    }
  }

  const session = await getServerSession(authOptions);
  return (
    <html lang="de">
      <body>
        <ServiceWorkerRegistration />
        <Providers>
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
              <Link href="/" className="flex shrink-0 items-center gap-2">
                {/* Offizielles Brisco-Systems-Logo (Vektor, public/brisco-systems-logo.svg) */}
                <img
                  src={withBasePath("/brisco-systems-logo.svg")}
                  alt="Brisco Systems"
                  className="h-8 w-auto sm:h-10"
                />
                <span className="hidden self-center border-l border-slate-300 pl-3 text-base font-semibold tracking-tight text-slate-500 lg:inline">
                  Marketplace
                </span>
              </Link>

              {/* Suchzentrierte Bedienerführung: große Suche direkt im Kopf */}
              <form
                action={withBasePath("/listings")}
                method="get"
                role="search"
                className="order-3 flex w-full items-center gap-2 rounded-full border border-slate-300 bg-white pl-4 pr-1.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 md:order-none md:w-auto md:flex-1 md:max-w-xl"
              >
                <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <input
                  name="q"
                  type="search"
                  placeholder="Öl, Fett, Marke oder ISO VG suchen …"
                  aria-label="Angebote durchsuchen"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-brand-400 px-4 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-brand-500"
                >
                  Suchen
                </button>
              </form>

              <div className="shrink-0">
                <HeaderNav
                  user={
                    session?.user
                      ? { name: session.user.name ?? "", isAdmin: session.user.role === "ADMIN" }
                      : null
                  }
                />
              </div>
            </div>
          </header>

          {/* Schlanke Vertrauens-Leiste — auf jeder Seite sichtbar */}
          <div className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs text-slate-500 md:px-6">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden /> Geprüfte, verifizierte Anbieter
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden /> Sichere Abwicklung über Brisco
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <FileText className="h-3.5 w-3.5 text-brand-600" aria-hidden /> Marktpreise &amp; Sicherheitsdatenblätter inklusive
              </span>
            </div>
          </div>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
          <CompareBar />
          <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div>Brisco Systems GmbH · Prototyp v0.3 · Pseudonyme Reseller-Plattform</div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <a href={withBasePath("/vertrauen")} className="hover:text-slate-700 hover:underline">Vertrauen</a>
              <span className="text-slate-300">·</span>
              <a href={withBasePath("/agb")} className="hover:text-slate-700 hover:underline">AGB</a>
              <span className="text-slate-300">·</span>
              <a href={withBasePath("/impressum")} className="hover:text-slate-700 hover:underline">Impressum</a>
              <span className="text-slate-300">·</span>
              <a href={withBasePath("/datenschutz")} className="hover:text-slate-700 hover:underline">Datenschutz</a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
