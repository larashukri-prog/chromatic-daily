## Confetti Trigger Fix Only

Update `src/pages/Index.tsx` so practice-mode confetti only fires on a *correct* milestone round, deferring the celebration when a milestone round is missed.

### Changes in `src/pages/Index.tsx`

1. Add a ref near the other refs:
   ```ts
   const pendingMilestone = useRef(false);
   ```

2. Replace the existing milestone check inside the freeplay `setSessionStats` updater (around line 524):
   ```ts
   let milestoneHit = false;
   setSessionStats((prev) => {
     const next = updateStats(prev);
     const crossedMilestone =
       next.roundsPlayed > 0 && next.roundsPlayed % 10 === 0;
     if (crossedMilestone && !correct) {
       pendingMilestone.current = true;
     }
     if (correct && (crossedMilestone || pendingMilestone.current)) {
       milestoneHit = true;
       pendingMilestone.current = false;
     }
     return next;
   });
   ```
   Then keep the existing `if (milestoneHit) { ...confetti + audio... }` block.

3. Reset `pendingMilestone.current = false` wherever a new practice session starts (same place `sessionStats` is reset).

### Behavior
- Round 10 correct → confetti fires.
- Round 10 missed → no confetti; flag set. First correct round after that (e.g. 11, 12…) fires confetti once.
- Round 20 missed with flag still pending → flag stays set until next correct.

### Files touched
- `src/pages/Index.tsx` (only)

No new test file will be added.