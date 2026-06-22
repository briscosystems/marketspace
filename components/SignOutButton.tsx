"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-slate-600 hover:text-brand-500"
    >
      Abmelden
    </button>
  );
}
