## Goal

Render the Knicks anchors as the two uploaded PNGs (orange circle for White anchor, blue circle for Black anchor) on every surface, instead of solid color fills. They'll fit the circle exactly like the other 7 Knicks images.

## Changes

1. **Upload assets** — push `Ellipse_6.png` (orange) and `Ellipse_7.png` (blue) to Lovable Assets under `src/assets/knicks/`.

2. **`src/components/KnicksOverlay.tsx`** — extend `KNICKS_IMAGE_FOR_HEX` with anchor entries:
   - `'#000000'` → blue PNG
   - `'#FFFFFF'` → orange PNG
   
   Overlay component already handles any hex, no logic change needed.

3. **All knicks-mode renderers** — drop the `!isBlack && !isWhite` guard so anchors also get a `<KnicksOverlay />`. Switch the anchor background from solid `#1D428A`/`#F58426` to white (consistent backdrop behind the PNG, like other chromatic slots). The light-fill border treatment now applies to anchors too so they get the same subtle gray ring.
   
   Files: `src/components/GameGrid.tsx`, `src/pages/Index.tsx` (picker + result mini-grid), `src/components/DailySummary.tsx` (solution + player grids).

## Out of scope

- Confetti palette stays `#1D428A` / `#F58426`.
- No game logic, color array, scoring, or other theme changes.

## Verification

Toggle Go Knicks → on Sunday/Practice the Black/White anchor slots now show the uploaded orange and blue PNGs and visually match the rest of the Knicks tiles. Other themes unchanged.
