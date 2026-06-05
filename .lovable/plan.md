## Changes in `src/pages/Index.tsx`

1. Remove `bingBongAudio` ref, its `new Audio(...)` init in the audio `useEffect`, and the `play()` call inside `fireKnicksCelebration`. No sound on game end.

2. Gate the Knicks confetti trigger so it only fires on a **successful final-round completion**: replace the current `if (visualTheme === 'knicks')` block with:

   ```ts
   const isDailyDone = newTotalUsed >= MAX_ROUNDS || (correct && roundIndex >= MAX_ROUNDS - 1);
   if (visualTheme === 'knicks' && correct && isDailyDone) {
     const key = `${roundIndex}:${attemptInRound}`;
     if (knicksCelebrationKey.current !== key) {
       knicksCelebrationKey.current = key;
       fireKnicksCelebration();
     }
   }
   ```

That fires once when the player solves the round that finishes the daily game (whether on attempt 1, 2, or 3). Confetti palette and copy unchanged.
