## Add PostHog `practice_results_viewed` event

### Change

In `src/pages/Index.tsx`, augment the existing `openSessionReport` callback (line 730) to fire a PostHog event before opening the modal. No UI, layout, or game-state changes.

### Technical details

Update `openSessionReport`:

```ts
const openSessionReport = useCallback(() => {
  if (timerRef.current) clearInterval(timerRef.current);
  if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  setCountdown(null);

  const accuracy = sessionStats.totalAttempts
    ? Math.round((sessionStats.totalCorrect / sessionStats.totalAttempts) * 100)
    : 0;

  if (posthog.__loaded) {
    posthog.capture('practice_results_viewed', {
      rounds_played: sessionStats.roundsPlayed,
      best_speed: sessionStats.bestSpeed,
      accuracy,
      longest_streak: sessionStats.longestStreak,
    });
  }

  setShowSessionReport(true);
}, [sessionStats]);
```

Notes:
- `totalAccuracy` is derived from existing `sessionStats.totalCorrect / totalAttempts` (same formula used in `SessionReport.tsx`).
- Uses the already-imported `posthog` from `@/lib/posthog` and the `__loaded` guard pattern used elsewhere in the file.
- Adds `sessionStats` to the dependency array so the captured values stay current.
- Only fires inside this click handler (the Results button is the only caller), so it doesn't trigger on auto-shown modals or other flows.
