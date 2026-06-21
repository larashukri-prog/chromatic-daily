## Goal

Remove Black (`#000000`) and White (`#FFFFFF`) from the palette and strip the FIFA Cup/Ball overlays. Daily stages will draw all tiles from the regular chromatic palette only. All other visuals (flags on chromatic tiles, animations, layout, daily-seed determinism, persistence) stay identical.

## Palette impact

Current chromatic palette has 6 colors (Purple, Teal, Orange, Green, Pink, Lime). Stage 3 needs 6 colored tiles, which exactly equals the palette size — Stage 3 will always use all 6 colors (order still shuffled deterministically per day). Stage 1 (3) and Stage 2/2b (5/4) still get a deterministic random subset.

## Changes

1. **`src/lib/game.ts`**
   - Delete the `ANCHORS` array and the `colorCount >= 5` branch in `generateStageSolution`; always pick `shuffled.slice(0, colorCount)`.
   - Update the comment block above `generateStageSolution` to drop the Black/White/Cup/Ball reference.

2. **`src/lib/freeplay.ts`**
   - Delete the `ANCHORS` array and the anchor-append branch; practice mode picks `chromaticCount` colors straight from the palette.
   - Update the file header comment.

3. **`src/components/FifaOverlay.tsx`**
   - Remove `WHITE`/`BLACK` constants and the Cup/Ball assignment logic in `assignFifaTheme`; every colored slot now gets a flag overlay (or filler if flags run out — which won't happen at 6 max colors).
   - Drop Cup/Ball rendering from the hex-keyed overlay renderer and any imports/assets that become unused.
   - Remove unused Cup/Ball image imports (asset files left on disk, not deleted, in case you want them later).

4. **Memory**
   - Update `mem://features/fifa-theme` so the "Cup=White, Ball=Black" rule is removed; FIFA theme is now flags-only.
   - Update `mem://style/color-palette` to reflect 6 chromatic colors with no black/white anchors.
   - Update `mem://index.md` Core if any line references the anchor mapping.

## Out of scope

Color hex values of the 6 remaining colors, neutral gray, patterns/shapes, glassmorphism, fonts, timer, Ready/Speed Star, PostHog, error boundary, accessibility patterns, daily seed math, persistence shape, share-text emoji grid.
