

## Fix: Reset to Neutral After Slot-then-Color Action

### Problem
When using Slot-then-Color mode (tap slot, then pick color), after filling the slot the `selectedColor` remains set to the chosen color. This means the next slot tap immediately fills it with that same color instead of starting a fresh Slot-then-Color interaction.

### Solution
One-line change in `src/pages/Index.tsx` line 524: change `setSelectedColor(c.hex)` to `setSelectedColor(null)` inside the `if (activeSlot !== null)` branch of the palette onClick handler.

This makes each Slot-then-Color interaction feel like one atomic action: tap slot → pick color → done (back to neutral). The user must deliberately pick a color first if they want Color-then-Slot mode.

### File Changed
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Line 524: `setSelectedColor(c.hex)` → `setSelectedColor(null)` |

### Not Touched
- Game engine, timer, share logic, accessibility — all unchanged

