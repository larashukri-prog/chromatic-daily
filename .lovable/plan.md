## Problem
On a user's first daily game, tapping "Start" triggers a 3-2-1 countdown before observation begins. The Start button stays visible during the countdown (because `phase` is still `'idle'`), so it can be tapped again, restarting the countdown.

## Fix
In `src/pages/Index.tsx` (~line 1112), update the daily idle Start button condition to also check that no countdown is running — matching the pattern already used by the freeplay Start button just below it.

Change:
```tsx
{phase === 'idle' && !isFreeplay && !alreadyFinished && (
```
to:
```tsx
{phase === 'idle' && !isFreeplay && !alreadyFinished && countdown === null && (
```

## Result
- During the 3-2-1 countdown the Start button is hidden, so it cannot be tapped again.
- The countdown itself remains unchanged (still only triggered on the first-ever play, per existing logic).
- Freeplay Start behavior is unchanged (already hides during countdown).

## Files touched
- `src/pages/Index.tsx` — single condition update on the daily Start button.
