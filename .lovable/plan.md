## The bug

In the path **A1✗ → A2✓ → A3**, the third attempt is at stage `stage2` (5 colors). `stageToRoundIndex('stage2')` is **1**, not 2. The "is this the final attempt?" check uses `roundIndex`:

```ts
const canContinue = phase === 'result' && roundIndex < 2 && !alreadyFinished;
const isFinal = phase === 'result' && (roundIndex >= 2 || alreadyFinished);
```

So after the A3 (5-color) win, `roundIndex` is still `1`, `canContinue` is `true`, and the "Continue" button advances to a **4th** attempt at `stage3` (6 colors).

The `roundIndex < 2` rule only works on the pure win path (`stage1 → stage2 → stage3`), where the 3rd attempt happens to land at `roundIndex 2`. In every adaptive branch where A1 was a loss, the 3rd attempt sits at `roundIndex 1` and the gate fails.

## Fix

Stop using `roundIndex` to decide whether the daily is over. Use the adaptive helper that already encodes terminality.

### `src/pages/Index.tsx`

1. **`canContinue`** — replace the `roundIndex < 2` check with a next-stage probe:
   ```ts
   const canContinue =
     phase === 'result' &&
     !alreadyFinished &&
     getNextStage(currentStageKey, isCorrect) !== null;
   ```
   `getNextStage` already returns `null` for `stage1c`, `stage2r`, and `stage3` regardless of win/loss, which is exactly the "no more attempts" condition.

2. **`isFinal` auto-transition (line 492)** — same change:
   ```ts
   const isFinal =
     phase === 'result' &&
     (alreadyFinished || getNextStage(currentStageKey, isCorrect) === null);
   ```
   This guarantees the result screen auto-transitions to the daily summary on every terminal attempt, not only when `roundIndex` reached 2.

3. **`nextAttempt`** — already calls `getNextStage` and early-returns on `null`, so no change needed there. The `nextRoundIdx` math (`stage1b|stage2 → 1`, `stage1c|stage2r|stage3 → 2`) stays as-is; it's only used for the attempt tracker UI.

No changes to `game.ts`, persistence, share text, summary, or analytics. The adaptive stage table is correct — only the two UI gates that bypassed it need fixing.

### Verification

After the patch, walk the four branches and confirm exactly 3 attempts each:

- A1✓ A2✓ → stage1 → stage2 → stage3 (terminal). `getNextStage` returns null after A3.
- A1✓ A2✗ → stage1 → stage2 → stage2r (terminal).
- A1✗ A2✓ → stage1 → stage1b → stage2 (terminal). **This is the failing case today.**
- A1✗ A2✗ → stage1 → stage1b → stage1c (terminal).

In all four, after the 3rd attempt `getNextStage(currentStageKey, isCorrect)` is `null`, so `canContinue` is false and `isFinal` is true.