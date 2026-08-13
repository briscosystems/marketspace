#!/usr/bin/env bash
# Erzeugt marketing/Brisco-Testkunden-Information.pdf aus der HTML-Vorlage.
#
# Warum HTML + Chromium und nicht pdf-lib: Die Vorlage nutzt dieselbe
# Gestaltung wie das Fact Sheet (Logo, Farben, Karten). Chromium liegt im
# Container bereits vor; damit bleibt Typografie und Layout wie im Browser.
#
# Inhalt aendern: marketing/testkunden-info.html bearbeiten und dieses Skript
# erneut ausfuehren.
set -e
cd "$(dirname "$0")/.."
chromium --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/marketing/Brisco-Testkunden-Information.pdf" \
  "file://$PWD/marketing/testkunden-info.html" 2>/dev/null
ls -la marketing/Brisco-Testkunden-Information.pdf
