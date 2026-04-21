

## Align White Tile Border Colors with Other Tiles

The white tile should behave like the other colors: a visible resting border that darkens to black when active/selected.

### Change

**File: `src/components/GameGrid.tsx`** — `getCircleBorder`

- Resting white tile: `#6B7280` (slate-500) — visible but not jarring
- Active white tile (when `activeSlot === index`): `#000000` (black) — same as other colors

```tsx
const getCircleBorder = (index: number): string => {
  const color = getCircleColor(index).toUpperCase();
  if (color === '#FFFFFF' || color === '#FFF') {
    if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
    return '2px solid #6B7280';
  }
  // ... rest unchanged
};
```

**File: `src/pages/Index.tsx`** — color picker swatch

- Resting white swatch border: `#6B7280`
- Selected white swatch outline: black (matching other color swatches which use `hsl(var(--primary))` for selection — but since white needs black when selected to match the grid behavior, use `3px solid #000000`)

```tsx
style={{
  backgroundColor: c.hex,
  border: isWhite ? '2px solid #6B7280' : undefined,
  outline: selectedColor === c.hex
    ? (isWhite ? '3px solid #000000' : '3px solid hsl(var(--primary))')
    : '2px solid transparent',
  outlineOffset: '2px',
  transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
}}
```

### Result

White tiles and swatches now match the behavior of other colors: grey outline at rest (`#6B7280`), black outline when active/selected, creating consistent visual hierarchy across the palette.

