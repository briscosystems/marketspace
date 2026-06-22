# Datenbank-Persistenz

## Aktueller Stand

| Pfad | Wo lebt das? | Überlebt … |
|---|---|---|
| `/workspace` | Bind-Mount vom Host (Devcontainer-Config) | Container-Rebuild, Host-Reboot |
| `/var/lib/postgresql/data` | Container-Schicht (kein Volume gemountet) | nur Container-Restart, **NICHT** Container-Rebuild |

→ **Wichtig**: Sobald du den Devcontainer neu baust (Rebuild, neuer Image-Layer,
"Rebuild Container" in VS Code), sind alle Listings, User, RFQs, Reviews
und SDS-Einträge weg, wenn du vorher keinen Dump gezogen hast.

Der SDS-PDF-Cache (`/workspace/data/sds/`) liegt aber im Repository und
bleibt — die Daten kannst du jederzeit mit `npx tsx prisma/seed-sds.ts`
neu in die DB laden.

## Schutz-Strategie (zweistufig)

### Stufe 1 — vor jedem Container-Rebuild

```bash
./scripts/backup.sh --commit --label pre-rebuild
```

Das erzeugt einen `pg_dump` unter `backups/<timestamp>.sql.gz` (im
Workspace, überlebt Rebuild ✓) und committet den aktuellen Code-Stand.

Nach dem Rebuild:

```bash
# Postgres läuft, aber leer — Schema erneuern und letzten Dump einspielen
npx prisma db push --skip-generate
gunzip -c backups/<letzter-dump>.sql.gz \
  | PGPASSWORD=marketplace psql -h localhost -U marketplace -d marketplace
npx prisma generate
```

### Stufe 2 — dauerhaft persistenter DB-Pfad (optional)

Wenn du nicht jedes Mal manuell sichern willst, kannst du in
`.devcontainer/devcontainer.json` einen Volume-Mount für den
Postgres-Datenpfad einrichten:

```jsonc
"mounts": [
  "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached",
  "source=${localWorkspaceFolder}/.postgres-data,target=/var/lib/postgresql/data,type=bind"
]
```

Dann landet `/var/lib/postgresql/data` als versteckter Unterordner
`.postgres-data/` im Workspace (bereits in `.gitignore` ausgeschlossen
über das `/backups/`- und `data/`-Pattern — bitte ergänze einen
expliziten Eintrag `/.postgres-data/`).

**Achtung**: Diese Änderung bedeutet einen Rebuild. Vorher Stufe 1
durchlaufen, sonst gehen die aktuellen Daten verloren.

### Stufe 3 — Cloud-Backup (für später)

`backups/*.sql.gz` ist über `.gitignore` aus Git ausgeschlossen, damit
die DB nicht versehentlich nach GitHub wandert. Für ein echtes
Off-Site-Backup empfiehlt sich später:

- entweder ein separates privates Repo `marketplace-backups/` mit
  Verschlüsselung (z.B. `gpg` vor dem Commit)
- oder ein S3/B2-Bucket — `aws s3 cp backups/ s3://… --recursive`

## Was reproduzierbar ist (ohne Backup)

- Schema → `npx prisma db push`
- SDS-PDFs → `npx tsx prisma/seed-sds.ts` (idempotent über SHA-256)
- Demo-User + Demo-Listings → `npx tsx prisma/seed.ts`

Was nicht reproduzierbar ist:

- Echte User-Konten, RFQs, Transaktionen, Reviews, Chat-Verläufe — **nur per Backup**.
