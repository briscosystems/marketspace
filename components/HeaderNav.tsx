"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountMenu } from "@/components/AccountMenu";
import {
  Plus,
  Heart,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  Building2,
  FileText,
  Shield,
} from "lucide-react";

// Sekundäre Navigation — im „Menü"-Dropdown gebündelt, damit der Kopf ruhig bleibt
// (wie im Konzept). Die Primäraktion „Anbieten" steht als eigener Knopf rechts.
const MENU_ITEMS: { href: string; label: string; icon: typeof Search }[] = [
  { href: "/rfqs", label: "Suchen (Anfragen)", icon: Search },
  { href: "/kss-finder", label: "KSS-Finder", icon: Sparkles },
  { href: "/prices", label: "Preise", icon: TrendingUp },
  { href: "/manufacturers", label: "Hersteller", icon: Building2 },
  { href: "/sds", label: "Sicherheitsdatenblätter", icon: FileText },
  { href: "/materials", label: "Materialien", icon: Shield },
];

export function HeaderNav({ user }: { user: { name: string; isAdmin?: boolean } | null }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <NavMenu />

      <Link
        href="/listings/new"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Anbieten</span>
      </Link>

      <Link
        href="/compare"
        aria-label="Merkliste"
        className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-rose-500"
      >
        <Heart size={18} />
      </Link>

      {user ? (
        <AccountMenu user={user} />
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Anmelden
        </Link>
      )}
    </nav>
  );
}

/**
 * „Menü"-Dropdown — bündelt die sekundären Seiten (Suchen, KSS-Finder, Preise,
 * Hersteller, SDS, Materialien) + Sprachwahl. Öffnet per Klick, schließt bei
 * Außenklick, Escape oder Seitenwechsel.
 */
function NavMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = (href: string) =>
    (pathname ?? "") === href || (pathname ?? "").startsWith(href + "/");

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
        aria-label="Menü"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-medium transition-colors ${
          open
            ? "border-slate-300 bg-slate-50 text-slate-900"
            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <Menu size={16} />
        <span className="hidden md:inline">Menü</span>
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lift">
          {MENU_ITEMS.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} className="text-slate-500" />
                {it.label}
              </Link>
            );
          })}
          <div className="my-1 border-t border-slate-100" />
          <div className="px-2 py-1">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}
