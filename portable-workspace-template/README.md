# portable-workspace-template

Macht **jedes** Devcontainer-Projekt vollständig **portabel**: Claude-Chats,
Memory und Login (sowie optional die Datenbank) liegen künftig **im
Projektordner** und wandern verlustfrei mit, wenn du den Ordner verschiebst.
Alle Credentials bleiben im Projektordner/Container — nichts geht beim Umzug
verloren.

## Das Problem, das es löst

In Devcontainern liegt der Claude-State (`~/.claude/`: Chats, Memory, Login)
**im Container-Home**, **nicht** im gemounteten Projektordner. Verschiebst oder
rebuildest du, ist er weg. Dieses Template verlagert ihn per Bind-Mount in den
Projektordner — damit steckt der komplette Arbeitsstand in EINEM verschiebbaren
Ordner.

## Verwendung

1. Diesen Ordner (`portable-workspace-template/`) ins Zielprojekt kopieren —
   oder von hier aus mit Pfad aufrufen.
2. Im Zielprojekt-Root ausführen:

   ```bash
   # Minimal (nur Claude-State portabel machen):
   bash portable-workspace-template/install.sh

   # Mit Postgres-Datenverzeichnis, das in den Ordner gebunden werden soll:
   bash portable-workspace-template/install.sh --pg-data .postgres-data

   # Nur Struktur/Mounts einrichten, NICHT mit aktuellem Home befüllen:
   bash portable-workspace-template/install.sh --no-copy
   ```

3. **Container neu bauen** (Rebuild). Ab dann landet der Claude-State automatisch
   im Projektordner.

## Was install.sh einrichtet

- `.claude-state/` im Projekt (Chats + Memory + Login-Token), bei Bedarf direkt
  mit dem aktuellen `~/.claude` befüllt.
- `scripts/snapshot-session.sh` (Home → Bundle, vor Umzug) und
  `scripts/restore-session.sh` (Bundle → Home, Fallback).
- `.gitignore`-Einträge für `/.claude-state/` (und optional das DB-Verzeichnis).
- Bind-Mounts in `.devcontainer/devcontainer.json` (automatisches Patchen bei
  reinem JSON; bei JSONC/Kommentaren wird der Snippet zum manuellen Einfügen
  ausgegeben).
- `MIGRATION.md` mit der vollständigen Umzugsanleitung.

## Inhalt des Templates

```
portable-workspace-template/
├── README.md                  # diese Datei
├── install.sh                 # richtet alles im Zielprojekt ein
├── MIGRATION.template.md      # wird als MIGRATION.md ins Projekt kopiert
└── scripts/
    ├── snapshot-session.sh    # Home -> .claude-state (vor Umzug)
    └── restore-session.sh     # .claude-state -> Home (Fallback)
```

## Sicherheit

`.claude-state/credentials.json` enthält deinen persönlichen Claude-OAuth-Token.
Das Template setzt ihn auf `chmod 600` und schließt `.claude-state/` per
`.gitignore` aus. Trotzdem gilt: **Projektordner nicht teilen oder committen**,
solange der Token darin liegt. Wer den Ordner hat, hat den Token.

## Voraussetzungen / Annahmen

- Devcontainer mit Bind-Mount des Projektordners (Standard bei VS Code Dev
  Containers).
- Für automatisches Patchen von `devcontainer.json`: `node` verfügbar und die
  Datei ist reines JSON (kein JSONC). Sonst wird der Snippet zum manuellen
  Einfügen ausgegeben.
- DB-Persistenz funktioniert für jede DB, deren Datenverzeichnis sich per
  Bind-Mount in den Projektordner legen lässt (Beispiel hier: Postgres →
  `/var/lib/postgresql/data`).
