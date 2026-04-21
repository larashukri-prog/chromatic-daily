

## Remove Dark Focus Ring on White Swatch

The dark "border" the user sees on a selected white swatch is the browser focus-visible ring inherited from the button base class (`focus-visible:ring-2 focus-visible:ring-ring`). The `--ring` token is `hsl(222.2 84% 4.9%)` — almost black — which reads as a hard black ring on the white swatch the moment it's clicked.

The previous changes (`outline: 3px solid #6B7280`) work, but the focus ring sits on top of them and dominates visually.

### Change

**File: `src/pages/Index.tsx`** — color picker swatch (~line 850)

Update the swatch's `className` to suppress the default focus-visible ring on every swatch (we already provide our own `outline`-based selection feedback, so the focus ring is redundant). Also slim down the resting border for white so it sits at the same `#6B7280` weight without doubling up on Tailwind's `border-muted-foreground/50` className.

```tsx
className={cn(
  "w-9 h-9 rounded-full transition-all duration-200 relative overflow-hidden",
  "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  !isWhite && "border border-muted-foreground/50"
)}
style={{
  backgroundColor: c.hex,
  border: isWhite ? '2px solid #6B7280' : undefined,
  outline: selectedColor === c.hex
    ? (isWhite ? '3px solid #6B7280' : '3px solid hsl(var(--primary))')
    : '2px solid transparent',
  outlineOffset: '2px',
  transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
}}
```

### Why this fixes it
- `focus-visible:ring-0` removes the near-black browser focus ring that appears the instant a swatch is clicked — the actual source of the "black border" on the white swatch.
- For white, both the resting `border` and the selected `outline` resolve to `#6B7280` (the muted grey).
- For non-white swatches, the selected `outline` keeps the existing dark `primary` ring, so coloured tiles still look the same as before.
- We keep our custom `outline`-based selection cue (3px grey for white, 3px primary for the rest), so the user still gets clear visual feedback when a colour is picked — just without the jarring black focus ring.

### Result
Clicking the white swatch now shows a single muted `#6B7280` ring in both resting and selected states. No black border, no focus halo, on any swatch.

