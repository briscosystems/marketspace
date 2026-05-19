#!/bin/bash
# Restore — spielt einen Dump zurück.
#
# Aufruf:
#   ./scripts/restore.sh                # nimmt den jüngsten Dump aus backups/
#   ./scripts/restore.sh <dump.sql.gz>  # nimmt eine konkrete Datei

set -e
cd "$(dirname "$0")/.."

DUMP="$1"
if [ -z "$DUMP" ]; then
  DUMP=$(ls -1t backups/*.sql.gz 2>/dev/null | head -1 || true)
  if [ -z "$DUMP" ]; then
    echo "Kein Dump in backups/ gefunden." >&2
    exit 1
  fi
  echo "==> Verwende jüngsten Dump: $DUMP"
fi
if [ ! -f "$DUMP" ]; then
  echo "Datei nicht gefunden: $DUMP" >&2
  exit 1
fi

# Postgres muss laufen
if ! sudo -u postgres pg_ctl -D /var/lib/postgresql/data status >/dev/null 2>&1; then
  echo "==> Postgres läuft nicht — starte über scripts/init-postgres.sh"
  ./scripts/init-postgres.sh
fi

echo "==> Stelle DB aus $DUMP wieder her"
gunzip -c "$DUMP" \
  | PGPASSWORD=marketplace psql \
      -h localhost -U marketplace -d marketplace \
      --quiet --no-psqlrc \
      -v ON_ERROR_STOP=0 \
  2>&1 | grep -vE "^(NOTICE|SET|DROP|CREATE)" | tail -20 || true

echo "==> Prisma-Client regenerieren (Schema kann sich seit Dump geändert haben)"
npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3
npx prisma generate 2>&1 | tail -2

echo
echo "Restore fertig."
PGPASSWORD=marketplace psql -h localhost -U marketplace -d marketplace -tAc \
  "SELECT 'Listings: ' || COUNT(*) FROM \"Listing\"; SELECT 'User: ' || COUNT(*) FROM \"User\"; SELECT 'SDS: ' || COUNT(*) FROM \"SafetyDataSheet\";" \
  | sed 's/^/  /'
