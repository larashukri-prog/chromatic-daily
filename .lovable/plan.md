

## Soften the White Tile Border

The white tile border in the grid is currently `#6B7280` (slate-500), which at 2–3px weight reads as near-black against a white fill. We'll lighten it to a softer grey so it defines the edge without the jarring contrast.

### Change

**File: `src/components/GameGrid.tsx`** — `getCircleBorder`

Replace the white-tile branch to use a lighter grey (`#D1D5DB`, Tailwind slate-300) for resting state and a medium grey (`#9CA3AF`, slate-400) for the active slot — still visible, but no longer "black-looking".

```tsx
if (color === '#FFFFFF' || color === '#FFF') {
  if (phase === 'recall' && activeSlot === index) return '3px solid #9CA3AF';
  return '2px solid #D1D5DB';
}
```

### Also update the picker swatch in `src/pages/Index.tsx`

So resting and selected white swatches match the grid:

```tsx
border: isWhite ? '2px solid #D1D5DB' : undefined,
outline: selectedColor === c.hex
  ? (isWhite ? '3px solid #9CA3AF' : '3px solid hsl(var(--primary))')
  : '2px solid transparent',
```

### Result
White tiles and swatches get a soft `#D1D5DB` edge at rest and a slightly firmer `#9CA3AF` edge when active/selected — visible but no longer contrasty enough to read as black.

