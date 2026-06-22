# Workspace verschieben — komplette Anleitung

Diese Anleitung beschreibt, wie du den **gesamten** Marketplace-Workspace in einen
anderen Ordner (oder auf einen anderen Rechner) verschiebst, **ohne dass etwas
verloren geht** — inklusive der lokalen Datenbank, der Git-Historie und der
kompletten Claude-Sitzung (Chats, Prompts, Memory, Login).

> **Stand 2026-06-12:** Zwei Fehlerquellen, die beim letzten Umzug zum
> „Code-Zustand verloren"-Problem geführt haben, sind jetzt behoben — siehe
> Abschnitt **„Was zuletzt repariert wurde"** ganz unten. Wenn du die
> Schritt-für-Schritt-Anleitung befolgst, läuft der Umzug sauber durch.

---

## ⭐ Der EINE Befehl nach Container-Neustart

Nach jedem Container-Start/-Rebuild stellt **ein** Befehl alles wieder her
(DB starten + App-Abhängigkeiten + Chats/Memory + Dev-Server):

```bash
init
```

`init` ist ein Kurzbefehl-Alias für `bash scripts/start.sh`. Er wird beim
Container-Aufbau automatisch eingerichtet (`scripts/install-alias.sh`), ist also
in jedem neuen Terminal sofort da. Falls er mal nicht greift (z.B. allererstes
Terminal nach Einrichtung), einmal `source ~/.bashrc` — oder direkt
`bash scripts/start.sh` tippen.

Das ist idempotent und gefahrlos beliebig oft ausführbar. (Bei einem frisch
gebauten Container läuft das meiste davon ohnehin automatisch über den
`postCreateCommand` — `init` ist die manuelle Garantie, falls etwas hakt.)

---

## TL;DR — der ganze Stand steckt in EINEM Ordner

Nach dieser Einrichtung liegt **alles** innerhalb des Workspace-Ordners.
Du verschiebst genau diesen einen Ordner — fertig.

| Was | Wo im Ordner | Wandert automatisch mit? |
|-----|--------------|--------------------------|
| Code | Projektdateien | ✅ |
| Git-Historie + lokale Commits | `.git/` | ✅ (reines Lokal-Repo, kein Remote nötig) |
| **Datenbank** (PostgreSQL, alle SDS/Produkte) | `.postgres-data/` | ✅ |
| DB-Sicherungs-Dumps | `backups/` | ✅ |
| **Claude-Chats + alle Prompts** | `.claude-state/projects/` | ✅ |
| **Claude-Memory** (Projekt-Gedächtnis) | `.claude-state/projects/-workspace/memory/` | ✅ |
| **Claude-Login** (OAuth-Token) | `.claude-state/credentials.json` | ✅ |
| Claude-Berechtigungen | `.claude/settings.local.json` | ✅ |
| Env (DB-URL, Secrets) | `.env` | ✅ |
| Devcontainer-Definition | `.devcontainer/` | ✅ |

> ⚠️ **`.claude-state/` und `.postgres-data/` sind absichtlich gitignored.**
> Sie enthalten Token, Chats und eine grosse Binär-DB — die gehören nie nach
> GitHub. Sie wandern **per Datei-Kopie** mit (siehe unten), **nicht** über Git.

---

## ‼️ Einmalig: Container EINMAL neu bauen, damit alles automatisch wird

Damit Chats/Memory/Login automatisch im Ordner landen (statt im Container),
müssen die `.claude-state`-Mounts aktiv sein. Sie sind in `devcontainer.json`
eingetragen, werden aber erst nach **einem** Container-Rebuild wirksam.

**Mach das einmal jetzt auf diesem Rechner:**

1. `bash scripts/snapshot-session.sh` — sichert die aktuellen Chats/Memory in
   den Ordner (falls die Mounts noch nicht live sind; sonst No-Op).
2. VS Code → Command Palette → **„Dev Containers: Rebuild Container"**.

