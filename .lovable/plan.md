

## Flexible Input Logic — Implementation Plan

### Overview
Add two input modes to the game grid: **Slot-then-Color** (tap a slot first, then pick a color) and improve the existing **Color-then-Slot** mode to support instant overwriting. No changes to game engine, timer, share, or round logic.

### New State
- `activeSlot: number | null` — tracks which grid slot is "selected" awaiting a color pick

### Changes

**1. `src/pages/Index.tsx` — Interaction Logic**

Add `activeSlot` state (`useState<number | null>(null)`). Reset it when phase changes, on `clearGrid`, and on `startObservation`.

**Rewrite `handleCircleClick`:**
- If a color IS selected from palette → place it into the clicked slot (overwriting any existing color). Remove the current "tap filled slot to undo" behavior when a color is active. Clear `activeSlot`.
- If NO color is selected:
  - If the slot is filled → clear it to neutral (existing undo behavior). Clear `activeSlot`.
  - If the slot is empty → set it as `activeSlot` (visual highlight, waiting for color pick).
  - If a different slot was already active → move `activeSlot` to the new slot.
- Remove the current cap check that blocks placement when at `effectiveColorCount`. Instead, allow overwriting (which doesn't increase count). Only block new placements on empty slots when at cap.

**Rewrite color palette `onClick`:**
- If `activeSlot !== null` → place the selected color into that slot immediately, clear `activeSlot`, and set `selectedColor` to that color (so further taps use Color-then-Slot mode).
- Otherwise → just set `selectedColor` as today (Color-then-Slot mode).

**2. `src/components/GameGrid.tsx` — Active Slot Visual**

Add `activeSlot` prop. Update `getCircleBorder` to show a highlight ring (e.g., `3px solid hsl(var(--primary))`) and add a subtle CSS pulse animation when a slot is active.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `activeSlot` state, rewrite `handleCircleClick`, update palette onClick |
| `src/components/GameGrid.tsx` | Add `activeSlot` prop, visual highlight for active slot |

### What Is NOT Touched
- Game engine (`src/lib/game.ts`) — no changes to seeds, rounds, DDA, or share logic
- Timer logic — untouched
- Share results — untouched
- Pattern/accessibility overlays — untouched

