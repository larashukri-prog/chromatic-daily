# Plan: switch game board to a 2×3 vertical grid

## What we’re changing
Flip the 6-slot game board from its current 3-column × 2-row layout to a 2-column × 3-row layout. All game logic, colors, observation/recall/result flow, and visual styling stay the same — only the board geometry changes.

## Why
On phones, a taller/narrower 2×3 board fits the vertical screen better and leaves more room for the "I'm ready" action button below the grid.

## Changes

1. **`src/components/GameGrid.tsx`**
   - Change `grid-cols-3` to `grid-cols-2` so the 6 slots render as 2 columns and 3 rows.
   - Tighten the board width slightly (e.g., from `max-w-[280px]` to a narrower token) so the two columns don’t produce oversized tiles on small screens.
   - Keep all existing gap, aspect-ratio, animation, overlay, and accessibility behavior intact.

2. **`src/pages/Index.tsx` — copy cleanup**
   - Update remaining user-facing references that say "3x2 grid" to "2x3 grid" so the How to Play / Practice Mode descriptions match the new layout.
   - Only touch user-visible strings; leave comments/code-only references alone unless they directly describe the layout shape.

3. **Verification**
   - Confirm the board still centers horizontally above the action buttons on mobile viewport.
   - Spot-check observation, recall, and result phases to ensure no tile overlap or overflow.

## Out of scope
- No changes to game rules, difficulty tiers, color counts, stage progression, timers, scoring, or sharing logic.
- No changes to the color picker, buttons, or modals beyond any necessary positioning tweaks for the taller board.