# Make every daily palette clearly distinguishable

The 9 colors on some days sit too close together — Saturday's teals/blues, Sunday's sunset hues, and Wednesday's monochrome ramp are hard to tell apart on small tiles. This adds a guaranteed minimum visual difference between all 9 colors, every day, while keeping each day's character.

## What changes

1. **Widen the tight days (modest hue drift allowed)**
   - Saturday "Cool": hue span 160-280 instead of 180-260, plus a lightness ramp (about 0.45 to 0.82) so tiles differ in both hue and brightness.
   - Sunday "Sunset": hue span 340-65 instead of 0-50, with a lightness ramp.
   - Wednesday "Mono": stays one hue, but the lightness ramp widens (about 0.25 to 0.93) with a stronger chroma ramp so each of the 9 steps is a clear jump.
   - Monday "Pastels": small lightness variation added so the low-chroma pastels don't blur together.

2. **Global minimum-separation guard**
   After a day's palette is generated, run a perceptual distance check across all 9 colors in OKLCH. If any pair is closer than the threshold, nudge the offending color's lightness and hue apart and re-check, repeating a bounded number of times. This applies to every day, so no future palette (including seasonal Friday and duotone Thursday) can ship an unreadable pair.

3. **Deterministic and safe**
   The adjustment is fully deterministic from the date seed, so everyone sees the same palette on the same day and puzzles stay reproducible. The palette is still exactly 9 colors with the same shape, so game logic, scoring, history, MIX glyph overlays, and the share modal are untouched.

## Technical notes

- All work is in `src/lib/palette.ts`.
- Add an OKLCH distance helper (weighted delta over L, C, H expressed in Lab-style a/b terms) and an `enforceSeparation(specs)` pass applied inside `buildPalette` before the OKLCH-to-hex conversion.
- Threshold tuned so all nine tiles are distinct at small size; the pass runs on the L/C/H specs, then the existing gamut-clamped `oklchToHex` produces final hexes.
- `lightness` on each `DailyColor` reflects the final adjusted value, so MIX overlay stroke contrast stays correct.
- Verify by printing the seven upcoming palettes and confirming the minimum pairwise distance clears the threshold on each day.