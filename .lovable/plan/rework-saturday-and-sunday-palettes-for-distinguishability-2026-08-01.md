# Rework Saturday and Sunday palettes for distinguishability

Both weekend palettes are currently built as smooth linear ramps: hue and lightness march in the same direction across all 9 tiles, so neighbours differ only slightly and the dark end collapses (Saturday starts at near-black greens, Sunday starts at dark purple). The fix is to drop the ramps and use curated, explicitly-listed tile specs with deliberately non-monotonic lightness.

## Saturday — Cool Spectrum

Nine hand-picked cool anchors spread across the 150°–290° arc, each paired with a lightness chosen so no two neighbours land in the same brightness band:

```text
Emerald     H 155   L 0.62
Teal        H 185   L 0.44   (deep, but clearly teal — not black)
Ice Cyan    H 200   L 0.90
Cobalt      H 232   L 0.55
Sky         H 215   L 0.78
Indigo      H 268   L 0.40
Periwinkle  H 278   L 0.83
Royal Blue  H 250   L 0.66
Mint        H 168   L 0.88
```

Lightness zigzags (mid, dark, light, mid, light, dark, light, mid, light) so adjacent tiles never read as steps of one gradient. Chroma is tuned per tile — higher at mid lightness, lower at the extremes — to stay in gamut.

## Sunday — Sunset Warmth

Nine warm anchors across the 330°–80° arc, same zigzag treatment, with the dark-purple end removed so every tile reads as a sunset colour:

```text
Magenta       H 340   L 0.60
Crimson       H 15    L 0.46
Blush         H 355   L 0.86
Coral         H 30    L 0.70
Burnt Orange  H 45    L 0.52
Gold          H 75    L 0.82
Red           H 25    L 0.58
Amber         H 60    L 0.68
Cream         H 82    L 0.93
```

## Technical notes

- Change is confined to `src/lib/palette.ts`, cases `6` (Saturday) and `default` (Sunday) inside `buildPalette`.
- Replace the `for` loops that interpolate `L` and `H` with literal arrays of `{ L, C, H }` specs.
- Raise `minSep` for both days from `0.09` toward the standard `MIN_SEPARATION` (0.15). The curated values should already clear it, so the guard becomes a safety net rather than something that has to distort the palette.
- No changes to `enforceSeparation`, `oklchToHex`, the lightness clamp, or any other day.
- Nothing else moves: tile count stays 9, and `paletteIndexOf`, MIX glyph mapping, game logic, storage and the share pipeline all read the same output shape.

## Verification

Run a script that prints both palettes' hex values plus the minimum pairwise OKLab distance, confirming every pair clears the threshold and no tile sits below lightness 0.38.