

## Two handleCircleClick Updates

### Changes in `src/pages/Index.tsx`, lines 204-229

**Update 1 — Deselect active empty slot** (line 225-228): Replace `setActiveSlot(index)` with `setActiveSlot(activeSlot === index ? null : index)` so tapping the already-active slot toggles it off.

**Update 2 — Clear same-color slot** (lines 208-216): Add a check at the top of the `if (selectedColor)` block: if the tapped slot already has the same color as `selectedColor`, clear it to null and return.

### Updated `handleCircleClick` function

```typescript
const handleCircleClick = (index: number) => {
  if (phase !== 'recall') return;
  const newGrid = [...playerGrid];

  if (selectedColor) {
    // NEW: Tap same-color slot → clear it back to neutral
    if (newGrid[index] === selectedColor) {
      newGrid[index] = null;
      setPlayerGrid(newGrid);
      setActiveSlot(null);
      return;
    }
    // Color-then-Slot: place/overwrite immediately
    const isOverwrite = newGrid[index] !== null;
    const currentCount = newGrid.filter((c) => c !== null).length;
    if (!isOverwrite && currentCount >= effectiveColorCount) return;
    newGrid[index] = selectedColor;
    setPlayerGrid(newGrid);
    setActiveSlot(null);
    return;
  }

  // No color selected
  if (newGrid[index] !== null) {
    // Tap filled slot → clear it
    newGrid[index] = null;
    setPlayerGrid(newGrid);
    setActiveSlot(null);
  } else {
    // NEW: Tapping the already-active slot → deselect it
    setActiveSlot(activeSlot === index ? null : index);
  }
};
```

### Files Modified
| File | Lines | Change |
|------|-------|--------|
| `src/pages/Index.tsx` | 204-229 | Two additions inside `handleCircleClick` |

