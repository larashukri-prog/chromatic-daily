Update the daily end-of-game badge logic in `src/lib/game.ts` to classify mixed-result sessions by how the final attempt ended.

### Files to edit
1. `src/lib/game.ts` — refactor `getResultBadge`.
2. `src/components/DailySummary.tsx` — no structural changes needed (it already consumes `getResultBadge`), but verify no hard-coded assumptions break.

### Logic change
Derive the chronological attempt sequence (`rounds.flatMap(r => r.attempts).map(a => a.isCorrect)`).

| Wins | Last attempt | Label | Sublabel |
|------|-------------|-------|----------|
| 3 / 3 | — | `Flawless ✨` | `Absolute clarity. See you tomorrow.` |
| 0 / 3 | — | `Overloaded 😵‍💫` | `Sequence broken. Fresh start at midnight.` |
| 1–2 | Wrong | `So Close! 🤏` | `Almost there — come back sharper tomorrow.` |
| 1–2 | Right | `Resilient 💪` | `Way to fight back. Try for flawless tomorrow.` |

Since `generateShareText` also calls `getResultBadge`, the share card headline updates automatically. No other UI surface changes are required.