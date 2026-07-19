Revert the "Colors" visual style to the original chromatic palette while keeping the MTA theme intact.

### What we will change

1. **Split the global palette in `src/lib/game.ts`**
   - Introduce `CHROMATIC_COLORS` (the original 7-color palette):
     - Red `#EF4444`, Orange `#FD9349`, Yellow `#FDE047`, Teal `#2DD4D4`, Purple `#8B5CF6`, Lime `#7AC00F`, Pink `#EC4899`.
   - Rename the current MTA array to `MTA_COLORS` (9 subway-line colors).
   - Export both palettes and a helper `getColorsForTheme(theme)`.
   - Update `generateStageSolution` and `generateFreePlayPuzzle` to accept a palette so the daily puzzle is generated from the theme's own colors.
   - Keep `COLORS` as a backwards-compat alias pointing to `CHROMATIC_COLORS` so existing share/history code that stores hex values still works for non-MTA games.

2. **Make the active game palette theme-aware in `src/pages/Index.tsx`**
   - Replace `const pickerColors = COLORS` with a theme-driven selector (`CHROMATIC_COLORS` for colors/patterns/shapes, `MTA_COLORS` for MTA).
   - Pass the selected palette into `generateStageSolution` on game start, reset, and `nextAttempt`.
   - Pass the selected palette into `generateFreePlayPuzzle`.
   - Wrap the picker in `MtaPaletteProvider` only when the active theme is MTA.

3. **Update visual overlays to support both palettes**
   - `src/components/PatternDefs.tsx`: restore the 7 chromatic pattern mappings and add a second pattern set for the 9 MTA colors; expose `getPatternIdForTheme(colorHex, theme)`.
   - `src/components/ShapeOverlay.tsx`: restore the 7 chromatic shape mappings and add mappings for the 9 MTA colors.
   - `src/components/MtaOverlay.tsx`: keep the MTA letter-to-hex mapping but source from `MTA_COLORS` instead of relying on the global `COLORS` order.
   - `src/components/MtaPaletteContext.tsx`: source default hexes from `MTA_COLORS`.

4. **Verify grid rendering**
   - `src/components/GameGrid.tsx` already uses the active hex value for fills and the correct overlay by theme, so no logic change is needed beyond confirming the new hexes flow through.

5. **Update project memory**
   - Refresh `mem://style/color-palette` to list the restored chromatic 7-color palette and note that MTA has its own separate 9-color brand palette.

### What stays the same
- The 3-attempt adaptive progression, 2x3 grid, daily seeding, and local-storage history format.
- MTA theme: subway bullets, 9 options, red/yellow celebration.
- Result copy, salutations, and footer disclaimer.

### Files to edit
- `src/lib/game.ts`
- `src/lib/freeplay.ts`
- `src/pages/Index.tsx`
- `src/components/PatternDefs.tsx`
- `src/components/ShapeOverlay.tsx`
- `src/components/MtaOverlay.tsx`
- `src/components/MtaPaletteContext.tsx`
- `mem://style/color-palette`