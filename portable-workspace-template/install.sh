#!/bin/bash
# install.sh  (portable-workspace-template)
# ---------------------------------------------------------------------------
# Macht EIN beliebiges Projekt vollständig portabel: Claude-Chats, Memory und
# Login wandern künftig IM Projektordner mit, der Ordner lässt sich verlustfrei
# verschieben. Optional wird auch ein DB-Datenverzeichnis (z. B. Postgres) in
# den Ordner gebunden.
#
# AUFRUF (im Zielprojekt-Root, oder Pfad als Argument):
#   bash install.sh [PROJEKT-ROOT] [--pg-data <relpath>] [--no-copy]
#
#   PROJEKT-ROOT     Zielprojekt (Default: aktuelles Verzeichnis)
#   --pg-data <p>    relativer Pfad zum DB-Datenverzeichnis im Projekt, das in
#                    /var/lib/postgresql/data gemountet werden soll
#                    (z. B. .postgres-data). Ohne Angabe: DB-Mount überspringen.
#   --no-copy        .claude-state NICHT mit aktuellem Home befüllen (nur
#                    Struktur + Mounts + Skripte einrichten).
#
# Was passiert:
#   1. <projekt>/.claude-state/ anlegen und (sofern nicht --no-copy) mit den
#      aktuellen ~/.claude/projects + ~/.claude/.credentials.json befüllen.
#   2. snapshot-session.sh + restore-session.sh nach <projekt>/scripts/ kopieren.
#   3. .gitignore um /.claude-state/ (und ggf. das DB-Verzeichnis) ergänzen.
#   4. .devcontainer/devcontainer.json um die Bind-Mounts erweitern
#      (oder, falls nicht parsebar/nicht vorhanden, den Snippet ausgeben).
#   5. MIGRATION.md ins Projekt schreiben.
# ---------------------------------------------------------------------------
set -e

TEMPLATE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT=""
PG_DATA=""
DO_COPY=1

while [ $# -gt 0 ]; do
  case "$1" in
    --pg-data) PG_DATA="$2"; shift 2 ;;
    --no-copy) DO_COPY=0; shift ;;
    -*) echo "Unbekannte Option: $1" >&2; exit 1 ;;
    *) PROJECT_ROOT="$1"; shift ;;
  esac
done
[ -z "$PROJECT_ROOT" ] && PROJECT_ROOT="$(pwd)"
PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"

echo "==> Portabilität einrichten für: $PROJECT_ROOT"

# Home des Container-Users für die Mount-Ziele bestimmen
REMOTE_USER="$(id -un)"
if [ "$REMOTE_USER" = "root" ]; then REMOTE_HOME="/root"; else REMOTE_HOME="/home/$REMOTE_USER"; fi

# ---------------------------------------------------------------------------
# 1. .claude-state anlegen + befüllen
# ---------------------------------------------------------------------------
STATE="$PROJECT_ROOT/.claude-state"
mkdir -p "$STATE/projects"
if [ "$DO_COPY" = "1" ]; then
  if [ -d "$HOME/.claude/projects" ]; then
    cp -a "$HOME/.claude/projects/." "$STATE/projects/"
    echo "    Chats + Memory kopiert -> .claude-state/projects"
  fi
  if [ -f "$HOME/.claude/.credentials.json" ]; then
    cp -a "$HOME/.claude/.credentials.json" "$STATE/credentials.json"
    chmod 600 "$STATE/credentials.json"
    echo "    Login-Token kopiert -> .claude-state/credentials.json"
  fi
else
  echo "    --no-copy: .claude-state bleibt leer (nur Struktur)"
fi

# ---------------------------------------------------------------------------
# 2. Skripte ins Projekt kopieren
# ---------------------------------------------------------------------------
mkdir -p "$PROJECT_ROOT/scripts"
cp "$TEMPLATE_DIR/scripts/snapshot-session.sh" "$PROJECT_ROOT/scripts/"
cp "$TEMPLATE_DIR/scripts/restore-session.sh" "$PROJECT_ROOT/scripts/"
chmod +x "$PROJECT_ROOT/scripts/snapshot-session.sh" "$PROJECT_ROOT/scripts/restore-session.sh"
echo "    Skripte -> scripts/{snapshot,restore}-session.sh"

