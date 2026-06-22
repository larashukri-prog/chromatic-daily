## Problem

In the adaptive path `A1 loss → A2 win → A3 win`, stages are `stage1` (3) → `stage1b` (3) → `stage2` (5). `stageNumber` maps both `stage1b` and `stage2` to roundIndex `1`, so A2 and A3 are both stored under round 1, and round 2 stays empty.

`generateShareText` in `src/lib/game.ts` iterates by `roundIndex` 0..2:
- Round 0 → renders A1 ✅
- Round 1 → renders only the LAST attempt (A3, the 5-slot win) ❌ A2 is lost
- Round 2 → no data → renders `Attempt 3 ⬜` with all-white tiles ❌

Result: shared text shows A2 as if it were A3 (mislabeled) and a fake empty A3.

## Fix

Rewrite the share-text loop in `generateShareText` to flatten attempts chronologically across all stored rounds rather than indexing by `roundIndex`.

1. Build `const allAttempts = rounds.flatMap(r => r.attempts.map(a => ({ attempt: a, roundSolution: r.solution })))`. Round-array push order already matches play order (round 0 created first, then 1, then 2), and within a round, attempts are appended in order — so a simple flatten yields chronological A1, A2, A3.
2. Loop `i` from 0 to `MAX_ROUNDS - 1`:
   - If `allAttempts[i]` exists: render `Attempt ${i+1} ✅/❌` plus the 2x3 emoji grid from that attempt's `grid` vs `solution`.
   - Else: render the empty `Attempt ${i+1} ⬜` placeholder (covers cases where the daily ended early via abandonment).
3. No changes needed to storage, `stageNumber`, or the round model — share rendering is the only thing assuming "roundIndex == attempt number".

## Files

- `src/lib/game.ts` — `generateShareText` body only (lines ~514-541).

## Verification

- Re-share an `A1✗ → A2✓ → A3✓` run and confirm three attempt blocks, correct ✅/❌ icons, and correct emoji grids for each attempt.
- Re-share `A1✓ → A2✓ → A3✓` and `A1✗ → A2✗ → A3?` paths to confirm no regression.
