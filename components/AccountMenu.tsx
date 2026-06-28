"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Lock,
  LogOut,
  UserRound,
} from "lucide-react";
import { useLocale } from "./LocaleProvider";

/**
 * Konto-Dropdown im Stil etablierter Portale (Amazon „Hallo, …/Konto"):
 * Avatar + Begrüßung + Name als Auslöser, darunter ein Menü mit Profil,
 * Dashboard, Mitgliedschaft, ggf. Admin und Abmelden. Labels über i18n.
 */
export function AccountMenu({ user }: { user: { name: string; isAdmin?: boolean } }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const initial = (user.name?.trim()?.[0] ?? "?").toUpperCase();

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

  const itemClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition ${
          open
            ? "border-brand-300 bg-brand-50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[10px] text-slate-500">{t("account.greeting")}</span>
          <span className="block max-w-[8rem] truncate text-xs font-semibold text-slate-800">
            {user.name}
          </span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lift">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">{t("account.signedInAs")}</div>
              <div className="truncate text-sm font-semibold text-slate-800">{user.name}</div>
            </div>
          </div>

          <div className="py-1">
            <Link href={`/profile/${user.name}`} className={itemClass}>
              <UserRound size={16} className="text-slate-400" />
              {t("account.profile")}
            </Link>
            <Link href="/dashboard" className={itemClass}>
              <LayoutDashboard size={16} className="text-slate-400" />
              {t("account.dashboard")}
            </Link>
            <Link href="/mitgliedschaft" className={itemClass}>
              <CreditCard size={16} className="text-slate-400" />
              {t("account.membership")}
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className={`${itemClass} text-rose-700 hover:bg-rose-50`}>
                <Lock size={16} className="text-rose-500" />
                {t("account.admin")}
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`${itemClass} w-full`}
            >
              <LogOut size={16} className="text-slate-400" />
              {t("account.signout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
