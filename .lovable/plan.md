# Increase MIX pattern overlay opacity to ~50%

Bump the opacity of the MIX visual style's SVG pattern overlays from 18% to approximately 50% so the patterns stand out clearly against each tile color.

## What changes

- In `src/components/MixOverlay.tsx`, change the `OPACITY` constant from `0.18` to `0.5` (50%).
- No other files, props, or logic are touched.

## Verification

Screenshot the game grid and picker in MIX mode to confirm the pattern overlays are clearly visible on light and dark tiles.
