

## UX & Logic Enhancements

Four additions, all preserving the current visual style, hex codes, and core 3-attempt flow.

### 1. Focus Stat Tracking (invisible timer)

**File: `src/pages/Index.tsx`**
- Add `const [totalFocusSeconds, setTotalFocusSeconds] = useState(0)` and reset to 0 on the daily-reset path (alongside `setStarsEarned(0)`).
- We already capture `observationStartTime.current` when observation begins. In `handleReady`, compute `elapsedSec = (Date.now() - observationStartTime.current) / 1000` and add it to `totalFocusSeconds` (daily mode only — skip when `isFreeplay`).
- The timer remains visually hidden during gameplay (no UI change to the observation phase).

**File: `src/components/DailySummary.tsx`**
- Accept new prop `totalFocusSeconds: number`.
- Render a minimalist stat card at the bottom of the carousel area (above the share buttons), styled consistently with existing border/card tokens:
  > "You focused for **{X}** seconds today."
  > "Your neural pathways are strengthening."

### 2. Neural Match progress bar (replaces "Failed")

**File: `src/components/DailySummary.tsx`** (in `SlideContent`)
- For each attempt, compute `correctTiles = result.filter(Boolean).length` and `neuralMatch = Math.round((correctTiles / 9) * 100)`.
- Replace the "Solved / Incorrect" subtitle with:
  - If solved → keep "Solved" label + show `100% Neural Match` underneath.
  - If incorrect → render a slim `Progress` bar (using existing `@/components/ui/progress`) labelled **"Neural Match"** with `{neuralMatch}%` to the right.
- Use existing `bg-secondary` / `bg-primary` tokens so styling stays sleek and on-brand.

**File: `src/pages/Index.tsx`** (Result Modal, line ~989)
- For the in-game result modal, when `!isCorrect`, replace the "Game Over / Not Quite" subtitle row with the same Neural Match progress bar component.

### 3. Stars on Share / Summary screen

**File: `src/components/DailySummary.tsx`**
- Accept new prop `starsEarned: number`.
- Add a compact star row near the focus-time stat: `⭐️ × {starsEarned}` with caption "Speed Stars Earned".

**File: `src/lib/game.ts`** (`generateShareText`)
- Extend signature to accept optional `starsEarned` and `totalFocusSeconds`.
- Append two lines before the URL:
  ```
  ⭐️ Speed Stars: {starsEarned}
  🧠 Focus: {X}s
  ```

**File: `src/pages/Index.tsx`**
- Update `share()` and `shareWhatsApp()` to pass the new values, and pass `starsEarned` + `totalFocusSeconds` into `<DailySummary />`.

### 4. Sunday Anchor Logic (Black & White tiles)

**File: `src/lib/game.ts`**
- Add two anchor entries (used only on Sunday + Practice Mode):
  ```ts
  const ANCHORS = [
    { name: 'Black', hex: '#000000', hue: -1 },
    { name: 'White', hex: '#FFFFFF', hue: -2 },
  ];
  ```
- In `generateSolution` / `generateSolutionDDA`, when `dayOfWeek === 0` (Sunday): pick `colorCount - 2` chromatic colors from `COLORS`, then **always** add Black + White as the final two anchors. Place all 9 colors as today (Sunday uses 9 colors so all tiles fill); the 2 anchors get random positions like the rest. The chromatic count stays Mon–Sat untouched (no Black/White).
- Return `activeColors` including the two anchors so the picker shows them.

**File: `src/lib/freeplay.ts`**
- After picking `chosen` chromatic colors, replace the last 2 entries with Black + White anchors (always exactly 2 anchors, regardless of `colorCount`). Ensure `colorCount >= 3` minimum so we still have at least 1 chromatic + 2 anchors. Adjust the random range to `Math.floor(Math.random() * 3) + 3` (3–5 colors, of which 2 are anchors).

**File: `src/pages/Index.tsx`** (Color Picker, line ~810)
- Currently the picker iterates `COLORS`. Change it to iterate a derived `pickerColors` array:
  - On Sunday or in Practice Mode → `[...COLORS, BLACK, WHITE]`
  - Other days → `COLORS` (unchanged).
- Black/White swatches use a thin `border border-border` ring so they remain visible against the white card background.

### Preservation guarantees
- 3-attempt daily limit, manual "Start" / "I'm Ready" flow, Practice Mode entry point, DDA logic, hex-code palette for Mon–Sat, fonts, and existing card styling are all untouched.
- Speed-star earning logic is unchanged; we only surface the running total.
- No changes to PostHog events except passing the existing `starsEarned` value (already tracked).

