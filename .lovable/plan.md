## Goal

Add a new **Go Knicks** visual style alongside Colors / Patterns / Shapes. It maps each of the 9 chromatic colors to a Knicks-themed circular image, and replaces the Black/White weekend anchors with solid Blue/Orange circles. All game logic (DDA, persistence, round scaling, timers, scoring, sharing) stays untouched — this is purely a presentation layer swap, exactly like Shapes mode.

## Image generation

Generate 9 square PNGs into `src/assets/knicks/` and externalize each via `lovable-assets` (so the binaries don't bloat the repo). All generated with `imagegen` (premium for the logo/typographic ones):

| Hex | Color name | Image |
|---|---|---|
| #EF4444 Red | Heart | Orange basketball on white |
| #FDE047 Yellow | Star | Knicks "KNICKS" roundel logo (orange/blue) |
| #2DD4D4 Teal | Cat | Stylized Statue of Liberty on blue circle |
| #FD9349 Orange | Tree | Jersey "11" white-on-blue tile |
| #8B5CF6 Purple | Moon | Knicks primary logo (basketball + KNICKS arch) |
| #7AC00F Lime | Fish | MSG arena silhouette on blue |
| #3F6212 DarkGreen | Ghost | NYC skyline silhouette on blue |
| #F198C4 Pink | Droplet | Orange "NY" monogram on white |
| #2563EB Blue | Snowflake | Knicks throwback wordmark on orange |

(Final image choices may vary slightly based on what the image model produces cleanly — the *mapping slot* is what's fixed.)

**Anchors (weekend only):**
- `#000000` Black → solid **Blue** circle (`#1D428A` — Knicks navy/blue)
- `#FFFFFF` White → solid **Orange** circle (`#F58426` — Knicks orange)

## Code changes

1. **`src/hooks/useAccessibility.tsx`** — extend `VisualTheme` union to `'colors' | 'patterns' | 'shapes' | 'knicks'`, accept `'knicks'` in `loadInitial`.

2. **`src/components/VisualThemeToggle.tsx`** — add `{ value: 'knicks', label: 'Go Knicks' }` to `OPTIONS`.

3. **New `src/components/KnicksOverlay.tsx`** — mirror of `ShapeOverlay`:
   - `KNICKS_IMAGE_FOR_HEX: Record<string, string>` mapping the 9 chromatic hexes to imported asset URLs.
   - Renders an absolutely-positioned `<img>` filling the circle (object-cover, rounded-full, pointer-events-none, `aria-hidden`).
   - Anchors (`#000000`, `#FFFFFF`) intentionally return `null` so the underlying solid color shows through.

4. **`src/components/GameGrid.tsx`** — add `knicks = theme === 'knicks'` branch:
   - `getDisplayBackground`: in knicks mode, anchors render as their Knicks solid (`#000` → `#1D428A`, `#FFF` → `#F58426`); chromatic slots render white underneath the image (same idea as shapes mode making the slot white).
   - Render `<KnicksOverlay colorHex={getPatternColor(i)} />` when `knicks` is true.
   - Borders for the orange-anchor tile follow the same "light fill needs visible border" rule used for white in shapes mode.

5. **No changes** to `game.ts`, round logic, DDA, timer, persistence, sharing, analytics, onboarding copy, or any other file. The COLORS array and all hex values stay identical — only the *rendering* of those hexes changes when `theme === 'knicks'`.

## Out of scope

- No changes to color count progression or weekend anchor logic — anchors still mean "Black slot" / "White slot" internally, just rendered as blue/orange in this theme.
- No theme-specific PostHog event names beyond the existing `visual_theme_changed` (which already accepts any string).
- No new onboarding/legend modal for the Knicks mapping (separate request if wanted later).
- No sound, no extra animations.

## Verification

- Toggle to Go Knicks → 9 chromatic slots show images, anchors show solid blue/orange.
- Toggle back to Colors/Patterns/Shapes → identical behavior to today.
- Verify in observation, recall, and result phases; error state (wrong slot) still tints red.
- Persisted theme survives reload.
