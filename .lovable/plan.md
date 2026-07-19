# MTA Subway Theme Swap + 9-Color Palette

Purely visual/label swap. Game logic (guess validation, stages 3→5→6, history, persistence, share format) stays untouched. Grid stays at 6 slots. The color pool expands from 7 → 9 so the picker offers 9 chips.

## 1. Palette expansion (7 → 9 colors)

`src/lib/game.ts` — update both `COLORS` and `FALLBACK_PALETTE` to the 9 MTA hexes (name = the subway character, hue kept for the existing `areHueNeighbors` diversity check):

```
1  #D82233   (red)
5  #009952   (green)
A  #0062CF   (blue)
F  #EB6800   (orange)
Q  #F6BC26   (yellow)
L  #7C858C   (grey)
Z  #8E5C33   (brown)
G  #799534   (olive)
7  #9A38A1   (purple)
```

No other logic in `game.ts` needs to change — `GRID_SIZE` stays 6, `STAGE_COLOR_COUNTS` stays 3/5/6, seeding untouched, share-emoji grid untouched (it already uses whichever hexes the puzzle picks).

`src/lib/freeplay.ts` — unchanged (still caps at 5–6 tiles per round; just draws from the wider pool).

## 2. Rename "FIFA" → "MTA" everywhere it appears in UI/code

- `src/hooks/useAccessibility.tsx` — rename theme value `'fifa'` → `'mta'`, label `'FIFA'` → `'MTA'`, and add a migration branch so any user with stored `'fifa'` (or legacy `'knicks'`) resolves to `'mta'`.
- `src/pages/Index.tsx`, `src/components/DailySummary.tsx`, `src/components/GameGrid.tsx`, `src/lib/game.ts` — rename local flags (`fifa`, `fifaMode`, `fireFifaCelebration`, `fifaCelebrationKey`) to `mta` equivalents and update all comments/copy strings ("Goal!", "Goal! Run it back?", "FIFA: fire blue/gold confetti…") to MTA-appropriate wording ("Nice pull.", "Nice pull! Run it back?", MTA celebration comment). Confetti palette shifts to MTA red + yellow.
- Rename files:
  - `src/components/FifaOverlay.tsx` → `src/components/MtaOverlay.tsx` (exports `MtaOverlay`, `MTA_IMAGE_FOR_HEX_KEYS`).
  - `src/components/FifaPaletteContext.tsx` → `src/components/MtaPaletteContext.tsx` (exports `MtaPaletteProvider`, `useMtaPalette`, `MTA_DEFAULT_PALETTE_HEXES`).
  - Update all imports in `Index.tsx`, `DailySummary.tsx`, `GameGrid.tsx`.
- `src/data/fifaSchedule.ts` — no longer used by the MTA theme; delete it (nothing else imports it after the rename).

## 3. New MTA overlay component

`MtaOverlay.tsx` replaces flag rendering with the official MTA subway bullet: a filled circle in the line's brand color with the white bold sans letter/number centered. Pure inline SVG — no network fetches, no per-day roster, no filler asset. Mapping is 1:1 from the 9 palette hexes to their characters.

Public API mirrors the old overlay so callers don't change shape:
- `<MtaOverlay colorHex={hex} className? />` renders the bullet absolutely-positioned inside its parent slot.
- `MTA_IMAGE_FOR_HEX_KEYS` exported for back-compat.

`MtaPaletteContext.tsx` keeps the same provider/hook shape; `DEFAULT_HEXES` becomes the 9 MTA hexes. Grid + picker + summary continue to wrap in `MtaPaletteProvider`.

Delete FIFA-only asset JSON references (`src/assets/fifa/*.png.asset.json`) that are no longer imported.

## 4. Picker layout for 9 chips

`src/pages/Index.tsx` picker (`pickerColors = COLORS`) — the existing `flex-wrap` centered container already handles a variable count. Adjust `max-w` on the picker container so 9 chips settle into a balanced 5+4 wrap on mobile and 9-in-a-row on wider screens, keeping the current chip size and spacing. No structural changes; still every stage shows all chips.

## 5. Patterns + Shapes themes (must cover 9 hexes now)

- `src/components/PatternDefs.tsx` — the file already defines 9 patterns (solid, vertical, horizontal, diagonal, crosshatch, polka, checker, concentric-circles, zigzag). Extend `PATTERN_IDS` to include the last two so all 9 hexes get a distinct pattern. Add `#7C858C` (grey L) and `#8E5C33` (brown Z) to `DARK_COLORS` so their strokes render in the light variant for contrast.
- `src/components/ShapeOverlay.tsx` — extend `SHAPE_FOR_HEX` with two more `react-icons/fa6` icons for the two new hexes (e.g. `FaBolt`, `FaLeaf`) so every MTA hex still has a distinct shape.

## 6. Verification

Post-implementation checks:
- Build passes.
- Preview: picker shows all 9 MTA bullets, Colors/Patterns/Shapes/MTA toggle all render for each of the 9 hexes, stage progression still 3 → 5 → 6 slots, share text still uses 6-slot emoji grid.
- LocalStorage migration: a stored `'fifa'` visual theme resolves to `'mta'` on next load.

## Technical notes (for reviewers)

- No changes to `game.ts` seeding, stage advancement, or share-text generator — only the palette arrays.
- No changes to `GameGrid.tsx` layout, just import path + `fifa`→`mta` rename.
- `DailySummary.tsx` history rendering is hex-driven, so 9-color puzzles surface correctly in the carousel without schema changes.
- FIFA schedule + flag CDN fetches are removed; MTA bullets are inline SVG, so the theme works offline.
