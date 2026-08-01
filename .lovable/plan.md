# OKLCH Daily Palette + MIX Visual Style

## Goal

Replace the four visual styles (Colors / Patterns / Shapes / MTA) with two: **Color Only** and **MIX**. The palette itself becomes dynamic — a deterministic OKLCH matrix generated from the local weekday. Game mechanics, scoring, storage, and the share pipeline stay intact.

## 1. New palette engine — `src/lib/palette.ts`

`getDailyPalette(date = new Date()): ColorDef[]` returns exactly 9 entries (`{ name, hex, hue }`, same shape as today's `ColorDef`) so every existing consumer keeps working. Hues are spread deterministically across the 9 slots; a small seeded jitter derived from the date keeps days distinct within the same weekday rule.

Grid geometry is unchanged: 6 tiles in the 2x3 layout, attempts using 3 / 5 / 6 colors. The picker keeps showing the full 9-color daily palette every attempt, so unused colors act as decoys and the puzzle stays challenging.

| Day | Rule |
|---|---|
| Monday | Pastels — L 0.88, C 0.06, hues spread 0-360 |
| Tuesday | Brights — L 0.70, C 0.22, full spectrum |
| Wednesday | Monochrome — fixed hue anchor (date-seeded), L 0.30-0.90, C 0.02-0.15 |
| Thursday | Duotone — two seeded hue anchors, interpolate hue/L/C across the 9 steps |
| Friday | Seasonal — hue band by current month (winter icy, spring fresh, summer citrus, autumn earth) |
| Saturday | Cool — hues 180-260, L 0.65, C 0.16 |
| Sunday | Warm — hues 0-50, L 0.68, C 0.20 |

OKLCH is converted to sRGB hex in-file (oklch → oklab → linear sRGB → gamma → hex) with gamut clamping by reducing chroma until in range, so all downstream code keeps receiving hex strings. Names are stable IDs (`c1`…`c9`) plus a human hue label. Palettes are memoized per date key.

## 2. Visual styles reduced to two

- `VisualTheme` becomes `'colors' | 'mix'`.
- `useAccessibility.tsx`: options are `Color Only` / `MIX`; localStorage key stays `chromatic-visual-theme`, with migration mapping `patterns` / `shapes` / `mta` (and legacy `fifa` / `knicks`) → `mix`.
- `getColorsForTheme(theme)` returns `getDailyPalette()` for both styles — palette no longer depends on style, only shapes do.
- Delete `MtaOverlay.tsx`, `MtaPaletteContext.tsx`, `PatternOverlay.tsx`, `PatternDefs.tsx`, `ShapeOverlay.tsx`, `MTA_COLORS`, and their usages in `App.tsx`, `GameGrid.tsx`, `Index.tsx`, `DailySummary.tsx`.
- Remove MTA-specific copy branches in `getStageResultMessage` and `Index.tsx`, keeping the neutral variants that already exist.

## 3. MIX overlay — `src/components/MixOverlay.tsx`

One SVG glyph per palette slot index (0-8), keyed by index rather than hex so it survives daily palette changes: Circle, Square, Triangle, Diamond, Cross, Diagonal Hatch, Concentric Rings, Star, Chevron.

Stroke color derives from the tile's OKLCH lightness: `L >= 0.6` → near-black stroke, else near-white — guaranteed contrast on every generated palette. Strokes stay thick (3.5px at a 96 viewBox) to match current accessibility sizing.

Rendered in `GameGrid.tsx` and in the picker inside `Index.tsx` whenever the style is `mix`; the tile keeps its true daily color underneath so color+shape dual recognition works.

## 4. Share / results

`generateShareText` keeps its structure, status icons, 2x3 emoji grid, metrics lines, and URL. Two changes:

- The `🎨 Visual Style:` line reports `Color Only` / `MIX` via the existing `metrics.visualStyles` path.
- A new line names the day's palette theme (e.g. `🌈 Palette: Cool Blues`) from a `getDailyPaletteName()` helper, so shared results reflect the daily visual theme.

Grid cells stay 🟢/🔴/⚪ so results remain readable in WhatsApp.

## 5. Untouched

`generateStageSolution`, stage progression, adaptive difficulty, timers, DDA, localStorage schema, practice mode logic, and the share modal UI. The canonical-index projection already in place makes swapping the palette source transparent to puzzle generation. Stored attempts from earlier days keep rendering — old hexes draw literally, and unknown `visualTheme` values fall back to `colors`.

## Technical notes

- Added: `src/lib/palette.ts`, `src/components/MixOverlay.tsx`.
- Edited: `src/lib/game.ts`, `src/lib/freeplay.ts`, `src/hooks/useAccessibility.tsx`, `src/components/VisualThemeToggle.tsx`, `src/components/GameGrid.tsx`, `src/components/DailySummary.tsx`, `src/pages/Index.tsx`, `src/App.tsx`.
- Deleted: `MtaOverlay.tsx`, `MtaPaletteContext.tsx`, `PatternOverlay.tsx`, `PatternDefs.tsx`, `ShapeOverlay.tsx`.
- Verified afterward with a headless browser pass through daily attempt 1 and practice mode in both styles.