# 3 attempts, no second chances

## The bug
Currently a wrong answer doesn't actually end the round:
- **Stage 1 fail** → regenerates a fresh 3-element Stage 1 puzzle (free retry)
- **Stage 2 fail** → drops to "Stage 2b" (easier 4-element retry)
- **Stage 2b fail** → regenerates another Stage 2b puzzle (another free retry)

So a player can play 4–6+ puzzles per day instead of 3. The intent: **one attempt per stage, three stages, done.**

## Fix
Treat every stage attempt as terminal. Whether the player wins or loses, the next event is:
- Stage 1 result → advance to Stage 2
- Stage 2 result → advance to Stage 3
- Stage 3 result → daily complete

Substage `2b` and regeneration-on-fail are removed from the daily flow. (Practice mode is unaffected — it has its own loop.)

## Changes

**`src/lib/game.ts`**
- `getStageResultMessage`: drop the `regen` and `stage2b` branches for failures. On a fail, the `nextStage` will always be `stage2`, `stage3`, or `done`. Rewrite the failure copy so each one nudges the player to the next stage (e.g. Stage 1 fail → "Not quite. Stage 2 brings 5 elements — fresh start."; Stage 2 fail → "Tough one. Stage 3 is the final round — 6 elements."; Stage 3 fail → existing "That's a wrap" copy). Add FIFA variants to match.
- Type for `nextStage` narrows to `'stage2' | 'stage3' | 'done'`.

**`src/pages/Index.tsx`**
- In the verify/result handler (~line 706): on failure, mirror the success advancement instead of routing to `regen`/`stage2b`. Stage 1 fail → `stage2`; Stage 2 fail → `stage3`; Stage 3 fail → `done`.
- In the "advance to next puzzle" block (~line 753): same — failures advance one stage forward, never repeat the current stage. Reset `substage` to `'main'` and `regenIndex` to `0` on every advance.
- Rehydration block (~line 278): simplify. The last attempt's `roundIndex` + solved/unsolved is enough to know what stage is next; remove the `stage2b` derivation. Any persisted `2b`/`regen` data from before the fix is treated as the corresponding stage's single attempt.

**No changes** to: persistence schema, DDA, sharing grid, daily summary layout, practice mode, ready system, timer.

## Out of scope
- Renaming or removing the internal `substage`/`regenIndex` fields on `RoundAttempt` (kept for back-compat with older localStorage entries).
- Any visual/UI changes beyond the result-message copy.
