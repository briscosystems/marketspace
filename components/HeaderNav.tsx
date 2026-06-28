"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountMenu } from "@/components/AccountMenu";
import {
  FileText,
  Tag,
  Search,
  Building2,
  Shield,
  Sparkles,
  TrendingUp,
  Info,
  ChevronDown,
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

type NavItem = { href: string; label: string; icon: typeof Tag; accent: Accent };

// Haupt-Einträge vor dem „Informationen"-Menü
const MAIN_ITEMS: NavItem[] = [
  { href: "/listings", label: "Anbieten", icon: Tag, accent: "blue" },
  { href: "/rfqs", label: "Suchen", icon: Search, accent: "amber" },
];

// Wissens-/Nachschlage-Seiten — gebündelt im „Informationen"-Dropdown
const INFO_ITEMS: { href: string; label: string; icon: typeof Tag }[] = [
  { href: "/manufacturers", label: "Hersteller", icon: Building2 },
  { href: "/sds", label: "Sicherheitsdatenblätter", icon: FileText },
  { href: "/materials", label: "Materialien", icon: Shield },
];

// Haupt-Einträge nach dem „Informationen"-Menü
const TAIL_ITEMS: NavItem[] = [
  { href: "/kss-finder", label: "KSS-Finder", icon: Sparkles, accent: "purple" },
  { href: "/prices", label: "Preise", icon: TrendingUp, accent: "none" },
];

export function HeaderNav({ user }: { user: { name: string; isAdmin?: boolean } | null }) {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderItem = (it: NavItem) => {
    const a = ACCENT[it.accent];
    const active = isActive(it.href);
    const Icon = it.icon;
    return (
      <Link
        key={it.href}
        href={it.href}
        aria-current={active ? "page" : undefined}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
          active ? `${a.active} font-semibold` : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={15} className={active ? "" : a.icon} />
        <span className="hidden md:inline">{it.label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
      {MAIN_ITEMS.map(renderItem)}

      <InfoMenu items={INFO_ITEMS} isActive={isActive} />

      {TAIL_ITEMS.map(renderItem)}

      {/* Trennlinie: Haupt-Menü ↔ Sprache/Konto */}
      <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
      <LanguageSwitcher />

      {user ? (
        <AccountMenu user={user} />
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
  );
}

/**
 * „Informationen"-Dropdown — bündelt Hersteller, Sicherheitsdatenblätter und
 * Materialien, damit das Hauptmenü kürzer bleibt. Öffnet per Klick, schließt
 * bei Außenklick, Escape oder Seitenwechsel.
 */
function InfoMenu({
  items,
  isActive,
}: {
  items: { href: string; label: string; icon: typeof Tag }[];
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const anyActive = items.some((i) => isActive(i.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
          anyActive || open
            ? "bg-slate-100 font-semibold text-slate-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Info size={15} className={anyActive || open ? "" : "text-slate-500"} />
        <span className="hidden md:inline">Informationen</span>
        <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lift">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={15} className="text-slate-500" />
                {it.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
