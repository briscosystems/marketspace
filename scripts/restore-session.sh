#!/bin/bash
# restore-session.sh — Stellt Claude-Chats, Memory und Login aus dem
# mitgewanderten Bundle (.claude-state/) ins Container-Home zurück.
#
# WANN BRAUCHST DU DAS?
#   - Normalfall (Devcontainer): GAR NICHT. devcontainer.json mountet
#     .claude-state/projects und .claude-state/credentials.json automatisch
#     ins Home. Nach dem Verschieben + Container-Rebuild ist alles sofort da.
#   - Fallback: Wenn du Claude ausserhalb des Devcontainers nutzt, oder
#     der Mount (noch) nicht greift, kopiert dieses Skript den State manuell
#     ins Home-Verzeichnis.
#
# Aufruf:  bash scripts/restore-session.sh
set -e

SRC="/workspace/.claude-state"
DEST="${HOME}/.claude"

if [ ! -d "$SRC" ]; then
  echo "FEHLER: $SRC nicht gefunden. Liegt der Ordner an der richtigen Stelle?"
  exit 1
fi

echo "Restore Claude-Session-State -> $DEST"
mkdir -p "$DEST/projects"

# Wenn der Live-Mount aktiv ist, ist das Bundle bereits das Home-Verzeichnis
# (gleiche Inode). Dann wäre ein cp ein Kopieren auf sich selbst — überspringen.
SRC_INODE=$(stat -c '%i' "$SRC/projects" 2>/dev/null || echo "s")
DEST_INODE=$(stat -c '%i' "$DEST/projects" 2>/dev/null || echo "d")
if [ "$SRC_INODE" = "$DEST_INODE" ]; then
  echo "  Live-Mount aktiv — Home zeigt bereits auf das Bundle. Nichts zu tun."
  exit 0
fi

# Chats + Memory
cp -a "$SRC/projects/." "$DEST/projects/"
echo "  Chats + Memory wiederhergestellt."

# Login-Token (nur wenn vorhanden — kann bewusst weggelassen worden sein)
if [ -f "$SRC/credentials.json" ]; then
  cp -a "$SRC/credentials.json" "$DEST/.credentials.json"
  chmod 600 "$DEST/.credentials.json"
  echo "  Login-Token wiederhergestellt."
else
  echo "  Kein Token im Bundle — bei Bedarf einmalig 'claude login' ausfuehren."
fi

echo "Fertig. Claude findet die alten Sessions unter ~/.claude/projects/-workspace/."
