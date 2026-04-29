## Plan to fix Practice Mode rounds and mobile confetti

I found two likely causes in the current Practice Mode code:

1. The top-right/header counter (`freeplayRoundNum`) is still being advanced only when the player gets a correct answer and presses “Next Level”. Failed attempts use “Try Again” and keep the same header round, while the Session Report increments `roundsPlayed` on every verify. This can still create mismatches depending on whether the user is counting shown puzzle number or total attempts.
2. `canvas-confetti` is fired immediately during `verify`, while the result dialog opens shortly after. On mobile this can be easy to miss or be hidden/competed with by the dialog transition. The current burst also uses only side origins and no mobile-specific full-screen/fixed-canvas configuration.

## What I will change

### 1. Make one source of truth for Practice Mode round attempts

Use `sessionStats.roundsPlayed` as the authoritative “puzzles attempted” count.

- Increment it exactly once per Verify click in Practice Mode.
- Display the header counter from the same attempt-based value, not from the separate progression-only `freeplayRoundNum` state.
- Keep `freeplayRoundNum` only for puzzle difficulty generation / next-puzzle progression if needed, or replace it with a separate internal `practicePuzzleLevel` name so the UI no longer depends on the wrong counter.

Expected result:

```text
After 1 verified puzzle: header Round 1, modal Rounds 1
After 10 verified puzzles: header Round 10, modal Rounds 10
Failed attempts count too, because the chosen behavior is “Rounds = puzzles attempted”.
```

### 2. Fix the off-by-one feel in the header

Right now the header can show the puzzle being served rather than the number of completed attempts. I’ll adjust the label so it matches the modal exactly:

- Before the first Verify, Practice Mode can show `Round 1` as the current puzzle prompt.
- After a Verify, the report and visible counter will both reflect total attempts.
- Once moving to the next puzzle, the displayed number will remain consistent with the same attempt-count model.

If needed, I’ll label the header as `Round {Math.max(1, sessionStats.roundsPlayed || freeplayRoundNum)}` during the first unverified puzzle, then switch to the stats value once attempts exist.

### 3. Make milestone confetti reliable on mobile

Replace the current milestone trigger with a mobile-safe celebration:

- Fire after the verify animation completes / when result is visible, not only immediately during state update.
- Use `canvas-confetti` with a fixed full-screen canvas configuration where possible:
  - `resize: true`
  - `useWorker: true` when supported
  - `zIndex` above dialogs/overlays
  - center + side bursts for mobile visibility
- Add a lightweight in-app visual fallback using the existing UI style, such as a short “Milestone” sparkle burst/banner inside the result modal, so mobile users get feedback even if the browser blocks canvas animation.

Expected result:

```text
On rounds 10, 20, 30... confetti/sparkle feedback is visibly triggered on mobile and desktop.
```

### 4. Avoid touching restricted areas

I will keep the strict constraint:

- No changes to DailyChallenge logic.
- No changes to the existing daily GameLoop behavior.
- No changes to the overall branding/color palette.

The work stays scoped to Practice Mode state/display and the existing Session Report overlay.

## Technical files to update

- `src/pages/Index.tsx`
  - Align displayed Practice Mode round counter with `sessionStats.roundsPlayed`.
  - Ensure attempt stats are updated using functional state updates to avoid stale React state.
  - Trigger milestone celebration from the confirmed new stats value.
  - Add mobile-safe celebration/fallback state.

- `src/components/SessionReport.tsx`
  - No major UI change expected, but I’ll verify the stat label/value remains consistent with the new counter source.

- `mem://features/practice-mode`
  - Update the Practice Mode memory if the implementation wording changes, so future edits preserve the corrected rule.

## Verification plan

After implementation, I will verify in the preview at mobile size:

1. Start Practice Mode.
2. Complete multiple Verify attempts, including a failed attempt if possible.
3. Confirm header “Round” and Session Report “Rounds” show the same number.
4. Confirm milestone visual feedback appears on round 10.
5. Check browser console logs for runtime errors.