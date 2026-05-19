# Marken-Logos

Hier legst du die offiziellen Hersteller-Logos ab. Die `BrandLogo`-Komponente
sucht für jeden Hersteller automatisch nach einer passenden Datei und fällt
auf ein farbiges Wordmark zurück, wenn keine vorhanden ist.

## Dateinamen-Schema

Slug = Hersteller-Name in Kleinschrift, Umlaute aufgelöst, Sonderzeichen → `-`:

| Hersteller           | Dateiname                                          |
|----------------------|----------------------------------------------------|
| Castrol              | `castrol.svg` (oder `.png`)                        |
| Shell                | `shell.svg`                                        |
| Fuchs                | `fuchs.svg`                                        |
| Mobil / ExxonMobil   | `mobil.svg`                                        |
| Klüber               | `klueber.svg`                                      |
| Total / TotalEnergies| `total.svg`                                        |
| BP                   | `bp.svg`                                           |
| Esso                 | `esso.svg`                                         |
| Aral                 | `aral.svg`                                         |
| Panolin / Laemmle    | `laemmle-panolin.svg` und/oder `panolin.svg`       |
| Addinol              | `addinol.svg`                                      |
| Blaser               | `blaser.svg`                                       |
| Valvoline            | `valvoline.svg`                                    |
| Motul                | `motul.svg`                                        |
| Chevron              | `chevron.svg`                                      |
| Houghton / Quaker    | `houghton.svg`                                     |
| Oemeta               | `oemeta.svg`                                       |

SVG wird gegenüber PNG bevorzugt (skaliert sauber auf jeder Größe).
Empfohlene Höhe: 64–200 px. Transparenter Hintergrund.

## Woher bekommst du die Logos?

Als Reseller hast du in der Regel mehrere legitime Quellen:

1. **Pressekit / Brand Resource Page** des Herstellers (öffentlich, mit
   Nutzungs-Richtlinien). Beispiele:
   - Castrol Brand Center
   - Shell Press / Media Centre
   - FUCHS Pressekit
   - Klüber Lubrication Pressekit
2. **Händler-Portal** deines Lieferanten — typischerweise gibt es dort einen
   "Marketing Materials" oder "Logos"-Bereich.
3. **Direkter Kontakt** mit dem Marketing-Team des Herstellers — bei einer
   B2B-Marketplace-Nutzung wird das in der Regel ohne weiteres freigegeben.

**Bitte respektiere die Nutzungs-Richtlinien** (z. B. Mindest-Schutzraum um
das Logo, keine Farbänderung, keine Verzerrung). Die Richtlinien stehen in
den oben genannten Brand Resource Pages.

## Was passiert wenn keine Datei da ist?

Die `BrandLogo`-Komponente versucht erst `.svg`, dann `.png`. Schlägt beides
fehl, wird das farbige Wordmark in der Marken-Farbe gerendert (mit einem
Tooltip-Hinweis, dass ein offizielles Logo fehlt). Die App bricht *nicht* —
du kannst Logos nach und nach nachreichen.
