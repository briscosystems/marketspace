"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Copy, Trash2, Check } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type Schluessel = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  kind: "PLATTFORM" | "GERAET";
  geraetLabel: string | null;
};

/**
 * Selbstverwaltung der API-Schlüssel.
 * Der Klartext erscheint genau einmal nach dem Anlegen — danach nur der Präfix.
 *
 * `art` trennt die beiden Welten (Betreiber 2026-09-22): „PLATTFORM" ist der
 * volle Zugang für Marke-Mitglieder, „GERAET" der eingeschränkte Zugang für
 * Maschinen wie den eMix1500 — den darf jedes Konto anlegen.
 */
export function ApiKeyManager({ art = "PLATTFORM" }: { art?: "PLATTFORM" | "GERAET" }) {
  const geraet = art === "GERAET";
  const [keys, setKeys] = useState<Schluessel[]>([]);
  const [neuName, setNeuName] = useState("");
  const [neuGeraet, setNeuGeraet] = useState("");
  const [frisch, setFrisch] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const laden = useCallback(async () => {
    const res = await fetch(withBasePath("/api/api-keys"));
    if (res.ok) {
      const alle: Schluessel[] = (await res.json()).keys;
      setKeys(alle.filter((k) => k.kind === art));
    }
  }, [art]);
  useEffect(() => {
    laden();
  }, [laden]);

  async function anlegen() {
    setLaedt(true);
    setFehler(null);
    try {
      const res = await fetch(withBasePath("/api/api-keys"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: neuName || (geraet ? "Geräte-Schlüssel" : "API-Schlüssel"),
          kind: art,
          geraetLabel: neuGeraet,
        }),
      });
      const daten = await res.json();
      if (!res.ok) {
        setFehler(daten?.error ?? "Anlegen fehlgeschlagen.");
        return;
      }
      setFrisch(daten.schluessel);
      setNeuName("");
      setNeuGeraet("");
      await laden();
    } finally {
      setLaedt(false);
    }
  }

  async function widerrufen(id: string, name: string) {
    if (!confirm(`Schlüssel „${name}" widerrufen? Anwendungen, die ihn nutzen, verlieren sofort den Zugriff.`)) return;
    await fetch(withBasePath("/api/api-keys"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await laden();
  }

  return (
    <div className="space-y-3">
      {frisch && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">
            Dein neuer Schlüssel — er wird nur dieses eine Mal angezeigt:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-800 ring-1 ring-emerald-200">
              {frisch}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(frisch).then(() => {
                  setKopiert(true);
                  setTimeout(() => setKopiert(false), 1500);
                });
              }}
              className="btn-secondary shrink-0 text-xs"
            >
              {kopiert ? <Check size={14} /> : <Copy size={14} />} kopieren
            </button>
          </div>
        </div>
      )}

      {keys.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <KeyRound size={14} className="shrink-0 text-slate-400" />
              <span className="font-medium text-slate-800">{k.name}</span>
              {k.geraetLabel && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {k.geraetLabel}
                </span>
              )}
              <code className="text-xs text-slate-500">{k.prefix}…</code>
              <span className="ml-auto text-xs text-slate-400">
                {k.lastUsedAt
                  ? `zuletzt ${new Date(k.lastUsedAt).toLocaleDateString("de-CH")}`
                  : "noch nicht genutzt"}
              </span>
              <button
                type="button"
                onClick={() => widerrufen(k.id, k.name)}
                title="Widerrufen"
                className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={neuName}
          onChange={(e) => setNeuName(e.target.value)}
          placeholder={geraet ? "Name, z. B. eMix1500 Halle 2" : "Zweck, z. B. ERP-Anbindung"}
          className="input max-w-xs"
        />
        {geraet && (
          <input
            type="text"
            value={neuGeraet}
            onChange={(e) => setNeuGeraet(e.target.value)}
            placeholder="Seriennummer (freiwillig)"
            className="input max-w-[14rem]"
          />
        )}
        <button type="button" onClick={anlegen} disabled={laedt} className="btn-primary text-sm">
          Schlüssel erzeugen
        </button>
      </div>
    </div>
  );
}
