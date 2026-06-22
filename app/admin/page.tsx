import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSearchBoost } from "./actions";

// Interne Eigentümer-Konsole. Für alle außer ADMIN existiert die Seite "nicht"
// (404), damit ihre Existenz nicht verraten wird.
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["RESELLER", "OEM"] } },
    select: {
      id: true,
      pseudonym: true,
      email: true,
      companyName: true,
      trustTier: true,
      searchBoost: true,
      _count: { select: { listings: true } },
    },
    orderBy: [{ searchBoost: "desc" }, { pseudonym: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section>
        <div className="eyebrow text-rose-600">Intern · nur Eigentümer</div>
        <h1 className="page-title">Sichtbarkeits-Steuerung</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Hier legst du fest, welche Reseller in Suche und Vorschlägen weiter oben
          erscheinen. Ein höherer Wert (0–100) schiebt deren Angebote nach vorne.
          <strong className="text-slate-800"> Diese Werte sind für niemanden sonst
          sichtbar</strong> — weder für die Reseller noch für Käufer. Sie tauchen in
          keiner öffentlichen Seite oder API auf.
        </p>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Reseller</th>
              <th className="px-4 py-3">Vertrauensstufe</th>
              <th className="px-4 py-3">Aktive Angebote</th>
              <th className="px-4 py-3">Boost (0–100)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.searchBoost > 0 ? "bg-amber-50/60" : ""}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{u.pseudonym}</div>
                  <div className="text-xs text-slate-500">
                    {u.companyName ? `${u.companyName} · ` : ""}
                    {u.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.trustTier}</td>
                <td className="px-4 py-3 text-slate-600">{u._count.listings}</td>
                <td className="px-4 py-3">
                  <form action={updateSearchBoost} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="number"
                      name="boost"
                      min={0}
                      max={100}
                      defaultValue={u.searchBoost}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Speichern
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {u.searchBoost > 0 ? "wird bevorzugt" : "neutral"}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Noch keine Reseller vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
