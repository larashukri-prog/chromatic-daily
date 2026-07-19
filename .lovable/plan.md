## Problem

The daily puzzle looks different across visual themes. Attempt 1 in Colors/Patterns/Shapes shows tiles in one arrangement, but MTA shows them in another. Two root causes in `src/lib/game.ts` → `generateStageSolution`:

1. When the theme is MTA, `Index.tsx` passes `MTA_COLORS` as the palette; when it's Colors/Patterns/Shapes it passes `CHROMATIC_COLORS`. The generator shuffles that palette with the seeded RNG (`[...palette].sort(() => rand() - 0.5)`), so a different input array produces a different shuffle order and different chosen colors.
2. `getNonAdjacentPositions` uses each chosen color's `hue` to avoid placing neighbors. Chromatic vs MTA have different hues, so even with the same RNG stream the chosen positions diverge.

Net effect: no 1:1 correspondence between a Colors tile and its MTA/Pattern/Shape counterpart — position and identity can both differ.

## Fix

Make daily puzzle generation palette-independent, then project the result onto the active theme's palette by index. Because both palettes have 9 entries, index 0 (chromatic Red) always maps to index 0 (MTA "1" line), index 1 (Orange) to "5", etc. Patterns and shapes are already keyed off the chromatic hex, so they remain in sync automatically.

### Changes

**`src/lib/game.ts`**
- Refactor `generateStageSolution(stage, regenIndex, palette)` so the internal shuffle + non-adjacency placement always runs against the canonical `CHROMATIC_COLORS` array (fixed order, fixed hues). This guarantees identical positions and identical color slot indices across every theme and every user.
- After computing the canonical `chosen` (chromatic ColorDefs) and their positions, translate each entry to the requested `palette` by its index in `CHROMATIC_COLORS`. If `palette === CHROMATIC_COLORS`, the output is unchanged.
- Return `solution` and `activeColors` using the translated palette so existing consumers (grid rendering, picker highlight, MTA overlay, share text) keep working with the hexes they expect.
- Apply the same canonical-generation approach in `generateFallbackSolution` so fallback paths stay consistent too.

**No changes required in:**
- `Index.tsx` — it already passes `getColorsForTheme(visualTheme)` and regenerates on theme change; the mapping now happens inside the generator.
- `PatternDefs.tsx` / `ShapeOverlay.tsx` / `MtaOverlay.tsx` — these already map hex → visual element via a fixed index table, so once positions align the visuals align.
- Persistence — solutions are still stored as hexes; theme is already recorded per attempt.

### Verification

1. Load `/play`, note the Attempt 1 tile arrangement in Colors.
2. Switch visual theme to Patterns, Shapes, then MTA — the same slots should be filled with the same positional 1:1 mapping (slot A always the "red" line across themes, etc.).
3. Advance a stage and repeat for Attempt 2 / 3, including a loss path (`stage1b`, `stage2r`) to confirm the fresh puzzles also line up across themes.
4. Confirm the free-play flow is untouched (still uses its own generator).

### Out of scope

- No changes to progression, scoring, sharing text, persistence, or the picker pool.
- Free-play puzzles are not part of this fix (user reported the daily only).
