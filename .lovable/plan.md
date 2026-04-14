

## Harden Game Completion vs. Abandonment Tracking

### What's already working
- `hasStartedPlaying` ref set to `true` on first "I'm Ready" click
- `game_completed` fires when `showDailySummary` becomes true
- `game_abandoned` fires on `visibilitychange` when `hasStartedPlaying` is true and game isn't finished

### What needs fixing

**File: `src/pages/Index.tsx`** (2 changes)

1. **Reset `hasStartedPlaying` on completion** — inside the existing `game_completed` useEffect (line 584), add `hasStartedPlaying.current = false` after capturing the event. This prevents `game_abandoned` from firing if the user switches tabs after reaching the summary.

   ```tsx
   useEffect(() => {
     if (showDailySummary && posthog.__loaded) {
       posthog.capture('game_completed', {
         day: dayName,
         difficulty: difficultyName,
         result: solvedRounds > 0 ? 'won' : 'lost',
         stars_earned: starsEarned,
       });
       hasStartedPlaying.current = false;
     }
   }, [showDailySummary]);
   ```

2. **Use `sendBeacon` transport for abandonment** — replace `posthog.capture(...)` in the visibilitychange handler with the beacon-safe approach. PostHog JS supports `{transport: 'sendBeacon'}` as a capture option:

   ```tsx
   posthog.capture('game_abandoned', {
     current_round: roundIndex + 1,
     attempts_remaining: MAX_ROUNDS - totalAttemptsUsed,
   }, { transport: 'sendBeacon' });
   ```

3. **Add `pagehide` listener** alongside `visibilitychange` for better coverage on mobile Safari and page unload scenarios. Both will share the same handler, and the ref-based guard ensures no duplicate fires:

   ```tsx
   document.addEventListener('visibilitychange', handleVisibilityChange);
   document.addEventListener('pagehide', handleVisibilityChange);
   return () => {
     document.removeEventListener('visibilitychange', handleVisibilityChange);
     document.removeEventListener('pagehide', handleVisibilityChange);
   };
   ```

   The handler needs a small tweak for `pagehide` (which doesn't use `visibilityState`):
   ```tsx
   const handleVisibilityChange = (e: Event) => {
     const isLeaving = e.type === 'pagehide' || document.visibilityState === 'hidden';
     if (isLeaving && hasStartedPlaying.current && !alreadyFinished && posthog.__loaded) {
       posthog.capture('game_abandoned', { ... }, { transport: 'sendBeacon' });
       hasStartedPlaying.current = false; // prevent duplicate fires
     }
   };
   ```

### Result
- `game_completed` closes the session, preventing false abandonment events
- `game_abandoned` uses `sendBeacon` for reliable delivery on tab close
- `pagehide` covers mobile Safari edge cases
- No duplicate events thanks to ref reset in both paths

