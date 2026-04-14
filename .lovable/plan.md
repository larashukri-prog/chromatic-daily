

## PostHog `game_completed` Event Tracking

### Problem
No analytics event fires when a player finishes all 3 daily attempts. We need to capture `game_completed` with day, difficulty, result, and stars earned.

### Challenge: Stars Earned
Speed stars are tracked only in transient component state (`isSpeedRound`) and are not persisted. We need to add a counter that accumulates stars across the session.

### Plan

**File: `src/pages/Index.tsx`** (3 changes)

1. **Add a `starsEarned` state variable** (~line 82, near existing speed star state):
   ```tsx
   const [starsEarned, setStarsEarned] = useState(0);
   ```
   Reset it to 0 when starting a new daily session (alongside other resets ~line 116).

2. **Increment `starsEarned` on correct + speed round** (~line 425, in the verification callback where `posthog.capture('Round Verified', ...)` already fires):
   ```tsx
   if (correct && isSpeedRound) {
     setStarsEarned(prev => prev + 1);
   }
   ```

3. **Fire `game_completed` event when `showDailySummary` becomes true** — add a `useEffect` after line 574:
   ```tsx
   useEffect(() => {
     if (showDailySummary && posthog.__loaded) {
       posthog.capture('game_completed', {
         day: dayName,
         difficulty: difficultyName,
         result: solvedRounds > 0 ? 'won' : 'lost',
         stars_earned: starsEarned,
       });
     }
   }, [showDailySummary]);
   ```
   The `posthog.__loaded` check ensures no errors if PostHog failed to initialize. The dependency on only `showDailySummary` ensures it fires exactly once when the summary appears.

### Result
- Event fires once per daily session completion
- Includes all 4 requested properties
- Safe against PostHog initialization failures

