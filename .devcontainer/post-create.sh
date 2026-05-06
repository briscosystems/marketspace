#!/bin/bash
set -e
sudo npm install -g @anthropic-ai/claude-code expo-cli
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  sudo -u postgres initdb -D /var/lib/postgresql/data
  echo "host all all 0.0.0.0/0 trust" | sudo tee -a /var/lib/postgresql/data/pg_hba.conf
  echo "listen_addresses = '*'" | sudo tee -a /var/lib/postgresql/data/postgresql.conf
fi
sudo -u postgres pg_ctl -D /var/lib/postgresql/data -l /tmp/pg.log start || true
sudo -u postgres psql -c "CREATE DATABASE marketplace;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER marketplace WITH PASSWORD 'marketplace';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marketplace TO marketplace;" 2>/dev/null || true
