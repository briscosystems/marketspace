#!/usr/bin/env bash
# Erzeugt marketing/Brisco-Messe-Flyer.pdf (DIN A5, Vorder-/Rueckseite) aus
# marketing/messe-flyer.html. Inhalt aendern: die HTML-Datei bearbeiten und
# dieses Skript erneut ausfuehren. Gleiche Technik wie testkunden-pdf.sh.
set -e
cd "$(dirname "$0")/.."
chromium --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/marketing/Brisco-Messe-Flyer.pdf" \
  "file://$PWD/marketing/messe-flyer.html" 2>/dev/null
ls -la marketing/Brisco-Messe-Flyer.pdf