Ab dann gilt: Chats, Memory, Login, DB und Code liegen **live** im Ordner.
Verschieben = Ordner kopieren, neu öffnen, rebuild — sonst nichts.

---

## Wie funktioniert die automatische Persistenz?

`.devcontainer/devcontainer.json` mountet vier Dinge aus dem Workspace-Ordner ins
Container-Home, sodass Claude und Postgres ihren Zustand **innerhalb** des
verschiebbaren Ordners ablegen:

```
${workspaceFolder}              -> /workspace                       (Code)
.postgres-data                  -> /var/lib/postgresql/data         (Datenbank)
.claude-state/projects          -> /home/node/.claude/projects      (Chats + Memory)
.claude-state/credentials.json  -> /home/node/.claude/.credentials.json (Login)
```

Beim Container-Aufbau (`postCreateCommand`) laufen automatisch:
- `scripts/init-postgres.sh` — startet Postgres aus den mitgewanderten Daten
  (oder initialisiert frisch, wenn der Ordner leer ist).
- `scripts/bootstrap-app.sh` — `npm install` + `prisma generate` +
  `prisma db push`, damit die App **auf diesem Rechner / dieser CPU** lauffähig
  ist (native Binaries werden neu gebaut).

Dadurch ist ab dem nächsten Container-Rebuild **alles automatisch** im Ordner.

---

## Umzug Schritt für Schritt

### 1. Letzten Stand ins Bundle spiegeln (nur falls Mounts noch nicht live)
```bash
bash scripts/snapshot-session.sh
```
Ist der Live-Mount schon aktiv, erkennt das Skript das selbst und macht nichts.

### 2. (Empfohlen) Frischen DB-Dump ziehen — Sicherheitsnetz
Die DB wandert zwar binär in `.postgres-data/` mit, ein logischer Dump ist aber
unabhängig vom PG-Versions-/Plattform-Stand wiederherstellbar:
```bash
# Postgres muss laufen; dann:
bash scripts/backup.sh --label vor-umzug
```

### 3. Container / Datenbank stoppen
Eine laufende DB nicht im Betrieb kopieren. VS Code schließen bzw. den
Devcontainer stoppen (Postgres wird mitgestoppt). Damit ist `.postgres-data/`
konsistent.

### 4. Ordner verschieben — als DATEI-Kopie, NICHT per git
Auf dem **Host** (nicht im Container). Wichtig: versteckte Dateien (`.git`,
`.postgres-data`, `.claude-state`, `.env`) müssen mit. `git clone` würde sie
verlieren — daher Dateisystem-Kopie:

```bash
# Beispiel macOS/Linux — kopiert ALLES inkl. Hidden + gitignored:
rsync -a --info=progress2  /alter/pfad/marketplace/  /neuer/pfad/marketplace/

# oder einfach verschieben:
mv /alter/pfad/marketplace  /neuer/pfad/marketplace
```

Auf Windows: im Explorer mit „ausgeblendete Elemente anzeigen" den **kompletten**
Ordner kopieren/verschieben.

> 💡 `node_modules` muss NICHT zwingend mit — `bootstrap-app.sh` baut die
> Abhängigkeiten beim ersten Container-Aufbau ohnehin neu für die Zielplattform.
> (Mitkopieren schadet nicht, dauert nur länger.)

### 5. Im neuen Pfad öffnen + Container neu bauen
Ordner in VS Code öffnen → „Reopen in Container" / „Rebuild Container".
Der `postCreateCommand` erledigt automatisch:
- Postgres findet seine Daten in `.postgres-data/` → DB vollständig da.
- `npm install` + `prisma generate` → App lauffähig auf der neuen CPU.
- Claude findet Chats/Memory/Login unter `~/.claude/` → Sitzung nahtlos da.

Danach App starten: `npm run dev` → http://localhost:3000
(oder einfach `bash scripts/start.sh`, das startet den Dev-Server gleich mit.)

### 6. Falls Claude-State mal NICHT automatisch da ist (Fallback)
```bash
bash scripts/restore-session.sh
```

---

## Troubleshooting — „es läuft nicht / Zustand weg"

