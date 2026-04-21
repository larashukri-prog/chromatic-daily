

## Always Show Grey Border Around White Swatch

The black border the user sees in Practice Mode comes from the **color picker swatch** in `src/pages/Index.tsx` (line ~848-854). White swatches get the dark `hsl(var(--primary))` outline when selected, which reads as black against the white background.

### Change

**File: `src/pages/Index.tsx`** (color picker swatch, ~line 848)

Add a per-swatch override so that when `c.hex === '#FFFFFF'`:
- The static `border` stays `#6B7280` (explicit hex, not the muted-foreground token).
- The selected `outline` also uses `#6B7280` instead of `hsl(var(--primary))`, so the white tile never gets a dark ring.

```tsx
const isWhite = c.hex.toUpperCase() === '#FFFFFF';
// ...
style={{
  backgroundColor: c.hex,
  border: isWhite ? '2px solid #6B7280' : undefined, // overrides className border for white
  outline: selectedColor === c.hex
    ? (isWhite ? '3px solid #6B7280' : '3px solid hsl(var(--primary))')
    : '2px solid transparent',
  outlineOffset: '2px',
  transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
}}
```

### Verification of GameGrid
`src/components/GameGrid.tsx` already returns `'2px solid #6B7280'` for white tiles before the activeSlot check, so grid tiles are already correct. No change needed there.

### Result
White swatches in the picker (Sunday + Practice Mode) always show a `#6B7280` grey border — both in the resting state and when selected — matching the grid tile behavior.

