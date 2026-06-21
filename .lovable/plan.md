## Goal

Constrain the active palette to exactly six colors — **Red, Orange, Yellow, Teal, Purple, Lime** — and stop injecting Black/White into the color picker. Patterns and shapes will map 1:1 to these six.

## Changes

1. **`src/lib/game.ts`**
   - Reduce `COLORS` to six entries in this order: Red `#EF4444`, Orange `#FD9349`, Yellow `#FDE047`, Teal `#2DD4D4`, Purple `#8B5CF6`, Lime `#7AC00F`.
   - Reduce `FALLBACK_PALETTE` to the same six (same order).

2. **`src/pages/Index.tsx`**
   - Drop the `isSunday || isFreeplay` anchor branch. `pickerColors` becomes just `COLORS`, so Black/White never appear in the picker.

3. **`src/components/PatternDefs.tsx`**
   - Trim `PATTERN_IDS` to six (drop the last three: checkerboard, concentric-circles, zigzag) so each pattern lines up with one of the six colors by index.
   - Update `DARK_COLORS` to only the kept dark color (`#8B5CF6` Purple). Remove Green/Blue entries.

4. **`src/components/ShapeOverlay.tsx`**
   - Trim `SHAPE_FOR_HEX` to the six kept hexes (Red→Heart, Orange→Tree, Yellow→Star, Teal→Cat, Purple→Moon, Lime→Fish). Remove the Green/Pink/Blue rows and their unused icon imports.

5. **`src/components/FifaOverlay.tsx`**
   - Trim `FLAG_SLOT_HEXES` to the six kept hexes (same order as `COLORS`) so flag overlays only target active colors.

6. **Memory**
   - Update `mem://style/color-palette` to the new six-color list (no Black/White, no Green/Pink/Blue).
   - Update `mem://index.md` if needed.

## Out of scope

Daily 3-stage progression logic, seed math, persistence shape, share-text emoji grid, glassmorphism/typography/animations, FIFA flag URLs, neutral gray.
