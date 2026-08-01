# Single MIX Visual Style with a Daily Pattern Rotation

Collapse the two visual styles ("Color Only" and "MIX") into one style, always on, named MIX. Each day the player gets both a fresh color palette (already daily) and a fresh, deliberately distinct set of tile patterns, so every day feels new.

## What changes for the player

- No more Visual Style switcher — every tile always shows the daily color plus its pattern.
- Patterns rotate daily: which pattern sits on which tile slot changes each day, drawn from a wider pattern library so new patterns keep appearing through the week.
- Patterns on screen at the same time are guaranteed to be visually different from one another (no two stripe-type or two dot-type patterns in the same day), so nothing is confusing.
- Everything else is untouched: the 2x3 grid, 3 daily attempts, adaptive difficulty, daily seed, saved history, results card, and WhatsApp/clipboard sharing.

## Technical changes

1. `src/components/MixOverlay.tsx`
   - Expand the pattern library beyond the current 9 (add e.g. triangles, zigzag/chevron, honeycomb, scales, crosses, basket weave, bricks, confetti dashes, spiral rings) and tag each with a family (dot / line / grid / radial / organic).
   - Add `getDailyPatternOrder(date)`: a deterministic day-seeded selection of 9 patterns mapped to palette slots 0-8, constrained so no two chosen patterns share the same family, and so the mapping differs from the previous day.
   - The overlay resolves its pattern through the daily order instead of the fixed index list. Keep `useId` collision-safe IDs and the current 50% opacity + contrast-aware stroke logic.

2. `src/hooks/useAccessibility.tsx`
   - `VisualTheme` becomes the single value `'mix'`; `VISUAL_THEME_OPTIONS` reduced to one entry. Any stored legacy value (`colors`, `patterns`, `shapes`, `mta`, `fifa`) migrates to `mix`. `enabled` is always true; `toggle` becomes a no-op.

3. `src/components/VisualThemeToggle.tsx`
   - Removed, along with its render site in `src/pages/Index.tsx`.

4. `src/pages/Index.tsx`, `src/components/GameGrid.tsx`, `src/components/DailySummary.tsx`
   - Drop the `mixMode` / `theme === 'mix'` conditionals so the overlay always renders (grid, picker, summary, practice mode).

5. `src/lib/game.ts`
   - Leave the persisted `visualTheme` field and share-text plumbing in place for back-compat; share line simply always reads MIX. No changes to seeds, scoring, storage, or the share grid.

## Verification

Playwright screenshots of the daily grid and picker to confirm all 9 patterns render distinctly, plus a simulated date change to confirm the pattern set differs day to day.
