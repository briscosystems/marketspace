#!/bin/bash
# Bootstraps Postgres im Container.
#
# Verhalten:
#   - Wenn /var/lib/postgresql/data leer ist: initdb, pg_hba für md5,
#     postgres starten, Rolle 'marketplace' + DB 'marketplace' anlegen.
#   - Wenn die Daten schon existieren (z.B. bind-mount mit alten Daten):
#     nur eventuelle stale postmaster.pid entfernen und postgres starten.
#
# Wird vom postCreateCommand des Devcontainers aufgerufen, kann aber auch
# manuell laufen.

set -e
DATA_DIR="/var/lib/postgresql/data"

echo "==> Postgres init/start"

# Sicherstellen dass postgres-User das Verzeichnis besitzt
sudo chown -R postgres:postgres "$DATA_DIR" /run/postgresql 2>/dev/null || true

if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  echo "    Datenverzeichnis leer — führe initdb aus"
  sudo -u postgres initdb -D "$DATA_DIR" -E UTF8 --locale=C >/dev/null
  # md5-Auth für lokale Verbindungen — sonst kommt der marketplace-User nicht rein
  sudo -u postgres bash -c "cat > $DATA_DIR/pg_hba.conf" <<'EOF'
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             0.0.0.0/0               md5
EOF
  sudo -u postgres bash -c "echo \"listen_addresses = '*'\" >> $DATA_DIR/postgresql.conf"
fi

# stale Lock-Datei entfernen falls vorhanden (passiert nach unsauberem Container-Stop)
if [ -f "$DATA_DIR/postmaster.pid" ]; then
  PID=$(head -1 "$DATA_DIR/postmaster.pid" 2>/dev/null || echo "")
  if [ -n "$PID" ] && ! kill -0 "$PID" 2>/dev/null; then
    echo "    stale postmaster.pid (PID $PID gibt's nicht mehr) — entferne"
    sudo rm -f "$DATA_DIR/postmaster.pid"
  fi
fi

# Postgres starten falls noch nicht
if ! sudo -u postgres pg_ctl -D "$DATA_DIR" status >/dev/null 2>&1; then
  echo "    starte postgres"
  sudo -u postgres pg_ctl -D "$DATA_DIR" -l /tmp/postgres.log start
fi

# Marketplace-User + DB anlegen falls nicht vorhanden
ROLE_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='marketplace'" 2>/dev/null || echo "")
if [ "$ROLE_EXISTS" != "1" ]; then
  echo "    lege Rolle 'marketplace' an"
  sudo -u postgres psql -c "CREATE USER marketplace WITH PASSWORD 'marketplace' SUPERUSER;" >/dev/null
fi
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='marketplace'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" != "1" ]; then
  echo "    lege DB 'marketplace' an"
  sudo -u postgres psql -c "CREATE DATABASE marketplace OWNER marketplace;" >/dev/null
fi

# Smoke
PGPASSWORD=marketplace psql -h localhost -U marketplace -d marketplace -tAc "SELECT 'OK', current_database();" \
  | head -1 | sed 's/^/    /'
