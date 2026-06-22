#!/bin/bash
# save.sh — EIN Befehl, der den kompletten Zustand sichert:
#   1. Code: alles committen + nach GitHub pushen
#   2. Datenbank: Dump nach backups/ + Git-Tag (auch nach GitHub)
#   3. Chat/Memory/Login: liegen live in .claude-state/ (Snapshot No-Op)
#
# Aufruf:
#   bash scripts/save.sh              # automatischer Zeitstempel-Label
#   bash scripts/save.sh "mein-label" # eigener Label
#
# Du musst dir nichts merken: alternativ sag Claude einfach „speichere alles".
set -e
cd "$(dirname "$0")/.."

LABEL="${1:-stand-$(date -u +%Y%m%dT%H%M%SZ)}"
REPO_URL="https://github.com/briscosystems/marketspace.git"

# GitHub-Token aus der (gitignorierten) Datei lesen — wird NICHT in der Git-Config gespeichert.
TOKEN_FILE="$(find . -maxdepth 1 -iname 'github token*' | head -1)"
TOKEN=""
[ -n "$TOKEN_FILE" ] && TOKEN="$(tr -d ' \t\r\n' < "$TOKEN_FILE")"
PUSH_URL="https://x-access-token:${TOKEN}@${REPO_URL#https://}"

echo "==> 1/3  Code committen + pushen"
git add -A
if git diff --cached --quiet; then
  echo "    (keine Änderungen — nichts zu committen)"
else
  git commit -q -m "save: ${LABEL}

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  echo "    committet."
fi
if [ -n "$TOKEN" ]; then
  GIT_TERMINAL_PROMPT=0 git push "$PUSH_URL" HEAD:main 2>&1 | sed "s/${TOKEN}/***/g" | tail -2
else
  echo "    ⚠ kein Token gefunden ('github token'-Datei) — Push übersprungen."
fi

echo "==> 2/3  Datenbank sichern (Dump + Tag)"
./scripts/backup.sh --label "$LABEL" >/dev/null
NEWTAG="$(git for-each-ref --sort=-creatordate --format='%(refname:short)' refs/tags/backup | head -1)"
echo "    DB-Dump: $(ls -1t backups/*.sql.gz | head -1)"
echo "    Tag:     ${NEWTAG}"
if [ -n "$TOKEN" ] && [ -n "$NEWTAG" ]; then
  GIT_TERMINAL_PROMPT=0 git push "$PUSH_URL" "refs/tags/${NEWTAG}" 2>&1 | sed "s/${TOKEN}/***/g" | tail -1
fi

echo "==> 3/3  Chat/Memory/Login"
bash scripts/snapshot-session.sh 2>&1 | tail -1

echo ""
echo "✅ Gesichert: Code (GitHub), DB-Dump (backups/), Tag, Chat/Memory (.claude-state/)."
