#!/bin/bash
# start.sh — DER EINE BEFEHL nach jedem Container-Start/-Rebuild.
#
# Stellt den kompletten Arbeitsstand der letzten Session wieder her und startet
# die App:
#   1. Postgres starten (aus den mitgewanderten Daten in .postgres-data/)
#   2. App-Abhängigkeiten + Prisma-Client für diese Plattform sicherstellen
#   3. Claude-Chats/Memory/Login aus dem Bundle zurückspielen (falls nötig)
#   4. Dev-Server auf http://localhost:3000 starten
#
# Idempotent und gefahrlos beliebig oft ausführbar.
#
# Aufruf:  bash scripts/start.sh
set -e
cd /workspace

echo "=================================================="
echo " Marketplace — Wiederherstellung & Start"
echo "=================================================="

echo; echo "[1/4] Datenbank"
bash scripts/init-postgres.sh

echo; echo "[2/4] App-Abhängigkeiten"
bash scripts/bootstrap-app.sh

echo; echo "[3/4] Claude-Session (Chats/Memory/Login)"
bash scripts/restore-session.sh || echo "  (übersprungen)"

echo; echo "[4/4] Dev-Server"
echo "  → http://localhost:3000   (Strg+C zum Beenden)"
echo
npm run dev
