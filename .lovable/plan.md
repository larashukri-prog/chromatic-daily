

## Free Play Mode — Implementation Plan

### Overview
Add a session-only "Free Play" mode that lets users keep playing random puzzles after finishing the daily challenge. No persistence, no DDA, no streaks — purely for practice.

### New File: `src/lib/freeplay.ts`
Utility to generate random puzzles with 2-5 colors using `Math.random()` and the existing `COLORS` array from `game.ts`. Returns `{ solution, activeColors, colorCount }` in the same shape as `generateSolution`.

### Changes to `src/pages/Index.tsx`

**New state:**
- `mode: 'daily' | 'freeplay'` (default `'daily'`)
- `freeplayRoundNum: number` (tracks how many freeplay rounds completed)

**New callbacks:**
- `startFreePlay`: Sets mode to `'freeplay'`, generates random solution via `freeplay.ts`, resets grid/phase, starts observation timer
- `backToDaily`: Clears timer, switches mode back to `'daily'`, reloads finished daily state

**Header changes:**
- When `mode === 'freeplay'`: Show "Free Play" title + "Back to Daily Challenge" link instead of "Chromatic Daily"

**Status bar changes:**
- When freeplay: Show "Free Play" pill (no round counter dots, no "X/3 used"). Same circular timer during observation.

**Verify logic:**
- Add freeplay branch: skip `saveRoundAttempt`, skip DDA, skip localStorage. Just compute correct/incorrect and show result.

**Result modal:**
- Freeplay buttons: "Next Level" (correct) or "Try Again" (incorrect) — both regenerate a new random puzzle and restart observation
- Daily finished state: Add "Start Free Play" button alongside existing continue/game-over UI

**Daily Summary condition:**
- Only render `<DailySummary>` when `mode === 'daily'` AND finished

**Background:**
- When freeplay: Apply `bg-[hsl(260,30%,97%)]` (soft lavender) to the container

**Auto-transition:**
- Only auto-dismiss result modal when `mode === 'daily'`

**Action buttons:**
- Freeplay idle: Show "Start" button (same as daily but triggers `startFreePlay` flow)
- Freeplay result without modal: Show "View Result" button

### Changes to `src/components/DailySummary.tsx`

- Add optional `onStartFreePlay?: () => void` prop
- Render a "Start Free Play" button at the bottom of the summary when the prop is provided
- Pass `onStartFreePlay={startFreePlay}` from Index.tsx

### What stays the same
- `game.ts` — no changes
- Share/copy/WhatsApp — unchanged
- DDA logic — unchanged (freeplay bypasses it)
- Streaks, localStorage — unchanged (freeplay is session-only)
- Timer duration logic — reused as-is
- GameGrid, CircularTimer, accessibility — unchanged

### Files Modified
| File | Change |
|------|--------|
| `src/lib/freeplay.ts` | **New** — random puzzle generator |
| `src/pages/Index.tsx` | Add mode state, freeplay callbacks, conditional UI |
| `src/components/DailySummary.tsx` | Add `onStartFreePlay` prop + button |