Alles unten ist idempotent und gefahrlos mehrfach ausführbar:

| Symptom | Fix |
|---------|-----|
| Irgendwas läuft nach Neustart nicht | `bash scripts/start.sh` (macht alles) |
| App zeigt DB-Verbindungsfehler / Seite lädt nicht | `bash scripts/init-postgres.sh` |
| `initdb: directory not empty` o.ä. beim Start | War der alte Bug — jetzt behoben. Script neu ziehen + `bash scripts/init-postgres.sh` |
| Prisma-/Modul-Fehler, App startet nicht | `bash scripts/bootstrap-app.sh` |
| Alte Chats/Memory fehlen nach Umzug | `bash scripts/restore-session.sh` |

Smoke-Test DB:
```bash
PGPASSWORD=marketplace psql -h localhost -U marketplace -d marketplace -c \
  'SELECT count(*) FROM "Product";'
```

---

## Stolpersteine / Garantien

- **Pfad-Stabilität:** Der Container mountet immer auf `/workspace`, egal wo der
  Host-Ordner liegt. Deshalb bleibt der Claude-Projektschlüssel `-workspace`
  stabil und die alten Chats werden zuverlässig gefunden — auch nach Umzug.
- **Git-Zugang:** Aktuell ein **lokales** Repo ohne Remote. Die gesamte Historie
  steckt in `.git/` und wandert mit.
- **Token-Sicherheit:** `.claude-state/credentials.json` ist dein persönlicher
  Login. Der Ordner darf deshalb nicht weitergegeben oder committet werden
  (ist gitignored). Wer den Ordner hat, hat den Token.
- **DB nie im laufenden Zustand kopieren** — erst Container/Postgres stoppen.

---

## Was zuletzt repariert wurde (2026-06-12)

Beim letzten Umzug ging der Zustand aus **zwei** Gründen scheinbar verloren —
beide sind jetzt behoben:

1. **Postgres startete nach Umzug nicht.** `scripts/init-postgres.sh` prüfte, ob
   ein DB-Cluster existiert, als `node`-User. Das Datenverzeichnis gehört aber
   `postgres` (Maske 0700) — `node` „sieht" `PG_VERSION` nicht und das Script
   hielt die vorhandene DB fälschlich für leer, startete `initdb`, das mit
   „directory not empty" abbrach und den ganzen Container-Aufbau killte. **Fix:**
   Existenzprüfung jetzt mit `sudo test -f`; nie wieder initdb auf vorhandene
   Daten; klare Fehlermeldungen statt stillem Abbruch.

2. **App-Abhängigkeiten waren plattform-spezifisch kaputt.** `node_modules`
   (Prisma-Engine, Next-SWC) ist gitignored und CPU-/OS-abhängig. Auf einem
   anderen Rechner waren die kopierten Binaries unbrauchbar. **Fix:** Neues
   `scripts/bootstrap-app.sh` (im `postCreateCommand`) baut Abhängigkeiten +
   Prisma-Client beim Container-Aufbau für die Zielplattform neu.

Zusätzlich erkennt `scripts/snapshot-session.sh` jetzt den aktiven Live-Mount und
macht dann gefahrlos nichts, statt Dateien auf sich selbst zu kopieren.

### Was bereits eingerichtet wurde
- `.devcontainer/devcontainer.json` — Mounts (Postgres + Claude projects +
  credentials) und `postCreateCommand` (Postgres-Init **und** App-Bootstrap)
- `.gitignore` — `/.claude-state/` und `/.postgres-data/` ausgeschlossen
- `scripts/start.sh` — EIN Befehl: DB + App + Session + Dev-Server (neu)
- `scripts/init-postgres.sh` — Postgres-Start, umzugs-robust (repariert)
- `scripts/bootstrap-app.sh` — npm install + prisma generate + db push (neu)
- `scripts/snapshot-session.sh` — Home → Bundle (vor Umzug), No-Op wenn live
- `scripts/restore-session.sh` — Bundle → Home (Fallback)
