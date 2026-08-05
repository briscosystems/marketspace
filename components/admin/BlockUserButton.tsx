"use client";

import { toggleUserBlock } from "@/app/admin/actions";

/**
 * Sperren/Entsperren eines Kundenkontos — mit Rückfrage, weil die Sperre
 * sofort wirkt (Anmeldung, laufende Sitzungen und API-Schlüssel).
 */
export function BlockUserButton({
  userId,
  pseudonym,
  blocked,
}: {
  userId: string;
  pseudonym: string;
  blocked: boolean;
}) {
  return (
    <form
      action={toggleUserBlock}
      onSubmit={(e) => {
        if (blocked) {
          if (!confirm(`${pseudonym} wieder entsperren?`)) e.preventDefault();
          return;
        }
        const grund = prompt(
          `${pseudonym} sperren?\n\nDas Konto kann sich sofort nicht mehr anmelden; laufende Sitzungen und API-Schlüssel verlieren den Zugriff.\n\nGrund (nur intern sichtbar, optional):`,
        );
        if (grund === null) {
          e.preventDefault();
          return;
        }
        const feld = e.currentTarget.querySelector<HTMLInputElement>('input[name="grund"]');
        if (feld) feld.value = grund;
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="grund" value="" />
      <button
        type="submit"
        className={`rounded-md px-2 py-1 text-xs font-semibold ${
          blocked
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
            : "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
        }`}
      >
        {blocked ? "Entsperren" : "Sperren"}
      </button>
    </form>
  );
}
