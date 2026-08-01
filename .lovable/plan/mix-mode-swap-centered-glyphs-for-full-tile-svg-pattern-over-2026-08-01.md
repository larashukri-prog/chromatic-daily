# MIX mode: swap centered glyphs for full-tile SVG pattern overlays

Replace the single centered shape in MIX visual style with a repeating background pattern that fills each tile, at low opacity, in a contrasting stroke color.

## What changes

`src/components/MixOverlay.tsx` is rewritten internally. Its props (`colorHex`, `className`) and all four call sites (game grid, picker, practice grid, daily summary) stay exactly the same — no other file needs edits except updating the exported name list.

### Pattern per palette index (0–8)
1. Polka Dots
2. Diagonal Stripes (45 degrees)
3. Square Grid / Crosshatch
4. Concentric Waves / Ripples
5. Vertical Pinstripes
6. Diamond Lattice
7. Checkerboard Mesh
8. Horizontal Dashes
9. Starburst / Radial Lines

Index mapping keeps today's logic: match the hex against the daily OKLCH palette; fall back to a stable hash for colors saved on previous days.

### Rendering rules
- Overlay fills the whole tile (`absolute inset-0`), not a centered glyph.
- Stroke color contrast is unchanged in principle: black/slate on light tiles, white on dark tiles, using the existing `hexLightness >= 0.6` threshold.
- Opacity 0.18 on the pattern group (inside the 15–20% band requested).
- Patterns 1–8 use SVG `<pattern>` tiles so density stays constant at any tile size; the starburst is drawn as radial lines from the tile center.
- Each pattern gets a unique `<pattern>` id per instance so multiple tiles on screen don't collide.

## Technical notes

- Keep `preserveAspectRatio` behavior consistent with square tiles; the overlay uses a `0 0 96 96` viewBox with `xMidYMid slice` so pattern cells aren't stretched.
- Rename the export `MIX_SHAPE_NAMES` to `MIX_PATTERN_NAMES` with the nine names above, and update any import (currently unused outside the file, so this is contained).
- Stroke widths tuned per pattern (roughly 2–3 in viewBox units) so density reads well at both grid-tile and picker-swatch sizes.
- No change to palette generation, puzzle logic, scoring, storage, or sharing.

## Verification

Screenshot the game grid and picker in MIX mode against a light and a dark daily palette to confirm all nine patterns are visually distinct and legible at both sizes.
