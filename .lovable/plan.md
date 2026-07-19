## Problem

The theme-swap effect in `src/pages/Index.tsx` (lines 250–311) runs on every `visualTheme` change but only handles **daily mode**. When a user is in Practice Mode and toggles between Colors / Patterns / Shapes / MTA, that effect unconditionally overwrites `solution` and `activeColors` with a fresh **daily stage** puzzle — clobbering the practice round, resetting progress, and desyncing the picker vs. the grid.

A second, smaller issue: `freeplayNext` (line 759) reads `visualTheme` but omits it from its dependency array, so the next practice round can be generated with a stale palette after a theme change.

## Fix

Keep daily behavior untouched. Add a freeplay branch to the theme-swap effect that **re-projects the current practice puzzle onto the new palette** using the canonical index it already sits at.

1. Add a `prevThemeRef = useRef<VisualTheme>(visualTheme)` so we know the palette we're projecting *from*.
2. In the `visualTheme` effect, before the existing daily logic, short-circuit when `mode === 'freeplay'`:
   - Compute `oldPalette = getColorsForTheme(prevThemeRef.current)` and `newPalette = getColorsForTheme(visualTheme)`.
   - For each non-null hex in `solution`, look up its index in `oldPalette` and swap in `newPalette[idx].hex`. Same for `activeColors` and `selectedColor`. If any hex isn't found in `oldPalette` (edge case, e.g. after `?reset`), leave it alone.
   - Update `prevThemeRef.current = visualTheme` and `return` (skip the daily reset path entirely).
   - Also update `prevThemeRef.current` at the end of the daily branch so subsequent freeplay swaps have a correct baseline.
3. Add `visualTheme` to `freeplayNext`'s dependency array.

Result: switching visual style mid-practice keeps the same puzzle, same round number, same session stats, just repainted in the new palette — matching how daily mode already behaves.

## Files touched

- `src/pages/Index.tsx` — modify the `useEffect` at lines 250–311 and the `freeplayNext` `useCallback` deps.

No changes to `src/lib/freeplay.ts`, `src/lib/game.ts`, or any overlay components.