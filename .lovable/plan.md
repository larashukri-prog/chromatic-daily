## Goal

Expand the `Colors`, `Patterns`, and `Shapes` visual styles from a 7-option picker to a 9-option picker by adding two new hues to the chromatic palette. No changes to game rules, progression, MTA theme, sharing, or layout.

## New colors

- **Blue** — `#3B82F6` (hue 217)
- **Brown** — `#8B5C33` (hue 25)

(Distinct from the MTA `Z` brown `#8E5C33`, so hex-based mappings won't collide.)

## Changes

### 1. `src/lib/game.ts`
Append the two new entries to `CHROMATIC_COLORS` (becomes 9). `FALLBACK_PALETTE` derives from it, so it updates automatically. No other logic changes — stage color counts (3/5/6) stay the same; the picker simply offers more distractors.

```ts
const CHROMATIC_COLORS: ColorDef[] = [
  { name: 'Red', hex: '#EF4444', hue: 0 },
  { name: 'Orange', hex: '#FD9349', hue: 25 },
  { name: 'Yellow', hex: '#FDE047', hue: 50 },
  { name: 'Teal', hex: '#2DD4D4', hue: 180 },
  { name: 'Purple', hex: '#8B5CF6', hue: 260 },
  { name: 'Lime', hex: '#7AC00F', hue: 82 },
  { name: 'Pink', hex: '#EC4899', hue: 330 },
  { name: 'Blue', hex: '#3B82F6', hue: 217 },   // NEW
  { name: 'Brown', hex: '#8B5C33', hue: 25 },   // NEW
];
```

### 2. `src/components/PatternDefs.tsx`
`PATTERN_IDS` already has 9 patterns; `getPatternId` maps by index, so the two new colors automatically pick up the last two patterns (`concentric-circles` for Blue, `zigzag` for Brown). Add Blue and Brown to `DARK_COLORS` so their pattern strokes render in white for contrast.

### 3. `src/components/ShapeOverlay.tsx`
Add the two missing chromatic hex → icon entries to `SHAPE_FOR_HEX`:

- `'#3B82F6': FaBolt`   (Blue → bolt)
- `'#8B5C33': FaLeaf`   (Brown → leaf)

MTA mappings stay untouched (their own hexes are different).

### 4. `src/pages/Index.tsx`
No code changes needed — the picker already renders `getColorsForTheme(theme)` in a flex-wrap container, so it will naturally show 9 options for chromatic themes and remain 9 for MTA.

## Out of scope

- MTA theme palette (already 9).
- Grid size, stage color counts, DDA, sharing emoji layout.
- Onboarding copy.

## Verification

- Type-check + build.
- Playwright: load `/play`, switch through Colors / Patterns / Shapes / MTA themes, screenshot each picker to confirm 9 tiles render with correct pattern and icon overlays.
