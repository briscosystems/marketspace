# Schnellanleitung — Umzug in 3 Schritten

> Gilt für jedes Projekt, das mit diesem Template eingerichtet wurde.
> Alle Befehle im **Projekt-Root** ausführen (im Terminal des Containers).

## Vor dem Umzug

**Schritt 1 — Letzten Stand sichern** (fängt die neuesten Chats ein):
```bash
bash scripts/snapshot-session.sh
```

**Schritt 2 — Container / Datenbank stoppen.**
VS Code schließen bzw. den Container stoppen (damit die Datenbank sauber zu ist).

**Schritt 3 — Den ganzen Ordner verschieben** (auf dem Rechner, NICHT im Container).
Wichtig: komplette Datei-Kopie inkl. versteckter Dateien — **nicht** `git clone`.
```bash
rsync -a  /alter/pfad/projekt/  /neuer/pfad/projekt/
# oder einfach:
mv  /alter/pfad/projekt  /neuer/pfad/projekt
```

## Nach dem Umzug

Ordner im neuen Pfad in VS Code öffnen → **"Reopen / Rebuild Container"**.
Alles ist automatisch wieder da: Code, Datenbank, Chats, Memory, Login.

**Falls doch mal etwas fehlt** (Notfall-Knopf):
```bash
bash scripts/restore-session.sh
```

## Die zwei Skripte auf einen Blick

| Skript | Wann | Was es tut |
|--------|------|------------|
| `scripts/snapshot-session.sh` | **vor** dem Umzug | sichert aktuelle Chats/Memory/Login in den Ordner |
| `scripts/restore-session.sh` | nur im Notfall | holt sie zurück ins Container-Home |

⚠️ **Der Ordner enthält deinen Login.** Nicht weitergeben, nicht hochladen.
