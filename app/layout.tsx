import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { Providers } from "./providers";
import { CompareBar } from "@/components/compare/CompareBar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Droplet, FileText, MessagesSquare, LayoutDashboard, Tag, Search, Building2, Shield, Sparkles } from "lucide-react";
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
  themeColor: "#2d6dd9",
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
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
                  <Droplet size={20} strokeWidth={2.5} />
                </span>
                <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:inline">
                  Brisco<span className="text-brand-500">Marketplace</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <NavLink
                  href="/listings"
                  icon={Tag}
                  label="Anbieten"
                  accent="blue"
                />
                <NavLink
                  href="/rfqs"
                  icon={Search}
                  label="Suchen"
                  accent="amber"
                />
                <NavLink href="/manufacturers" icon={Building2} label="Hersteller" />
                <NavLink href="/sds" icon={FileText} label="SDS" />
                <NavLink href="/materials" icon={Shield} label="Materialien" />
                <NavLink href="/kss-finder" icon={Sparkles} label="KSS-Finder" accent="purple" />
                {session?.user ? (
                  <>
                    <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <Link
                      href={`/profile/${session.user.name}`}
                      className="ml-2 hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 sm:inline-block"
                    >
                      {session.user.name}
                    </Link>
                    <SignOutButton />
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary text-xs">
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary text-xs">
                      Registrieren
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
          <CompareBar />
          <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            Brisco Systems GmbH · Prototyp v0.3 · Pseudonyme Reseller-Plattform
          </footer>
        </Providers>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  accent?: "blue" | "amber" | "purple";
}) {
  const accentClasses =
    accent === "blue"
      ? "text-blue-700 hover:bg-blue-50 hover:text-blue-800"
      : accent === "amber"
        ? "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
        : accent === "purple"
          ? "text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          : "text-slate-700 hover:bg-slate-100 hover:text-brand-600";
  const iconClasses =
    accent === "blue"
      ? "text-blue-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "purple"
          ? "text-purple-600"
          : "text-slate-500";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium ${accentClasses}`}
    >
      <Icon size={15} className={iconClasses} />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
