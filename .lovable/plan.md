## Polish MTA bullets to match authentic subway signage

Single file: `src/components/MtaOverlay.tsx`. The component is already used everywhere MTA tiles render (guess slots, historical rows, picker), so styling changes propagate automatically.

### Changes

1. **Text contrast per line** — introduce a per-hex text-color map. All lines use `#FFFFFF`; the `Q` bullet (`#F6BC26`, yellow) uses `#000000`. Use that map for the SVG `text fill` instead of the hard-coded white.
2. **Typography tuning** — keep the Helvetica/Arial stack and `font-weight: 800`, but bump `fontSize` from `62` to `72` so the character fills roughly 2× x-height inside the 100-unit circle, matching official bullets. Keep `textAnchor="middle"` + `dominantBaseline="central"` for exact centering.
3. **Crisp round circle** — set `shape-rendering="geometricPrecision"` on the SVG and add a subtle 1-unit inner stroke matching the fill (or `stroke="none"`) so anti-aliasing looks clean at all sizes. Retain `r="50"` for full-bleed fills already used by the grid.
4. **Letter-spacing** — keep the slight negative tracking (`-0.02em`) for the wide letters (`A`, `F`, `L`, `Z`, `G`) and single digits so nothing clips the circle edge.

### Out of scope

- No changes to the palette, picker layout, or grid slot chrome.
- No changes to non-MTA themes.

### Verification

Reload `/play` in MTA theme and check:
- Picker row: 9 bullets are perfectly round, characters visually fill the circle.
- `Q` bullet renders black text on yellow; all other bullets render white text.
- Guess slots and historical/result rows show the same bullet styling.