## Bring Practice Mode in line with the daily UI updates

Practice Mode already inherits the 9-option picker and the polished MTA bullet overlay through shared components. Two gaps remain vs. the daily flow.

### (a) Palette-independent puzzle generation

Today `generateFreePlayPuzzle` in `src/lib/freeplay.ts` shuffles the supplied palette directly and stores palette-specific hexes in `solution`. If the player toggles Colors → Patterns → Shapes → MTA mid-round, the overlays only render for hexes in their own palette, so tiles can go blank or lose the 1:1 mapping — the exact issue we fixed for the daily via `generateStageSolution`.

Refactor to mirror the daily approach:

- Always shuffle canonical `CHROMATIC_COLORS` indices (unseeded `Math.random` — Practice stays non-deterministic).
- Pick `colorCount` indices and pick positions against canonical hues (reuse the same non-adjacent placement idea used in daily, scaled to the 2x3 grid).
- Project chosen indices onto the caller's palette 1:1, so the same slot + index always maps cleanly across every visual style.
- Return `{ solution, activeColors, colorCount }` unchanged in shape.

No change to `Index.tsx` call sites — `getColorsForTheme(visualTheme)` continues to be passed in.

### (b) Extend Practice progression to 9 tiles

Current `getColorCountForRound` caps at 5–6. With a 9-color pool, stretch the ramp so long sessions get meaningfully harder:

```
Round 1–2:   2 colors
Round 3–5:   3 colors
Round 6–9:   4 colors
Round 10–14: 5 colors
Round 15–20: 6 colors
Round 21–27: 7 colors
Round 28–34: 8 colors
Round 35+:   9 colors  (full board equivalent — grid holds 6, so cap at min(count, palette.length, GRID_SIZE))
```

Note: the grid is 6 slots, so `colorCount` is still clamped to `GRID_SIZE`. The extended tiers matter because `getColorsForTheme` returns 9-color palettes and the higher tiers should sample from a bigger sub-pool (harder discrimination) — the picker keeps showing all 9. Update `getColorCountForRound` to the tiers above, and keep the existing `Math.min(count, palette.length)` clamp; the grid cap is applied when picking positions.

### Verification

- Start Practice in Colors, complete a round, switch to Patterns / Shapes / MTA mid-round: same tiles/positions render correctly in every style, no blank slots.
- Play through rounds 1 → 35+ and confirm the color count ramp matches the tiers above and never exceeds the grid.
- Build + typecheck clean.

### Out of scope

Picker layout, MTA overlay styling, daily-mode logic, persistence, analytics event shape.
