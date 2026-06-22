import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HeaderNav } from "@/components/HeaderNav";
import { Providers } from "./providers";
import { CompareBar } from "@/components/compare/CompareBar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
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
  const session = await getServerSession(authOptions);
  return (
    <html lang="de">
      <body>
        <ServiceWorkerRegistration />
        <Providers>
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
              <Link href="/" className="flex shrink-0 items-center gap-2">
                {/* Offizielles Brisco-Systems-Logo (Vektor, public/brisco-systems-logo.svg) */}
                <img
                  src="/brisco-systems-logo.svg"
                  alt="Brisco Systems"
                  className="h-8 w-auto sm:h-10"
                />
                <span className="hidden self-center border-l border-slate-300 pl-3 text-base font-semibold tracking-tight text-slate-500 lg:inline">
                  Marketplace
                </span>
              </Link>
              <HeaderNav
                user={
                  session?.user
                    ? { name: session.user.name ?? "", isAdmin: session.user.role === "ADMIN" }
                    : null
                }
              />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
          <CompareBar />
          <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            Brisco Systems GmbH · Prototyp v0.3 · Pseudonyme Reseller-Plattform
            <span className="mx-1.5 text-slate-300">·</span>
            <a href="/agb" className="hover:text-slate-700 hover:underline">AGB</a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
