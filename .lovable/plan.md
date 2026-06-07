## Problem

After a reload, the shared results show `Peak: N in 0.0s` and `Reflex Avg` is lost because `RoundAttempt` doesn't persist recall time. `dailyStats.peakComplexity.seconds` and `dailyStats.correctTimes` only live in session state.

## Fix

### 1. `src/lib/game.ts`
- Add optional `recallMs?: number` to `RoundAttempt`.
- Extend `saveRoundAttempt(...)` signature to accept `recallMs?: number` and store it on the attempt.

### 2. `src/pages/Index.tsx`
- At every `saveRoundAttempt(...)` call site, pass the round's measured recall time in ms.
- In `buildShareMetrics`, derive from `roundsForStyles`:
  - **Peak**: among attempts where `isCorrect`, find the one with the largest tile count (count of non-null entries in `solution`); tie-break by fastest `recallMs`. Seconds = `recallMs / 1000`. If no `recallMs` present (legacy), fall back to `dailyStats.peakComplexity` when tile counts match, else `0`.
  - **Reflex Avg**: collect `recallMs / 1000` for every correct attempt with `recallMs`, sort ascending, average the 3 fastest. Fall back to `dailyStats.correctTimes` derivation when none are persisted.

No changes to UI, game flow, or other metrics already fixed (consistency, tilesDecoded).

## Verification

- Play a round, refresh `/summary`, open share text → `Peak: N in X.Xs` with real seconds; `Reflex Avg` populated.
- Share immediately after finishing in the same session → values unchanged.
- Legacy saves without `recallMs` still render without crashing (may show `0.0s` / `—` only for those old attempts).
