## Change scope

Rename the per-stage labels in the shared result and on-page Daily Summary carousel from "Stage X · N" / "Stage X of 3" to "Attempt X" / "Attempt X of 3", and remove the "3-Stage Daily" tagline from the shared text.

## Edits

**`src/lib/game.ts`** — `generateShareText`:
- Remove the `${dayName} | 3-Stage Daily` line; keep `Chromatic #N` plus the day name alone (e.g. `Sunday`).
- Replace `stageHeader` so every row is `Attempt ${i + 1}` (no tile-count suffix, no special-case for index 1).
- Update the unplayed fallback from `Stage ${i + 1} ⬜` to `Attempt ${i + 1} ⬜`.

**`src/components/DailySummary.tsx`** — `SlideContent` header:
- Change `Stage {slideIndex + 1} of {totalSlides}` to `Attempt {slideIndex + 1} of {totalSlides}`.
- Apply the same change to the `UnplayedSlide` header for consistency.

## Out of scope

- In-game stage messaging (`getStageResultMessage` copy still references "Stage 2/3" — those are gameplay nudges, not result labels).
- The "3-Stage Daily" explainer paragraph in the About modal (`src/pages/Index.tsx` ~line 1473) — that's marketing copy describing the format, not the share/summary label.
- Tile counts, emoji grid, metrics block, share buttons, layout.
