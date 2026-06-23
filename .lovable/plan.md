## Goal
Replace the single static end-game headline with one of three result badges, derived from how many of the 3 daily attempts the player won, and mirror that badge in the shared/copied result card. No game logic, scoring, layout, or styling changes — copy only.

## Badge logic
Computed from existing data (`rounds[].attempts[].isCorrect`), counting wins across all attempts played that day (max 3):

- 3 wins out of 3 → **"Flawless ✨"**
- 0 wins out of 3 → **"Overloaded 😵‍💫"**
- Any mix (1 or 2 wins) → **"Resilient 💪"**

A small helper `getResultBadge(rounds)` returns `{ label, sublabel }` so both the summary card and the share text use the same source of truth.

Sublabel mapping:
- Flawless → "Absolute clarity. See you tomorrow."
- Resilient → "Way to fight back. Try for flawless tomorrow."
- Overloaded → "Sequence broken. Fresh start at midnight."

## Changes

1. **`src/lib/game.ts`**
   - Add `export function getResultBadge(rounds: RoundData[])` returning `{ label, sublabel }` using the rule above (wins = count of attempts where `isCorrect === true`, total = `MAX_ROUNDS`).
   - In `generateShareText`, insert the badge label as a new line right after `dayName` (before the blank line):
     ```
     Chromatic #123
     Saturday
     Flawless ✨

     Attempt 1 ✅
     ...
     ```
   - No other share-text changes.

2. **`src/components/DailySummary.tsx`**
   - Replace the current headline block (lines 168–175) so it renders the badge label as the bold headline and the matching sublabel beneath it.
   - Keep the same wrapper, classes, spacing, border, and FIFA conditional structure (the FIFA "Full Time — Goal!" override is replaced by the badge headline per the user's request). All surrounding UI, icons, and layout remain identical.

No changes to: round/attempt tracking, DDA, scoring, stars, stats, dot indicators, carousel, share buttons, free-play button, or any styling tokens.

## Technical notes
- "Wins" counted at the attempt level (not round level) so collapsed adaptive stages still map correctly to "3 of 3".
- Badge derivation lives in `game.ts` to keep `DailySummary` presentational and to guarantee the share card and on-screen card never drift.