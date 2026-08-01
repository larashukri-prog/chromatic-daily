# Free-form Daily Palettes

Drop the fixed weekday "characters" (Pastel Monday, Jewel Wednesday, etc.). Every day becomes an unpredictable mixed set of 9 colors — e.g. a deep contrast blue next to a citrus pink next to a bright yellow — chosen so tiles are easy to tell apart within the day, and so today looks clearly different from yesterday.

## What changes for players

- No day-of-week theme. The day's seed alone decides the palette, so consecutive days can swing from mostly-dark-and-saturated to mostly-bright-and-airy.
- Within a day: 9 colors that are far apart in hue, lightness and saturation — mixed, not a smooth ramp.
- Across days: the generator compares against the previous day's palette and re-rolls if too similar, so there is a visible "new day" feeling.
- No more monochrome/muddy days (fixes the dark Monday pastel and the flat Sunday).
- Everything else is untouched: 3 attempts, adaptive 3/5/6 tiles, MIX patterns, local history, share modal, and all players still see the same palette on the same date.

## Technical approach

All work is in `src/lib/palette.ts`.

- Replace the weekday tone `switch` and the fixed hue-ring step in `buildPalette` with a seeded free-form sampler:
  - Seed from the day key only (no weekday branch).
  - Shuffle a randomly rotated set of 9 hue buckets (about 40 degrees apart, with per-bucket jitter) so hue order differs each day.
  - Sample lightness per slot from a shuffled ramp spanning roughly L 0.30-0.92, and chroma per slot roughly C 0.06-0.24, so light/dark and vivid/muted are interleaved rather than patterned.
- Keep `enforceSeparation` with the existing Delta-E threshold as the final guard, then keep the existing clamp plus `oklchToHex` conversion so output stays in gamut.
- Add a day-over-day novelty check: build the previous day's palette, compute mean perceptual distance between the two sets, and if it is below a threshold advance the seed and rebuild (capped retries).
- `getDailyPaletteName` returns a neutral generated label (no weekday name) so anything rendering it keeps working.
- `DailyColor` shape, `DAILY_PALETTE_SIZE`, `paletteIndexOf`, `hexLightness`, the day cache and the fallback palette all stay as they are.

## Verification

Print 14 consecutive days of hex arrays, confirm each day has 9 well-separated colors and that adjacent days differ noticeably, then screenshot the grid and picker in the preview.