

## 3-Second Countdown Before Practice Mode

### Overview
When the user taps "Start Practice Mode", show a full-screen 3-2-1 countdown overlay before the observation phase begins. This gives the user a moment to prepare.

### New State
- `countdown: number | null` (default `null`) — when set to 3, 2, or 1, shows the countdown overlay; `null` hides it

### Changes to `src/pages/Index.tsx`

**Modify `startFreePlay`**: Instead of immediately starting observation after 50ms, set `countdown = 3` and run a 1-second interval that decrements to 2, 1, then 0. When it hits 0, clear the countdown (`null`), then start the observation phase (existing timer logic).

**Same change to `freeplayNext` and `freeplayRetry`**: Both should also trigger the 3-second countdown before observation begins.

**Render countdown overlay**: When `countdown !== null && mode === 'freeplay'`, render a centered overlay with the countdown number in large grey text (e.g. `text-8xl font-bold text-muted-foreground`) over a subtle backdrop, positioned above the grid area. The number animates with a scale/fade pulse on each tick.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `countdown` state, countdown logic in `startFreePlay`/`freeplayNext`/`freeplayRetry`, render countdown overlay |

