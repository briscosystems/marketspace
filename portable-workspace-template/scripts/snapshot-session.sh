#!/bin/bash
# snapshot-session.sh  (portable-workspace-template)
# Spiegelt die AKTUELLEN Claude-Chats, Memory und den Login aus dem
# Container-Home in das verschiebbare Bundle <projekt>/.claude-state/.
#
# Direkt VOR jedem Umzug ausführen, solange der automatische Devcontainer-Mount
# noch nicht aktiv ist. Nach dem ersten Rebuild ist es ein No-Op.
#
#   bash scripts/snapshot-session.sh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${HOME}/.claude"
DEST="${PROJECT_ROOT}/.claude-state"

mkdir -p "$DEST/projects"

if [ -d "$SRC/projects" ]; then
  cp -a "$SRC/projects/." "$DEST/projects/"
  echo "Chats + Memory aktualisiert -> $DEST/projects"
fi

if [ -f "$SRC/.credentials.json" ]; then
  cp -a "$SRC/.credentials.json" "$DEST/credentials.json"
  chmod 600 "$DEST/credentials.json"
  echo "Login-Token aktualisiert -> $DEST/credentials.json"
fi

echo "Snapshot fertig. Projektordner kann jetzt verschoben werden (siehe MIGRATION.md)."
