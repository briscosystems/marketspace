"use client";

import { deleteUserAccount } from "@/app/admin/actions";

/**
 * Konto endgültig löschen — mit deutlicher Rückfrage, weil nichts davon
 * zurückzuholen ist (Betreiber 2026-08-18).
 *
 * Wer bereits Geschäfte abgewickelt hat, wird nicht gelöscht, sondern
 * gesperrt: Belege müssen nachvollziehbar bleiben. Das steht auch in der
 * Rückfrage, damit niemand ein anderes Ergebnis erwartet, als er bekommt.
 */
export function DeleteUserButton({
  userId,
  pseudonym,
  hatGeschaefte,
}: {
  userId: string;
  pseudonym: string;
  /** true = es gibt Transaktionen; dann wird nur gesperrt. */
  hatGeschaefte: boolean;
}) {
  return (
    <form
      action={deleteUserAccount}
      onSubmit={(e) => {
        const frage = hatGeschaefte
          ? `${pseudonym} hat abgeschlossene Transaktionen.\n\nDas Konto wird deshalb NICHT gelöscht, sondern gesperrt — die Geschäftsvorfälle müssen nachvollziehbar bleiben.\n\nFortfahren?`
          : `${pseudonym} endgültig löschen?\n\nDamit verschwinden auch Angebote, Anfragen, Gespräche, Messwerte und Erfahrungsberichte dieses Kontos. Das lässt sich nicht rückgängig machen.`;
        if (!confirm(frage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
        title={
          hatGeschaefte
            ? "Konto sperren (wegen bestehender Transaktionen nicht löschbar)"
            : "Konto endgültig löschen"
        }
      >
        Löschen
      </button>
    </form>
  );
}
