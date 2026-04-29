## Update Practice Mode share text

Change only the clipboard copy string in `shareSession` (src/pages/Index.tsx, line 756). No layout, UI, or game logic changes.

### New text format

```text
Chromatic Practice Results ⚡️
Total Rounds: {sessionStats.roundsPlayed}
Longest Streak: {sessionStats.longestStreak}
Peak Speed: {sessionStats.bestSpeed.toFixed(2)}s

How many rounds can you handle? https://chromatic-daily.lovable.app
```

### Technical change

In `src/pages/Index.tsx`, replace the `text` template literal inside `shareSession`:

```ts
const peak = sessionStats.bestSpeed > 0 ? `${sessionStats.bestSpeed.toFixed(2)}s` : '—';
const text = `Chromatic Practice Results ⚡️\nTotal Rounds: ${sessionStats.roundsPlayed}\nLongest Streak: ${sessionStats.longestStreak}\nPeak Speed: ${peak}\n\nHow many rounds can you handle? https://chromatic-daily.lovable.app`;
```

Notes:
- Uses existing `sessionStats` fields (`roundsPlayed`, `longestStreak`, `bestSpeed`) already defined in `SessionStats`.
- Preserves the existing `—` fallback when no speed has been recorded so the share text never shows `0.00s`.
- No changes to `SessionReport.tsx`, the share button, or copied-state logic.
