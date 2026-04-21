

## Adjust White Border: Resting Softer, Active Matches Other Colors

Currently white tiles and swatches use `#D1D5DB` resting / `#9CA3AF` active. The user wants:
- **Resting**: bump up slightly to `#9CA3AF` (still soft, but a touch more defined)
- **Active/selected**: use the same dark treatment as every other color, so white doesn't look like a special case

### Changes

**File: `src/components/GameGrid.tsx`** — `getCircleBorder`

```tsx
if (color === '#FFFFFF' || color === '#FFF') {
  if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
  return '2px solid #9CA3AF';
}
```

This makes the white tile fall through to the same `3px solid #000000` active-slot treatment used by every other color.

**File: `src/pages/Index.tsx`** — color picker swatch inline style

```tsx
border: isWhite ? '2px solid #9CA3AF' : undefined,
outline: selectedColor === c.hex
  ? '3px solid hsl(var(--primary))'
  : '2px solid transparent',
```

Drop the white-specific selected outline so the white swatch uses the same dark `hsl(var(--primary))` selection ring as all other swatches.

### Result
- Resting white tile/swatch: soft `#9CA3AF` border — visible but not jarring.
- Active/selected white tile/swatch: same dark ring as red, blue, yellow, etc. — consistent with the rest of the palette.

