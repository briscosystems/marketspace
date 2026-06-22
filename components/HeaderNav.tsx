"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import {
  FileText,
  LayoutDashboard,
  Tag,
  Search,
  Building2,
  Shield,
  Sparkles,
  TrendingUp,
  Lock,
  CreditCard,
} from "lucide-react";

type Accent = "blue" | "amber" | "purple" | "none";

// Ruhezustand bewusst neutral (graue Schrift), nur das Symbol trägt die
// Akzentfarbe zur Wiedererkennung. Die AKTIVE Seite wird klar als gefülltes
// Feld in der Akzentfarbe + fett hervorgehoben — so sieht man sofort, wo man ist.
const ACCENT: Record<Accent, { icon: string; active: string }> = {
  blue: { icon: "text-blue-600", active: "bg-blue-50 text-blue-800" },
  amber: { icon: "text-amber-600", active: "bg-amber-50 text-amber-800" },
  purple: { icon: "text-purple-600", active: "bg-purple-50 text-purple-800" },
  none: { icon: "text-slate-500", active: "bg-slate-100 text-slate-900" },
};

const ITEMS: { href: string; label: string; icon: typeof Tag; accent: Accent }[] = [
  { href: "/listings", label: "Anbieten", icon: Tag, accent: "blue" },
  { href: "/rfqs", label: "Suchen", icon: Search, accent: "amber" },
  { href: "/manufacturers", label: "Hersteller", icon: Building2, accent: "none" },
  { href: "/sds", label: "SDS", icon: FileText, accent: "none" },
  { href: "/materials", label: "Materialien", icon: Shield, accent: "none" },
  { href: "/kss-finder", label: "KSS-Finder", icon: Sparkles, accent: "purple" },
  { href: "/prices", label: "Preise", icon: TrendingUp, accent: "none" },
];

export function HeaderNav({ user }: { user: { name: string; isAdmin?: boolean } | null }) {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
      {ITEMS.map((it) => {
        const a = ACCENT[it.accent];
        const active = isActive(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
              active
                ? `${a.active} font-semibold`
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={15} className={active ? "" : a.icon} />
            <span className="hidden md:inline">{it.label}</span>
          </Link>
        );
      })}

      {user ? (
        <>
          {/* Trennlinie: Haupt-Menü ↔ Konto-Bereich */}
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
          <Link
            href="/dashboard"
            aria-current={isActive("/dashboard") ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
              isActive("/dashboard")
                ? "bg-slate-100 font-semibold text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard size={15} className={isActive("/dashboard") ? "" : "text-slate-500"} />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          <Link
            href="/mitgliedschaft"
            aria-current={isActive("/mitgliedschaft") ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
              isActive("/mitgliedschaft")
                ? "bg-slate-100 font-semibold text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CreditCard size={15} className={isActive("/mitgliedschaft") ? "" : "text-slate-500"} />
            <span className="hidden md:inline">Zugang</span>
          </Link>
          {/* Nur für den Eigentümer (ADMIN) sichtbar — interne Steuerung. */}
          {user.isAdmin && (
            <Link
              href="/admin"
              aria-current={isActive("/admin") ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                isActive("/admin")
                  ? "bg-rose-50 font-semibold text-rose-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Lock size={15} className={isActive("/admin") ? "" : "text-rose-600"} />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}
          <Link
            href={`/profile/${user.name}`}
            className="ml-1 hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 sm:inline-block"
          >
            {user.name}
          </Link>
          <SignOutButton />
        </>
      ) : (
        <>
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
          <Link href="/login" className="btn-secondary text-xs">
            Login
          </Link>
          <Link href="/register" className="btn-primary text-xs">
            Registrieren
          </Link>
        </>
      )}
    </nav>
  );
}
