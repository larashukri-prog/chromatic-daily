## Plan

1. **Make the third attempt terminal by attempt count, not stage tier**
   - Introduce a single derived guard in `Index.tsx`: daily can continue only when fewer than 3 attempts have been used and `getNextStage(...)` returns a stage.
   - This prevents `A1 loss → A2 win → A3 win` from advancing to the 6-slot stage, because attempt 3 has already been played.

2. **Mark the daily finished immediately after the 3rd saved attempt**
   - In `verify`, treat `newTotalUsed >= MAX_ROUNDS` as done in addition to `nextStageKey === null` and storage’s `finished` flag.
   - Pass `'done'` into the result message when attempt 3 is reached, even if `getNextStage` would normally point to 6 slots.

3. **Fix persisted storage to recognize adaptive 3-attempt completion**
   - Update `saveRoundAttempt` / `getCurrentRoundInfo` so `finished` is true when total saved attempts reaches `MAX_ROUNDS`, not only when roundIndex 2 has an attempt.
   - This closes reload/resume cases where storage says “not finished” after three adaptive attempts because the last attempt was stored under the 5-slot round.

4. **Remove stale round-index assumptions where they affect continuation**
   - Keep existing round display/summary behavior intact, but ensure any continue/summary gating uses total attempts and next-stage terminal checks instead of `roundIndex` alone.

5. **Validate the exact reported path**
   - Check the code path for `A1✗ → A2✓ → A3✓` and confirm the result modal does not render “Next Round” and the daily summary becomes available.