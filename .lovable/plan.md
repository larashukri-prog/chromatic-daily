## Goal

Make every surface that renders chromatic tiles respect Go Knicks — currently only the main `GameGrid` does. The color picker and the result-modal "Correct Pattern" mini-grid (both in `Index.tsx`), plus the `DailySummary` carousel tiles, all still render as raw color swatches.

## Changes

All edits gated by `visualTheme === 'knicks'`. No game logic, no layout changes.

### 1. `src/pages/Index.tsx` — color picker (lines ~1138-1186)
- Pull `knicks = visualTheme === 'knicks'` once near `shapesMode`.
- Compute `bg` so chromatic picker swatches in knicks mode use white backdrop, Black anchor renders `#1D428A`, White anchor renders `#F58426`.
- Treat anchors as solid (no overlay); chromatic swatches get `<KnicksOverlay colorHex={c.hex} />` overlaying the white circle, same as `GameGrid`.
- Reuse the existing `showAsWhite`/border rules so light-fill swatches keep the gray border + black selection outline. Selected-outline color for the orange/blue Knicks anchors uses the existing primary outline since they're dark.

### 2. `src/pages/Index.tsx` — result-modal "Correct Pattern" mini-grid (lines ~1432-1452)
- Mirror the picker logic: knicks anchors → `#1D428A` / `#F58426`, chromatic slots → white bg + `<KnicksOverlay />`, with the same border rule for light fills.

### 3. `src/components/DailySummary.tsx` — carousel tiles (lines ~275-330)
- Add `knicks` branch alongside the existing `shapesMode` branch for both the solution grid and the player grid.
- Same rules: anchors → solid blue/orange, chromatic → white backdrop + `<KnicksOverlay />`, light-fill border.

### 4. Import `KnicksOverlay` in both files
- `Index.tsx` and `DailySummary.tsx` — add the import next to `ShapeOverlay`.

## Out of scope

- COLORS, round logic, scoring, DDA, share text, analytics — all untouched.
- No new images (reuses the 7 CDN assets already wired in `KnicksOverlay`).
- Other themes (colors / patterns / shapes) keep current rendering exactly.

## Verification

- Toggle Go Knicks → picker swatches show the same Knicks images as the board; Black/White anchors (Sunday/Practice) render as solid blue/orange chips.
- After a round, the result modal's "Correct Pattern" mini-grid and the daily summary carousel both render Knicks-themed tiles.
- Toggle back to Colors/Patterns/Shapes → identical to today.
