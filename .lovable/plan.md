## Goal
Swap the displayed "Reflex Avg" stat for "Wins" in the Practice Session results card and its generated share PNG, without touching any underlying tracking logic.

## File: `src/components/SessionReport.tsx`

1. **On-screen stat grid** — Change the second `StatCard` from:
   - `label="Reflex Avg"` / `value={reflexLabel}`
   - to `label="Wins"` / `value={stats.totalCorrect}`
   - Keep the `Zap` icon and all existing styling/classes.

2. **PNG share card builder (`buildShareCardNode`)** —
   - Rename the incoming data key from `reflex` to `wins`.
   - Update the label in the generated HTML from `"Reflex Avg"` to `"Wins"`.
   - Pass `wins: String(stats.totalCorrect)` from `handleShareCard` instead of `reflex: reflexLabel`.

3. **Share caption text** — Update the caption string from `Reflex: ${reflex}` to `Wins: ${stats.totalCorrect}`.

## Preserved (no changes)
- `computeReflexAvg()` function and its return value.
- `reflexAvg` local variable and its use inside `getInsight()`.
- All layout, typography, colors, spacing, borders, shadows, and icon choices.
- All state tracking, `SessionStats` shape, and data-capture flows.