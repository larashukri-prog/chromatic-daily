

## Practice Mode: Progressive Difficulty Ramp

Rewrite `src/lib/freeplay.ts` so Practice Mode ramps difficulty based on the session's round count instead of pure randomness. Anchors (Black & White) only appear once color count exceeds 4.

### Difficulty Tiers

| Round # | Color Count | Anchors (B&W) |
|---------|-------------|---------------|
| 1–2     | 2–3 colors  | No (chromatic only) |
| 3–6     | 4 colors    | No (chromatic only) |
| 7–20    | 5 colors    | Yes (B&W included) |
| 21–30   | 6 colors    | Yes |
| 31–40   | 7 colors    | Yes |
| 41+     | 8–9 colors  | Yes (full Master Grid) |

Within each tier, color selection and grid positions remain randomized for variety.

### Implementation

**File: `src/lib/freeplay.ts`**

1. Change `generateFreePlayPuzzle` signature to accept a `roundCount: number` argument (1-based session round counter).
2. Compute `colorCount` from the tier table above based on `roundCount`.
3. Only include the two anchors when `colorCount > 4`. Below that, pick purely from the chromatic `COLORS` palette.
4. Shuffle and place colors on the 3×3 grid as today.

**File: `src/pages/Index.tsx`**

1. Add a session-only counter (e.g. `practiceRoundCount`, starts at 1, increments after each completed practice round).
2. Pass the counter into `generateFreePlayPuzzle(practiceRoundCount)`.
3. Reset the counter to 1 whenever the user enters Practice Mode fresh (not on every internal round).

### Notes

- Persistence: counter lives in React state only — resets when leaving Practice Mode or refreshing the page (matches existing "session-only" rule for Practice Mode).
- DDA/daily storage: still bypassed.
- The visual countdown timer in `CircularTimer` already scales by color count, so it will automatically adapt as the ramp progresses.
- Memory update: refresh `mem://features/practice-mode` to record the new progressive ramp + anchor rule.

