"use client";

import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { Plus, Heart } from "lucide-react";

// Kopf-Aktionen wie im Konzept: „+ Anbieten" (dunkel), Herz (Merkliste),
// Konto/Anmelden. Die sekundären Seiten stecken im Konto-Menü (AccountMenu).
export function HeaderNav({ user }: { user: { name: string; isAdmin?: boolean } | null }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
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
