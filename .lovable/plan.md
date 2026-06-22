## Summary
Replace the static end-game subtext in `DailySummary` with conditional win/loss messaging based on whether the player solved at least one round.

## Scope
- File: `src/components/DailySummary.tsx`
- Lines ~167–176 ("Rest indicator" block)
- No CSS, game logic, result counting, or UI structure changes.

## Changes
1. Derive `hasWon` from existing `solvedCount` (`rounds.filter(r => r.solved).length > 0`).
2. Keep the existing header line (`Daily Challenge Complete` / `Full Time — Goal!`) untouched.
3. Replace the subtext paragraph:
   - If `hasWon` → `"Perfect sequence. See you tomorrow."`
   - If `!hasWon` → `"Visual overload. Rest your eyes and come back stronger tomorrow."`
4. Remove the day-name branching (`Sunday` vs other days) and FIFA-themed branching for this subtext only — the user provided exact strings for both states.

## Technical Details
- The change is a single conditional text swap inside the already-rendered `<p className="text-sm text-muted-foreground mt-1">`.
- No new props are added to `DailySummary`; `hasWon` is computed locally from existing `rounds` data.
