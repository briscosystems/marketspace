#!/bin/bash
# install-alias.sh — richtet den Kurzbefehl `init` ein, der
# `bash /workspace/scripts/start.sh` ausführt (DB + App + Session + Dev-Server).
#
# Idempotent. Wird vom postCreateCommand bei jedem Container-Aufbau aufgerufen,
# damit der Alias auch nach Rebuild/Umzug sofort wieder da ist.
#
# Aufruf:  bash scripts/install-alias.sh
set -e

ALIAS_LINE="alias init='bash /workspace/scripts/start.sh'"
MARKER="# marketplace-init-alias"

for RC in "$HOME/.bashrc" "$HOME/.profile"; do
  touch "$RC"
  if ! grep -qF "$MARKER" "$RC" 2>/dev/null; then
    printf '\n%s\n%s\n' "$MARKER" "$ALIAS_LINE" >> "$RC"
    echo "  Alias 'init' eingetragen in $RC"
  else
    echo "  Alias 'init' bereits vorhanden in $RC"
  fi
done

echo "Fertig. Neuer Terminal → einfach 'init' tippen (oder jetzt: source ~/.bashrc)."
