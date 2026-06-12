#!/bin/bash
# restore-session.sh  (portable-workspace-template)
# Stellt Claude-Chats, Memory und Login aus dem mitgewanderten Bundle
# <projekt>/.claude-state/ ins Container-Home zurück.
#
# Normalfall im Devcontainer: NICHT nötig — die Mounts in devcontainer.json
# legen den State automatisch ins Home. Dieses Skript ist der Fallback
# (Nutzung ausserhalb des Devcontainers oder Mount greift nicht).
#
#   bash scripts/restore-session.sh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${PROJECT_ROOT}/.claude-state"
DEST="${HOME}/.claude"

if [ ! -d "$SRC" ]; then
  echo "FEHLER: $SRC nicht gefunden."
  exit 1
fi

mkdir -p "$DEST/projects"

if [ -d "$SRC/projects" ]; then
  cp -a "$SRC/projects/." "$DEST/projects/"
  echo "Chats + Memory wiederhergestellt."
fi

if [ -f "$SRC/credentials.json" ]; then
  cp -a "$SRC/credentials.json" "$DEST/.credentials.json"
  chmod 600 "$DEST/.credentials.json"
  echo "Login-Token wiederhergestellt."
else
  echo "Kein Token im Bundle — bei Bedarf einmalig 'claude login' ausführen."
fi

echo "Fertig. Claude findet die alten Sessions wieder unter ~/.claude/projects/."
