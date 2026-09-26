# Portfolio v3

Third version of the portfolio: bento tiles, light and dark mode, one orange accent.
All images it needs are in `v3/img/`, so the folder also works on its own.

- The dark/light tile switches the theme; the choice is remembered. On a first visit
  the page follows the visitor's system setting.
- Text is in English in the HTML; the French version of each text is in its `data-fr` attribute.
- On GitHub Pages this version is served at `/v3/`.

Interactions:
- Project cards: on hover the thumbnail grows into the full card image; the orange
  badge on the thumbnail opens a larger preview (works on phones too).
- Theme switch grows as a circle out of the tile (browsers with View Transitions;
  others switch instantly).
- Everything respects the visitor's "reduce motion" setting.
