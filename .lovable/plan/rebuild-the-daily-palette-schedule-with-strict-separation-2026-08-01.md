# Rebuild the daily palette schedule with strict separation

Every day's 9 colors get rewritten to the exact schedule below, and the separation guard is tightened so no two tiles can look adjacent. Continuous gradients and single-hue ramps are gone.

## The 7-day schedule

- **Monday — Pastels**: 9 hues evenly across 360 degrees, fixed L 0.85, C 0.08.
- **Tuesday — Brights**: 9 hues evenly across 360 degrees, fixed L 0.70, C 0.22.
- **Wednesday — Triadic Tones**: 3 hues 120 degrees apart (anchor seeded from the date); each hue rendered at L 0.35 / 0.65 / 0.88. Nine tiles in three clear families.
- **Thursday — Split-Duotone**: 2 hues 180 degrees apart. Hue A gets 4 steps, Hue B gets 5 steps, each with wide lightness and chroma jumps so no two steps read as neighbours.
- **Friday — Seasonal**: month-driven curated 9-color set (Winter Frost, Spring Bloom, Summer Citrus, Autumn Earth) with the hues re-spaced for high separation.
- **Saturday — Cool Spectrum**: 9 hues evenly across 150-290 degrees, lightness stepping 0.40 to 0.85.
- **Sunday — Sunset Warmth**: 9 hues evenly across 330-70 degrees (wrapping), lightness stepping 0.45 to 0.90.

## Separation guarantee

The existing guard is raised to a Delta-E-equivalent threshold of about 15 (roughly 0.15 in Oklab distance on the rendered hexes, measured after gamut clamping). Colors that fall short are nudged apart deterministically in lightness first, then hue, so the same date always produces the same palette. Wednesday keeps its 3 hue families while nudging (lightness only within a family).

## Unchanged

Palette size stays 9, the returned shape stays identical, and puzzle generation, scoring, storage, MIX glyph overlays, practice mode, and the share modal are untouched.

## Technical notes

- All edits in `src/lib/palette.ts`: rewrite the day cases in `buildPalette`, raise `MIN_SEPARATION`, and let the guard vary lightness within a locked-hue family.
- Per-day hue rotation from the date seed is kept only where it doesn't break the rule (Wednesday's triad anchor, Thursday's duotone anchor); Monday/Tuesday/Saturday/Sunday keep a small seeded spin within their arc.
- Verify by printing all seven upcoming palettes and confirming the minimum pairwise distance clears the threshold each day.
