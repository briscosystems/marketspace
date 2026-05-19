import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { Providers } from "./providers";
import { CompareBar } from "@/components/compare/CompareBar";
import { Droplet, FileText, MessagesSquare, LayoutDashboard, ListChecks, Building2 } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brisco Marketplace — Industrial Oil Trading",
  description: "B2B-Marktplatz für Industrieöle, KSS und Schmierstoffe",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Brisco",
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
                <NavLink href="/listings" icon={ListChecks} label="Listings" />
                <NavLink href="/manufacturers" icon={Building2} label="Hersteller" />
                <NavLink href="/rfqs" icon={MessagesSquare} label="Anfragen" />
                <NavLink href="/sds" icon={FileText} label="SDS" />
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
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-brand-600"
    >
      <Icon size={15} className="text-slate-500" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
