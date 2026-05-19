#!/bin/bash
# Backup-Skript für Brisco Marketplace
#
# Erzeugt:
#   1. einen pg_dump der Marketplace-Datenbank unter backups/<timestamp>.sql.gz
#   2. einen Snapshot des aktuellen Repository-Stands als git tag
#      (oder, falls --commit gesetzt, einen normalen Commit mit dem
#       Working-Tree-Zustand)
#
# Aufruf:
#   ./scripts/backup.sh              # nur DB + Git-Tag
#   ./scripts/backup.sh --commit     # DB + Commit + Tag
#   ./scripts/backup.sh --label foo  # benannter Backup ("foo")

set -e
cd "$(dirname "$0")/.."

LABEL=""
DO_COMMIT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --commit) DO_COMMIT=1; shift ;;
    --label) LABEL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

TS=$(date -u +%Y-%m-%dT%H%M%SZ)
TAG_NAME="backup/${TS}${LABEL:+-$LABEL}"
DUMP_FILE="backups/${TS}${LABEL:+-$LABEL}.sql.gz"

mkdir -p backups

echo "==> 1/3  Postgres-Dump → $DUMP_FILE"
PGPASSWORD=marketplace pg_dump \
  -h localhost -U marketplace -d marketplace \
  --clean --if-exists --no-owner --no-privileges \
  | gzip -9 > "$DUMP_FILE"
SIZE=$(stat -c '%s' "$DUMP_FILE" 2>/dev/null || stat -f '%z' "$DUMP_FILE")
echo "    OK  $(numfmt --to=iec --suffix=B $SIZE 2>/dev/null || echo "${SIZE} bytes")"

if [ "$DO_COMMIT" = "1" ]; then
  echo "==> 2/3  Git-Commit"
  if [ -z "$(git status --porcelain)" ]; then
    echo "    nichts zu committen"
  else
    git add -A
    git commit -m "backup: $TS${LABEL:+ ($LABEL)}" --no-gpg-sign >/dev/null
    echo "    OK  $(git log -1 --oneline)"
  fi
else
  echo "==> 2/3  (kein --commit gesetzt — Working-Tree bleibt wie er ist)"
fi

echo "==> 3/3  Git-Tag $TAG_NAME"
git tag -f "$TAG_NAME"
echo "    OK"

echo
echo "Backup fertig:"
echo "  DB-Dump      : $DUMP_FILE"
echo "  Git-Tag      : $TAG_NAME → $(git rev-parse --short HEAD)"
echo
echo "Wiederherstellen:"
echo "  Code   : git checkout $TAG_NAME"
echo "  DB     : gunzip -c $DUMP_FILE | PGPASSWORD=marketplace psql -h localhost -U marketplace -d marketplace"
