## Bug — Color picker chips show no flag for non-active colors

### Root cause
After yesterday's FIFA fix, `FifaPaletteProvider` at the root of `Index.tsx` is given the **active stage palette** (3 hexes on Stage 1). The flag map is therefore built only for those 3 hexes.

The color picker (`src/pages/Index.tsx` line 1231) iterates `pickerColors = COLORS` — the full 6-color palette. For the 3 chips whose hex is not in the active palette, `getFifaImageMap` has no entry, `FifaOverlay` returns `null`, and the chip renders as a plain white circle.

### Fix
Wrap only the picker's chip container in its own `FifaPaletteProvider` that uses the **full 6 chromatic hexes** (`FIFA_DEFAULT_PALETTE_HEXES` exported from `FifaPaletteContext`). That keeps the active-palette mapping for the game grid intact while letting every picker chip resolve to a flag.

### Files touched
- `src/pages/Index.tsx` — import `FifaPaletteProvider` + `FIFA_DEFAULT_PALETTE_HEXES`; wrap the picker `<div className="flex justify-center gap-2 flex-wrap">…</div>` (lines 1230–1288) in `<FifaPaletteProvider activeHexes={FIFA_DEFAULT_PALETTE_HEXES}>…</FifaPaletteProvider>`.

No CSS, layout, or game-state changes.