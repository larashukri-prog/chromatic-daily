## Fix Practice Mode counter mismatch & broken confetti

### Root cause

Two counters drift apart:
- **Header `freeplayRoundNum`** increments on every puzzle generated (attempts).
- **`sessionStats.roundsPlayed`** only increments on correct answers (wins).

So "Round 11" header + "Rounds: 5" report means 11 puzzles played, 5 won. Confetti at "round 10" never fires unless the user has 10 *wins*, because the milestone check uses the wins counter.

### Changes (all in `src/pages/Index.tsx`)

**1. Make `roundsPlayed` count attempts, not wins**

In the `verify` freeplay branch (~line 443):
```ts
const newRoundsPlayed = sessionStats.roundsPlayed + 1; // every verify counts
const newCurrentStreak = correct ? sessionStats.currentStreak + 1 : 0;
setSessionStats({
  roundsPlayed: newRoundsPlayed,
  bestSpeed: correct
    ? (sessionStats.bestSpeed === 0 ? recallSeconds : Math.min(sessionStats.bestSpeed, recallSeconds))
    : sessionStats.bestSpeed,
  totalCorrect: sessionStats.totalCorrect + (correct ? 1 : 0),
  totalAttempts: sessionStats.totalAttempts + 1,
  currentStreak: newCurrentStreak,
  longestStreak: Math.max(sessionStats.longestStreak, newCurrentStreak),
});
if (newRoundsPlayed > 0 && newRoundsPlayed % 10 === 0) {
  triggerMilestone(); // fires on every 10th puzzle, win or lose
}
```

This makes the header (`freeplayRoundNum`) and the report's "Rounds" stay in lockstep, and confetti fires reliably at puzzle #10, #20, #30…

**2. Add a "Wins" stat to the Session Report**

Update `src/components/SessionReport.tsx`:
- Change grid from 2×2 to 2×3 (or keep 2×2 and swap one tile).
- Recommended: keep 2×2 by replacing **Streak** with **Wins** (longest streak is less informative than win count once "Rounds" means attempts). Show `totalCorrect` with `Trophy` icon labeled "Wins".
- Or: 2×3 grid → Rounds, Wins, Top Speed, Focus %, Streak, (empty / insight).

Going with **2×2 swap** for visual cleanliness:
```
Rounds (attempts)   |  Top Speed
Wins (totalCorrect) |  Focus %
```
Longest streak still tracked internally and surfaced in the insight line ("Great rhythm!" trigger).

**3. Update insight thresholds**

`accuracy > 95` insight will now be more meaningful (real attempts denominator). No code change needed beyond step 1, but verify the thresholds still feel right after testing.

**4. Sync `freeplayRoundNum` initialization**

Currently `freeplayRoundNum` starts at 0 and is bumped on first observation entry. Verify after change that header "Round 1" appears at the same time the user attempts puzzle 1, so the report's first attempt also shows "Rounds: 1". (Likely already correct — just confirm during implementation.)

### What stays the same

- `bestSpeed` logic (still wins-only, since failed rounds shouldn't set a record).
- Confetti visuals + audio cue.
- Share text format.
- Freeplay puzzle generation, DDA bypass, persistence rules.

### Memory update

Refresh `mem://features/practice-mode` to note: "Rounds" stat = puzzles attempted (matches header), "Wins" = correct answers, milestone confetti fires every 10 attempts.

### Files touched

- `src/pages/Index.tsx` — verify branch logic.
- `src/components/SessionReport.tsx` — swap Streak tile for Wins tile.
- `mem://features/practice-mode` — updated description.
