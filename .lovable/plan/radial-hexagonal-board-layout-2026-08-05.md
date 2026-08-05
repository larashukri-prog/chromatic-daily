# Radial (Hexagonal) Board Layout

Replace the 2x3 square grid with a center-anchored radial ring: 6 circles evenly orbiting 1 center circle (7 slots total), used everywhere the board appears.

## Layout

```text
        [0]
    [5]     [1]
        [6]
    [4]     [2]
        [3]
```

- Slots 0-5 = outer ring, evenly spaced every 60 degrees starting at the top.
- Slot 6 = center anchor.
- Positioning uses a square `relative` container with absolutely positioned circles at `50% + R*sin(theta)` / `50% - R*cos(theta)`. No CSS grid, no gaps, no boxes. Tile diameter and orbit radius scale with the container so it stays responsive on mobile.

## Stage behaviour

- Board always renders all 7 circles so spatial memory carries across stages.
- Attempt 1: 3 active nodes. Attempt 2: 5 active nodes. Attempt 3: 7 active nodes (center included, up from 6).
- Attempts 1 and 2 draw active nodes from the outer ring only; the center stays a dim inactive receptacle until attempt 3.
- Inactive nodes render as neutral, non-interactive receptacles (no dashed frames, consistent with current styling).

## Where it applies

- Daily board (all attempts)
- Practice Mode board and its difficulty ramp (now up to 7 tiles)
- Daily Summary "solution" and "your grid" previews
- The small board previews in the result panel
- Share text emoji grid, rendered as a radial-shaped 3-line hex pattern instead of 3 rows of 2

## Technical notes

- `src/lib/game.ts`: `GRID_SIZE` 6 to 7; `STAGE_COLOR_COUNTS.stage3` 6 to 7; new radial adjacency map for the hue-neighbour check (each outer node neighbours its 2 ring siblings plus the center; center neighbours all); stage 1/2 generators restricted to indices 0-5; `generateShareText` emits the hex emoji arrangement.
- New `src/components/RadialBoard.tsx` (or refactor of `GameGrid.tsx`) owning the absolute-position math, reused by `DailySummary.tsx` and the Index preview grids so all views stay 1:1.
- `src/lib/freeplay.ts`: clamp updated to 7, positions drawn over the radial index set.
- `src/pages/Index.tsx`: `Array(GRID_SIZE)` resets, percentage calculations, and stage copy ("fills the board with 7 elements") updated.
- Unchanged: color tokens, `dailyMix` pattern/shape engine, `MixedTile`, daily seed logic, timers, tap handlers, animations (flip, fill, clear, shake, ripple) — the ripple sequence just runs center-outward instead of top-left to bottom-right.
- Saved rounds from older days hold 6-slot arrays; they are padded to 7 on read so the summary still renders.
