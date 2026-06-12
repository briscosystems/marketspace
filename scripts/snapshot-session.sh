#!/bin/bash
# snapshot-session.sh — Spiegelt die AKTUELLEN Claude-Chats, Memory und den
# Login aus dem Container-Home in das verschiebbare Bundle (.claude-state/).
#
# WANN?
#   Nur solange der automatische Devcontainer-Mount NOCH NICHT aktiv ist
#   (also vor dem ersten Rebuild nach Einrichtung der .claude-state-Mounts).
#   Danach ist .claude-state ohnehin die Live-Quelle und dieses Skript erkennt
#   das selbst und macht nichts (No-Op) — gefahrlos, auch wenn man es aus
#   Versehen aufruft.
#
# Aufruf:  bash scripts/snapshot-session.sh
set -e

SRC="${HOME}/.claude"
DEST="/workspace/.claude-state"

mkdir -p "$DEST/projects"

# Wenn der Live-Mount aktiv ist, zeigen SRC/projects und DEST/projects auf
# dasselbe Verzeichnis (gleiche Inode). Dann wäre ein cp ein Kopieren auf sich
# selbst — überspringen.
SRC_INODE=$(stat -c '%i' "$SRC/projects" 2>/dev/null || echo "s")
DEST_INODE=$(stat -c '%i' "$DEST/projects" 2>/dev/null || echo "d")
if [ "$SRC_INODE" = "$DEST_INODE" ]; then
  echo "Live-Mount aktiv — .claude-state ist bereits die Live-Quelle. Nichts zu tun."
  exit 0
fi

cp -a "$SRC/projects/." "$DEST/projects/"
echo "Chats + Memory aktualisiert -> $DEST/projects"

if [ -f "$SRC/.credentials.json" ]; then
  cp -a "$SRC/.credentials.json" "$DEST/credentials.json"
  chmod 600 "$DEST/credentials.json"
  echo "Login-Token aktualisiert -> $DEST/credentials.json"
fi

echo "Snapshot fertig. Workspace-Ordner kann jetzt verschoben werden (siehe MIGRATION.md)."
