# Projektordner verschieben — ohne Verlust

Dieses Projekt wurde mit dem **portable-workspace-template** portabel gemacht:
der **gesamte** Arbeitsstand steckt in EINEM Ordner und lässt sich verlustfrei
verschieben — inkl. Datenbank, Git-Historie und kompletter Claude-Sitzung
(Chats, Prompts, Memory, Login).

## Was im Ordner liegt und automatisch mitwandert

| Was | Wo im Ordner | gitignored? |
|-----|--------------|-------------|
| Code + Git-Historie | Projektdateien + `.git/` | – |
| **DB-Daten** (falls eingerichtet) | z. B. `.postgres-data/` | ✅ ja |
| **Claude-Chats + Prompts** | `.claude-state/projects/` | ✅ ja |
| **Claude-Memory** | `.claude-state/projects/*/memory/` | ✅ ja |
| **Claude-Login** (OAuth-Token) | `.claude-state/credentials.json` | ✅ ja |

> Die gitignored-Teile (Token, Chats, Binär-DB) wandern **per Datei-Kopie** mit —
> **nicht** über Git. Niemals committen oder den Ordner weitergeben.

## Automatische Persistenz

`.devcontainer/devcontainer.json` mountet aus dem Projektordner ins Container-Home:

```
.claude-state/projects        -> ~/.claude/projects            (Chats + Memory)
.claude-state/credentials.json -> ~/.claude/.credentials.json   (Login)
.postgres-data                -> /var/lib/postgresql/data       (DB, falls genutzt)
```

Ab dem nächsten Container-Rebuild landet der Claude-State automatisch im Ordner.

## Umzug Schritt für Schritt

1. **Letzten Stand sichern** (solange Auto-Mount noch nicht aktiv):
   ```bash
   bash scripts/snapshot-session.sh
   ```
2. **DB/Container stoppen** — eine laufende DB nie im Betrieb kopieren.
3. **Ordner als Datei-Kopie verschieben** (Hidden-Dateien müssen mit!):
   ```bash
   rsync -a --info=progress2  /alt/projekt/  /neu/projekt/
   # oder:  mv /alt/projekt  /neu/projekt
   ```
   **Nicht** `git clone` — das verliert `.git`-Untracked, DB und `.claude-state`.
4. **Im neuen Pfad öffnen → Rebuild Container.** Mounts greifen automatisch,
   alles ist nahtlos da.
5. **Fallback** (ausserhalb Devcontainer / Mount greift nicht):
   ```bash
   bash scripts/restore-session.sh
   ```

## Garantien / Stolpersteine

- **Pfad-Stabilität:** Der Container mountet immer auf denselben `workspaceFolder`,
  egal wo der Host-Ordner liegt → Claude-Projektschlüssel bleibt stabil, alte
  Chats werden wiedergefunden.
- **Git:** Die gesamte Historie steckt in `.git/` und wandert mit. Ein GitHub-
  Remote (falls vorhanden) erfordert beim Push eine Anmeldung; das brokert VS Code.
- **Token-Sicherheit:** `.claude-state/credentials.json` ist dein persönlicher
  Login — Ordner nicht teilen/committen (ist gitignored).
