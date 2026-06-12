#!/bin/bash
# Bootstrapped Postgres im Container — ROBUST gegen Umzug auf andere Rechner.
#
# Verhalten:
#   - Wenn /var/lib/postgresql/data leer ist: initdb, pg_hba für md5,
#     postgres starten, Rolle 'marketplace' + DB 'marketplace' anlegen.
#   - Wenn die Daten schon existieren (z.B. bind-mount mit alten Daten nach
#     Umzug): Besitz korrigieren, eventuelle stale postmaster.pid entfernen,
#     postgres starten. KEIN initdb auf vorhandene Daten.
#
# WICHTIG (Lehre aus dem Umzugs-Bug):
#   Das Datenverzeichnis gehört dem 'postgres'-User mit Maske 0700. Der
#   'node'-User, unter dem dieses Script läuft, kann PG_VERSION dann NICHT
#   sehen — ein einfaches `[ -f $DATA_DIR/PG_VERSION ]` liefert fälschlich
#   "nicht vorhanden" und löst ein zerstörerisches initdb aus, das mit
#   "directory not empty" abbricht und den ganzen Container-Aufbau killt.
#   Deshalb wird die Existenz IMMER mit `sudo test -f` geprüft.
#
# Wird vom postCreateCommand des Devcontainers aufgerufen, kann aber auch
# jederzeit manuell laufen (idempotent).

DATA_DIR="/var/lib/postgresql/data"

echo "==> Postgres init/start"

# Laufzeit-Verzeichnis für den Unix-Socket sicherstellen
sudo mkdir -p /run/postgresql 2>/dev/null || true

# Besitz sicherstellen (nach Umzug kann die UID-Zuordnung wackeln)
sudo chown -R postgres:postgres "$DATA_DIR" /run/postgresql 2>/dev/null || true

# Existenz des Clusters MIT sudo prüfen (node kann nicht in das 0700-Dir schauen)
if ! sudo test -f "$DATA_DIR/PG_VERSION"; then
  echo "    Datenverzeichnis leer — führe initdb aus"
  if ! sudo -u postgres initdb -D "$DATA_DIR" -E UTF8 --locale=C >/dev/null; then
    echo "    !! initdb fehlgeschlagen" >&2
    exit 1
  fi
  # md5-Auth für lokale Verbindungen — sonst kommt der marketplace-User nicht rein
  sudo -u postgres bash -c "cat > $DATA_DIR/pg_hba.conf" <<'EOF'
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             0.0.0.0/0               md5
EOF
  sudo -u postgres bash -c "echo \"listen_addresses = '*'\" >> $DATA_DIR/postgresql.conf"
else
  echo "    Vorhandenes Datenverzeichnis erkannt (kein initdb)"
fi

# stale Lock-Datei entfernen falls vorhanden (passiert nach unsauberem Container-Stop
# oder nach Umzug, wenn die alte PID im neuen Container nicht mehr existiert)
if sudo test -f "$DATA_DIR/postmaster.pid"; then
  PID=$(sudo head -1 "$DATA_DIR/postmaster.pid" 2>/dev/null || echo "")
  if [ -n "$PID" ] && ! sudo kill -0 "$PID" 2>/dev/null; then
    echo "    stale postmaster.pid (PID $PID existiert nicht mehr) — entferne"
    sudo rm -f "$DATA_DIR/postmaster.pid"
  fi
fi

# Postgres starten falls noch nicht
if ! sudo -u postgres pg_ctl -D "$DATA_DIR" status >/dev/null 2>&1; then
  echo "    starte postgres"
  if ! sudo -u postgres pg_ctl -D "$DATA_DIR" -l /tmp/postgres.log -w start; then
    echo "    !! postgres start fehlgeschlagen — siehe /tmp/postgres.log" >&2
    sudo tail -20 /tmp/postgres.log >&2 2>/dev/null || true
    exit 1
  fi
else
  echo "    postgres läuft bereits"
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
