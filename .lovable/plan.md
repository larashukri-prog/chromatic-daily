## Recenter MTA bullet characters

The current `MtaOverlay` renders both the circle and the letter as SVG. `dominantBaseline="central"` is inconsistent across browsers (especially Safari/WebKit), and the recent `y="52"` nudge made the drift worse — characters sit slightly low/off-axis inside the circle.

### Fix (single file: `src/components/MtaOverlay.tsx`)

Split the bullet into two layers so centering is bulletproof and matches real MTA signage:

1. **Circle stays SVG** — full-bleed `<circle cx="50" cy="50" r="50" fill={hex}>` inside a `viewBox="0 0 100 100"` SVG that fills the parent span. This keeps the crisp round edge.
2. **Character becomes an HTML layer** — an absolutely-positioned `<span>` overlaid on the SVG, using flexbox (`inset-0 flex items-center justify-center`) so the glyph is centered by the browser's text-layout engine (no baseline math). Font stack stays Helvetica Neue / Helvetica / Arial, `font-weight: 800`, with `line-height: 1` and `letter-spacing: -0.02em`.
3. **Size the glyph off the container** — use `font-size: 62%` of the tile (via `text-[0.62em]` or inline `fontSize: '62%'`) so the character fills roughly 2× x-height without clipping wide letters (`A`, `F`, `L`, `Z`, `G`) or single digits. This scales automatically with the slot.
4. **Keep the per-line text color map** — `Q` (yellow) → black, all others → white.
5. Remove the previous `y="52"` and SVG `<text>` node entirely, so no baseline drift remains.

### Verification

Reload `/play` in MTA theme:
- Picker row: every character (`1 5 A F Q L Z G 7`) sits dead-center in its circle, both horizontally and vertically.
- Guess slots and result rows show the same centering.
- `Q` bullet still black-on-yellow; all others white.

### Out of scope

No changes to palette, layout, sizing of the tiles themselves, or non-MTA themes.