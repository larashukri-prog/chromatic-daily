## Goal
Expand the answer-picker pool from 6 to 7 distinct values across every visual motif (Colors, Patterns, Shapes, FIFA). The grid stays 2×3 (6 slots) and stage progression (3 → 5 → 6) is unchanged, so the stage-3 round now requires picking the correct 6 colors out of 7 — true recall, not elimination.

## Changes

### 1. `src/lib/game.ts` — add Pink to the palette
Append a 7th entry to **both** `COLORS` and `FALLBACK_PALETTE`:
```ts
{ name: 'Pink', hex: '#EC4899', hue: 330 },
```
No other logic changes needed:
- `generateStageSolution` already does `shuffled.slice(0, colorCount)` — a 7-color pool with `colorCount = 6` at stage 3 yields a random 6-of-7 daily selection (deterministic by date seed).
- `getNonAdjacentPositions` is keyed by `colorCount`, not pool size — still fine.
- `areHueNeighbors` already handles 330° via the wrap-around `Math.min(diff, 360 - diff)`.

### 2. `src/components/PatternDefs.tsx` — wire a 7th pattern
Add `'pattern-checkerboard'` (already defined in the `PatternSet` SVG) as the 7th entry of `PATTERN_IDS`, so the Pink hex resolves to the checkerboard motif via the existing `COLORS.findIndex` mapping.

### 3. `src/components/ShapeOverlay.tsx` — add the Pink shape
Import `FaDroplet` from `react-icons/fa6` (the icon previously paired with Pink) and add:
```ts
'#EC4899': FaDroplet, // Pink
```

### 4. `src/components/FifaOverlay.tsx` — add Colombia + extend flag slots
- Append `"https://flagcdn.com/w320/co.png"` to `currentDayFlags`.
- Append `'#EC4899'` to `FLAG_SLOT_HEXES` so the new chromatic slot can hold the new flag.

### 5. `src/components/FifaPaletteContext.tsx`
Append `'#EC4899'` to `DEFAULT_HEXES` so the picker context advertises all 7 slots when no `activeHexes` override is supplied.

### 6. Picker layout (`src/pages/Index.tsx`, lines ~1242)
The picker container is already `flex justify-center gap-2 flex-wrap` and iterates over `pickerColors = COLORS`, so it will automatically render 7 buttons and wrap to 4-on-top / 3-centered on mobile. No structural change required; we keep the existing `w-9 h-9` target size (no shrinking). The plan keeps this file unchanged unless QA in build mode finds the wrap behavior needs a small `max-w` tweak to lock the 4+3 split on the narrowest breakpoints — in which case a single `max-w-[260px] mx-auto` on the wrap container would be added.

### 7. Validation pass (no code change unless a gap is found)
Read through callers of `COLORS` / `pickerColors` / `activeColors` to confirm nothing assumes exactly 6:
- `Index.tsx` color-count references already key off `activeColors.length` or `STAGE_COLOR_COUNTS`.
- `freeplay.ts`, `DailySummary.tsx`, `SessionReport.tsx` — verify they reference colors by hex/length, not hard-coded 6.
Any incidental "6 colors" copy stays as-is (it refers to grid slots, which remain 6).

## Out of scope (unchanged)
- 2×3 grid, stage counts (3 / 5 / 6), DDA, scoring, stars, timers, observation durations.
- Daily summary copy, share text, badges.
- Onboarding modal.
