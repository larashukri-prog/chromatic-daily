## Problem

In the shared daily results, only Visual Style renders correctly. Speed Stars, Consistency, Peak, and Decoded show 0/—.

## Root cause

`buildShareMetrics` in `src/pages/Index.tsx` reads from the `dailyStats` React state. That state is initialized to all zeros on every page mount and is only incremented while the user plays a round in the current session (`setDailyStats(updateStats)` at line 602).

When the user reaches the Daily Summary after a refresh, after returning later in the day, or by navigating directly to `/summary`, `alreadyFinished` is restored from localStorage but `dailyStats` stays at its initial zero values. Visual Styles works because it's derived from `getTodayData().rounds`, not from `dailyStats`.

`starsEarned` and `totalFocusSeconds` (passed separately into `generateShareText`) have the same issue — they're session-only state, never rehydrated.

## Fix

Derive all share metrics from the persisted round data instead of from session-only React state.

### File: `src/pages/Index.tsx`

1. **`buildShareMetrics`** — Compute `consistency`, `reflexAvg`, `peakComplexity`, and `tilesDecoded` directly from `roundsForStyles` (the same persisted `rounds` already used for Visual Styles):
   - `roundsPlayed` = total attempts across all rounds
   - `totalCorrect` = count of attempts where `isCorrect`
   - `tilesDecoded` = sum, for each correct attempt, of tiles in `attempt.grid` matching `attempt.solution` (or the round solution)
   - `peakComplexity` = largest solved round's tile count (tie-break: fastest recall time if available; otherwise just first)
   - `correctTimes` = `attempt.recallMs / 1000` for correct attempts when present; reflex avg = mean of the 3 fastest
   - `consistency` = `Math.round(totalCorrect / roundsPlayed * 100)`

2. **`share` and `shareWhatsApp`** — also derive `starsEarned` and `totalFocusSeconds` from saved data so the share text is correct after a reload:
   - `starsEarned` = count of attempts flagged as speed attempts in saved data (or fall back to the current `starsEarned` state if the field isn't persisted)
   - `totalFocusSeconds` = sum of persisted observation seconds per attempt, or fall back to current state

3. If any of these fields (recall time, speed flag, observation seconds) are not currently saved on `RoundAttempt`, gracefully fall back to the existing session-state values so the in-session share still works and the post-reload share at least shows the metrics that are available.

### Verification

- Play a daily game to completion, refresh the page, open the share text, and confirm Speed Stars / Consistency / Peak / Decoded are populated (not 0 / —).
- Share immediately after finishing in the same session and confirm values are unchanged from before.
- Visual Style line continues to render correctly.

No UI, styling, or game logic changes — only the share-metrics computation.