# ---------------------------------------------------------------------------
# 3. .gitignore ergänzen (idempotent)
# ---------------------------------------------------------------------------
GI="$PROJECT_ROOT/.gitignore"
touch "$GI"
add_ignore() {
  local pat="$1"; local comment="$2"
  if ! grep -qxF "$pat" "$GI"; then
    { [ -n "$comment" ] && echo "" && echo "$comment"; echo "$pat"; } >> "$GI"
    echo "    .gitignore += $pat"
  fi
}
add_ignore "/.claude-state/" "# Claude-Session-State (Chats, Memory, OAuth-Token) — nie nach Git!"
if [ -n "$PG_DATA" ]; then
  add_ignore "/${PG_DATA#./}/" "# Persistente DB-Daten (Bind-Mount) — gross/binär/vertraulich"
fi

# ---------------------------------------------------------------------------
# 4. devcontainer.json um Mounts erweitern
# ---------------------------------------------------------------------------
DC="$PROJECT_ROOT/.devcontainer/devcontainer.json"
CLAUDE_PROJ_MOUNT="source=\${localWorkspaceFolder}/.claude-state/projects,target=$REMOTE_HOME/.claude/projects,type=bind,consistency=cached"
CLAUDE_CRED_MOUNT="source=\${localWorkspaceFolder}/.claude-state/credentials.json,target=$REMOTE_HOME/.claude/.credentials.json,type=bind,consistency=cached"
PG_MOUNT=""
[ -n "$PG_DATA" ] && PG_MOUNT="source=\${localWorkspaceFolder}/${PG_DATA#./},target=/var/lib/postgresql/data,type=bind,consistency=cached"

print_snippet() {
  echo ""
  echo "    >>> Bitte diese Einträge manuell in die \"mounts\":[ ... ] in"
  echo "    >>> $DC aufnehmen:"
  echo ""
  echo "      \"$CLAUDE_PROJ_MOUNT\","
  echo "      \"$CLAUDE_CRED_MOUNT\"${PG_MOUNT:+,}"
  [ -n "$PG_MOUNT" ] && echo "      \"$PG_MOUNT\""
  echo ""
}

if [ -f "$DC" ]; then
  # Versuch: sauberes JSON-Patchen via node. Schlägt fehl bei JSONC (Kommentaren).
  if command -v node >/dev/null 2>&1 && \
     node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$DC" >/dev/null 2>&1; then
    node - "$DC" "$CLAUDE_PROJ_MOUNT" "$CLAUDE_CRED_MOUNT" "$PG_MOUNT" <<'NODE'
const fs = require('fs');
const [file, m1, m2, m3] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
cfg.mounts = cfg.mounts || [];
const want = [m1, m2, ...(m3 ? [m3] : [])];
for (const m of want) if (!cfg.mounts.includes(m)) cfg.mounts.push(m);
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log('    devcontainer.json gepatcht (' + cfg.mounts.length + ' mounts)');
NODE
  else
    echo "    devcontainer.json ist nicht als reines JSON parsebar (JSONC/Kommentare)."
    print_snippet
  fi
else
  echo "    Keine .devcontainer/devcontainer.json gefunden."
  print_snippet
fi

# ---------------------------------------------------------------------------
# 5. MIGRATION.md schreiben
# ---------------------------------------------------------------------------
if [ -f "$TEMPLATE_DIR/MIGRATION.template.md" ]; then
  cp "$TEMPLATE_DIR/MIGRATION.template.md" "$PROJECT_ROOT/MIGRATION.md"
  echo "    MIGRATION.md geschrieben"
fi

echo ""
echo "==> Fertig. Nächste Schritte:"
echo "    1. Container neu bauen (Rebuild) — danach landet Claude-State automatisch im Ordner."
echo "    2. Vor einem Umzug:  bash scripts/snapshot-session.sh"
echo "    3. Details in MIGRATION.md."
echo ""
echo "    WICHTIG: .claude-state/ enthält deinen Login-Token. Ordner nicht teilen/committen."
