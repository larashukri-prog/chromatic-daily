# Plan: propagate 2×3 grid to all remaining surfaces

Switch every remaining 3-column rendering of the 6-slot board to 2 columns × 3 rows so the layout is consistent everywhere — including the "Not Quite" try-again card, the Daily Summary carousel, the Unplayed stage placeholder, and the emoji grid in shared results.

## Changes

1. **`src/pages/Index.tsx` — "Correct Pattern" preview in result card**
   - `grid-cols-3 max-w-[120px]` → `grid-cols-2` with narrower max width (~`max-w-[90px]`) so tiles stay small.
   - Update the inline emoji grid above it (currently `[0, 3].map` slicing rows of 3) to render 3 rows of 2: iterate `[0, 2, 4]` and slice 2 cells each, so the share-preview emoji block matches the new shape.

2. **`src/components/DailySummary.tsx`**
   - Played-stage grid (line 275): `grid-cols-3` → `grid-cols-2`, keep `max-w-[200px]` (or narrow slightly) so tiles aren't oversized.
   - Unplayed-stage grid (line 385): same change.
   - Update the `{/* 3x2 grid */}` comment to `{/* 2x3 grid */}`.

3. **`src/lib/game.ts` — `generateShareText` emoji block**
   - Currently emits two rows of 3 emojis (`cells.slice(0,3)` + `cells.slice(3,6)`) per stage, and the unplayed fallback uses `⚪⚪⚪` twice.
   - Change to three rows of 2 emojis: `slice(0,2)`, `slice(2,4)`, `slice(4,6)`; unplayed fallback becomes three `⚪⚪` lines.
   - Update the "3x2 grid" comments in this file to "2x3 grid" for accuracy.

4. **`src/lib/freeplay.ts`**
   - Update the "3x2 grid" comment to "2x3 grid".

## Out of scope
- No changes to game logic, color counts, adjacency rules, stage progression, scoring, or sharing copy beyond the emoji layout itself.
- No visual restyle of the result card or summary beyond the column-count flip and width tweak.