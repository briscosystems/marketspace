#!/usr/bin/env bash
# Persistentes Off-Machine-Backup des Claude-Chatverlaufs (Betreiber 2026-08-16).
#
# Gesichert werden die Gespraeche (.jsonl) und das Memory aus
# ~/.claude/projects/-workspace — NICHT die grossen Arbeitsdaten
# (tool-results, subagents, tasks), die machten das Archiv >200 MB gross.
#
# Das Archiv geht auf den EIGENEN Zweig "verlauf-backup" im privaten
# GitHub-Repo — bewusst NICHT auf main:
#  - main wuerde mit jedem Backup dauerhaft um ~30 MB wachsen (Git vergisst nie)
#  - jeder Push auf main loest einen Railway-Deploy aus
# Der Zweig wird jedes Mal ERSETZT (ein vollstaendiges Archiv genuegt);
# gebaut wird er mit Git-Plumbing, ohne main oder den Arbeitsstand anzufassen.
#
# Wiederherstellen:
#   git fetch origin verlauf-backup && git checkout origin/verlauf-backup -- .
#   tar -xzf verlauf-*.tar.gz -C ~/.claude/projects/
#
# Laeuft automatisch am Ende von scripts/start.sh (Hintergrund) oder von Hand:
#   bash scripts/verlauf-backup.sh
set -e
cd "$(dirname "$0")/.."

QUELLE="$HOME/.claude/projects/-workspace"
[ -d "$QUELLE" ] || { echo "kein Verlauf gefunden"; exit 0; }

STEMPEL=$(date -u +%Y-%m-%dT%H%M%SZ)
ARCHIV="/tmp/verlauf-$STEMPEL.tar.gz"
# "./" vor dem Ordnernamen: er beginnt mit "-" und wuerde sonst als Option gelesen
tar -czf "$ARCHIV" -C "$(dirname "$QUELLE")" \
  --exclude "*/tool-results" --exclude "*/tool-results/*" \
  --exclude "*/subagents" --exclude "*/subagents/*" \
  --exclude "*/tasks" --exclude "*/tasks/*" \
  "./$(basename "$QUELLE")"

GROESSE=$(wc -c < "$ARCHIV")
if [ "$GROESSE" -gt 94371840 ]; then
  echo "Archiv zu gross fuer GitHub ($((GROESSE/1024/1024)) MB) — nicht gepusht: $ARCHIV"
  exit 0
fi

# Commit nur aus dem Archiv bauen (Plumbing) — main bleibt unberuehrt.
BLOB=$(git hash-object -w "$ARCHIV")
TREE=$(printf "100644 blob %s\tverlauf-%s.tar.gz\n" "$BLOB" "$STEMPEL" | git mktree)
COMMIT=$(git commit-tree "$TREE" -m "Verlauf-Backup $STEMPEL")

T=$(cat "./github token " | tr -d '\n\r ')
git push -q -f "https://$T@github.com/briscosystems/marketspace.git" "$COMMIT:refs/heads/verlauf-backup" 2>&1 | sed "s/$T/***/g" || {
  echo "Push fehlgeschlagen — Archiv bleibt lokal: $ARCHIV"; exit 0; }
rm -f "$ARCHIV"
echo "Verlauf gesichert auf Zweig verlauf-backup ($((GROESSE/1024/1024)) MB)"

# ── Datenbank gleich mitsichern ───────────────────────────────────────────
# Der Chatverlauf allein genuegt nicht: Ohne die Datenbank waeren Tanks,
# Messwerte, Konten und Erfahrungsberichte weg (Betreiber 2026-08-19).
# Der Dump geht auf den Zweig "db-backup" und wird dort ersetzt.
# DATABASE_URL steht in .env, nicht in der Umgebung des Skripts.
# Prisma haengt "?schema=public" an; pg_dump kennt diesen Parameter nicht.
DB_URL="${DATABASE_URL:-$(grep -m1 '^DATABASE_URL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"')}"
DB_URL="${DB_URL%%\?*}"
if command -v pg_dump >/dev/null 2>&1 && [ -n "$DB_URL" ]; then
  DUMP="/tmp/db-$STEMPEL.sql.gz"
  if pg_dump "$DB_URL" 2>/dev/null | gzip -9 > "$DUMP"; then
    DGROESSE=$(wc -c < "$DUMP")
    if [ "$DGROESSE" -lt 94371840 ] && [ "$DGROESSE" -gt 10000 ]; then
      DBLOB=$(git hash-object -w "$DUMP")
      DTREE=$(printf "100644 blob %s\tdatenbank-%s.sql.gz\n" "$DBLOB" "$STEMPEL" | git mktree)
      DCOMMIT=$(git commit-tree "$DTREE" -m "Datenbank-Sicherung $STEMPEL")
      git push -q -f "https://$T@github.com/briscosystems/marketspace.git" \
        "$DCOMMIT:refs/heads/db-backup" 2>&1 | sed "s/$T/***/g" \
        && echo "Datenbank gesichert auf Zweig db-backup ($((DGROESSE/1024/1024)) MB)"
    else
      echo "Datenbank-Dump uebersprungen (Groesse $((DGROESSE/1024/1024)) MB)"
    fi
    rm -f "$DUMP"
  fi
fi

