#!/bin/bash
# bootstrap-app.sh — stellt sicher, dass die Next.js-App im Container lauffähig
# ist, unabhängig davon WIE der Workspace auf diesen Rechner kam.
#
# Warum nötig (Lehre aus dem Umzug):
#   node_modules ist gross, plattform-spezifisch (Prisma-Query-Engine,
#   Next-SWC-Binaries) und gitignored. Wird der Ordner zwischen Rechnern mit
#   unterschiedlicher CPU/OS kopiert, sind die nativen Binaries unbrauchbar —
#   die App startet dann nicht ("code state lost"-Gefühl). Dieses Script baut
#   die Abhängigkeiten für DEN AKTUELLEN Container neu auf. Idempotent: wenn
#   schon alles passt, ist es schnell.
#
# Wird vom postCreateCommand aufgerufen, läuft aber auch manuell.
set -e
cd /workspace

echo "==> App-Bootstrap"

# 1. Node-Abhängigkeiten für diese Plattform sicherstellen
echo "    npm install (Abhängigkeiten für diesen Container)"
npm install --no-audit --no-fund

# 2. Prisma-Client für diese Plattform generieren (native Engine!)
echo "    prisma generate"
npx prisma generate >/dev/null

# 3. Schema gegen die (mitgewanderte) DB abgleichen — additiv, kein Datenverlust.
#    Falls die DB bereits in sync ist, ist das ein No-Op.
echo "    prisma db push (Schema-Abgleich)"
npx prisma db push --skip-generate

echo "==> App-Bootstrap fertig — 'npm run dev' startet die App auf :3000"
