

## PostHog `game_abandoned` Event Tracking

### Overview
Add a `visibilitychange` listener that fires a `game_abandoned` PostHog event when the user hides/closes the tab, but only if they've started playing (clicked "I'm Ready" at least once) and haven't yet reached the Daily Summary.

### Plan

**File: `src/pages/Index.tsx`** (2 changes)

1. **Track whether the user has started playing** — add a `hasStartedPlaying` ref (not state, to avoid stale closures in the event listener):
   ```tsx
   const hasStartedPlaying = useRef(false);
   ```
   Set it to `true` inside `handleReady` (the "I am ready" callback, ~line 180):
   ```tsx
   hasStartedPlaying.current = true;
   ```

2. **Add a `useEffect` for the `visibilitychange` listener** — fires `game_abandoned` when the document becomes hidden, only if the player has started and the game isn't complete:
   ```tsx
   useEffect(() => {
     const handleVisibilityChange = () => {
       if (
         document.visibilityState === 'hidden' &&
         hasStartedPlaying.current &&
         !alreadyFinished &&
         posthog.__loaded
       ) {
         posthog.capture('game_abandoned', {
           current_round: roundIndex + 1,
           attempts_remaining: MAX_ROUNDS - totalAttemptsUsed,
         });
       }
     };
     document.addEventListener('visibilitychange', handleVisibilityChange);
     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
   }, [alreadyFinished, roundIndex, totalAttemptsUsed]);
   ```

### Details
- Uses a `ref` for `hasStartedPlaying` so the event listener always has the current value without needing it as a dependency.
- `alreadyFinished`, `roundIndex`, and `totalAttemptsUsed` are state values passed as dependencies so the listener always has fresh values.
- The `posthog.__loaded` guard prevents errors if PostHog failed to initialize.
- The event fires on tab switch or window close — standard `visibilitychange` behavior.

