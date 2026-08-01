# Unified Daily Mixed Tile Matrix

Replace the four Visual Style tabs with one universal look: every tile is a Color + Pattern + Shape composite, mixed deterministically from the local date.

## What changes for players

- The "Visual Style" tab bar disappears. There is no theme to pick.
- Every tile shows: a base color, a subtle pattern wash over it (~45% opacity), and a centered geometric shape.
- The picker swatches at the bottom show the exact same composite in miniature, so matching stays unambiguous.
- Each day the pattern/shape assigned to a given color rotates, so the board feels new even when colors repeat.
- No change to game rules, attempts, timing, scoring, sharing, or Practice Mode difficulty.

## Visual composition rules

- Base colors: the existing 9 chromatic colors (Red, Orange, Yellow, Teal, Purple, Lime, Pink, Blue, Brown). The 9 MTA line colors are retired along with the MTA theme.
- Patterns: the existing 9 pattern defs (stripes, diagonal, crosshatch, dots, checkerboard, concentric, zigzag, solid).
- Shapes: the existing 9 react-icons glyphs (heart, star, cat, tree, moon, fish, droplet, bolt, leaf).
- Uniqueness: for a given day, color -> pattern and color -> shape are two independent seeded permutations of 0..8. Because each tile on a board already carries a distinct color, no two tiles on a board can share a color, pattern, or shape.
- Contrast: shape glyph and pattern stroke pick black or white based on the base color's luminance (reusing the existing dark-color list, extended to a luminance check) so both stay legible.

## Technical notes

- `src/lib/dailyMix.ts` (new): `getDailyMix(dateKey)` returns `{ patternForHex, shapeForHex }` built from a seeded shuffle using the same daily-seed helper `game.ts` already uses. Pure, memoized per date key. Practice Mode calls it with today's key so its tiles look consistent with the daily.
- `src/components/MixedTile.tsx` (new): renders base fill + `PatternOverlay` + `ShapeOverlay` for a hex. Used by `GameGrid`, the picker swatches, `DailySummary` mini-grids, and `SessionReport`.
- `PatternOverlay` / `PatternDefs`: pattern id resolved via the daily mix map instead of the hex's fixed index; opacity lowered to ~0.45. `ShapeOverlay`: icon resolved via the daily mix map, color from luminance.
- `GameGrid.tsx`: drop the `a11y` / `shapes` / `mta` branches and the `getDisplayBackground` special-casing; every filled tile renders `MixedTile`. Empty slots, borders, glow, flip, and all `tileFx` animations stay exactly as they are.
- `src/pages/Index.tsx`: remove the `VisualThemeToggle` render and import, the `visualTheme` reads, the `prevThemeRef` palette re-projection effect, and MTA/patterns/shapes conditionals in copy; `getColorsForTheme(...)` calls become `CHROMATIC_COLORS`.
- `DailySummary.tsx` / `SessionReport.tsx`: same conditional removal, mini tiles switch to `MixedTile`.
- Delete `VisualThemeToggle.tsx`, `MtaOverlay.tsx`, `MtaPaletteContext.tsx`; strip `MTA_COLORS` and `getColorsForTheme` from `game.ts`.
- `useAccessibility.tsx`: `AccessibilityProvider` and the theme context are removed; the stored `chromatic-visual-theme` key is ignored. Analytics events `visual_theme_changed` / `visual_style_first_set` and the `visual_style` PostHog super-property are dropped.
- MTA-specific copy variants in `getStageResultMessage` and the header salutations collapse to the standard strings.
- Saved rounds keep their `visualTheme` field for back-compat but it is no longer read.
