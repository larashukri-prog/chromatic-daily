# Full-spectrum daily palettes: 9 always-distinct colours, every day

Today each day is built from a narrow rule — Wednesday picks 3 hue families, Thursday picks 2, Saturday stays in the cool arc, Sunday in the warm arc. Any rule that reuses a hue family forces two tiles to be shades of the same colour, which is exactly what's hard to tell apart. The fix is to give every day the same underlying structure: 9 slots spread right around the colour wheel, so no two tiles ever share a hue family.

## The new rule (all seven days)

1. **Nine fixed hue slots, 40° apart** — red, orange, yellow, lime, green, teal, blue, violet, magenta. Every day uses all nine.
2. **Daily rotation** — the whole wheel is rotated by a deterministic per-day amount, so Monday's "red" slot might be coral and Tuesday's might be crimson. Colours shift daily, spacing never does.
3. **Daily tone character** — each weekday gets its own lightness/chroma personality applied across the nine slots:

```text
Monday     Pastel        light, soft        L ~0.86  C ~0.09
Tuesday    Vivid         punchy, saturated  L ~0.70  C ~0.22
Wednesday  Deep Jewel    rich and dark      L ~0.52  C ~0.19
Thursday   Contrast Mix  alternating light/dark slots
Friday     Seasonal      month-tinted tone, still all 9 hues
Saturday   Bright Pop    high lightness, high chroma
Sunday     Muted Earth   softened, lower chroma, mid lightness
```

4. **Per-slot lightness jitter** — within a day, each slot gets a small deterministic offset (roughly ±0.08) so tiles differ in brightness as well as hue. This also keeps yellows from washing out and blues from going muddy, since perceived lightness varies naturally by hue.
5. **Separation guard stays** — the existing minimum-distance pass still runs as a safety net at the full 0.15 threshold. With nine hues 40° apart it should rarely need to move anything.

"Cool Spectrum" and "Sunset Warmth" disappear as concepts; Saturday and Sunday become full-spectrum days like the rest.

## What stays the same

Nine tiles per day, deterministic from the local date, same output shape. Game logic, MIX glyph mapping, stored history, and the WhatsApp share pipeline are untouched. Palette names still surface in share text — they just describe tone ("Vivid", "Deep Jewel") instead of a hue family.

## Technical notes

- Rewrite `buildPalette` in `src/lib/palette.ts`: replace the seven-branch `switch` with a single generator that takes a `{ name, L, C, jitter }` tone profile per weekday plus the shared 9-slot hue ring.
- Keep `spin` from the existing seeded RNG as the daily hue rotation; keep the same RNG for per-slot jitter so results stay deterministic per date.
- Drop `lockHue` usage (no more hue-family days) and delete the now-unused triad/duotone helpers if nothing else references them. `hueLabel` stays — tile names still use it.
- Friday keeps `seasonalBand`, but only to bias tone (lightness/chroma and a small hue tint), not to restrict the hue set.
- Reset `minSep` to `MIN_SEPARATION` for all days; remove the per-day lowered floors.

## Verification

Print all seven upcoming palettes with their hex values, plus the minimum pairwise OKLab distance and the count of distinct hue families per day — confirm every day shows 9 families and clears the 0.15 threshold.