

## Add Grey Border to White Tiles in Result Modal's "Correct Pattern" Grid

The result modal's "Correct Pattern" preview renders white tiles with no border, making them blend into the white card background. We'll add a `#D1D5DB` border so white tiles are visible.

### Investigation needed
The "Correct Pattern" grid in the result modal is a separate render from the main `GameGrid`. I need to locate it (likely in `src/pages/Index.tsx` inside the result dialog) and add a conditional border for white tiles.

### Change

In the result modal's "Correct Pattern" 3x3 preview, update the tile style so any tile whose color is `#FFFFFF` gets a `1px solid #D1D5DB` border. Neutral grey tiles (`#D1D5DB` background) and colored tiles remain unchanged.

```tsx
style={{
  backgroundColor: color,
  border: color?.toUpperCase() === '#FFFFFF' ? '1px solid #D1D5DB' : undefined,
}}
```

### Result
The white tile in the "Correct Pattern" preview gets a soft `#D1D5DB` outline, making it clearly visible against the white modal background — consistent with the resting white-tile treatment elsewhere in the app (which uses `#9CA3AF`, but the modal preview is smaller and a lighter `#D1D5DB` keeps it subtle, matching the user's spec).

