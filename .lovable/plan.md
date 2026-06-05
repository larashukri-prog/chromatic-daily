## Goal

Record the active visual theme (`colors` | `patterns` | `shapes` | `knicks`) on each individual attempt at the moment it's saved, and have the Daily Summary render every attempt using its own recorded theme instead of the currently-active global theme.

## Changes

### 1. `src/lib/game.ts`
- Extend `RoundAttempt` with `visualTheme?: VisualTheme` (optional for back-compat with existing localStorage entries).
- Import/re-export the `VisualTheme` type (or use a string union) so callers can pass it.
- Update `saveRoundAttempt(...)` signature to accept a `visualTheme` argument and store it on the new attempt object.

### 2. `src/pages/Index.tsx`
- Pass the current `visualTheme` into the `saveRoundAttempt(roundIndex, correct, playerGrid, solution, visualTheme)` call (line ~606).

### 3. `src/components/DailySummary.tsx`
- Extend the local `AttemptSlide` interface with `visualTheme?: VisualTheme`.
- When flattening rounds → slides, copy `attempt.visualTheme` onto the slide.
- In `SlideContent`, derive `shapesMode` / `knicksMode` / pattern-mode from `slide.visualTheme` (falling back to the current global `useVisualTheme()` only when an old attempt has no recorded theme, for back-compat). The grid rendering (background fill, border, `ShapeOverlay`, `KnicksOverlay`, `PatternOverlay`) should key off the per-attempt theme.
- The outer "Game Over — Swish!" / share-section copy that uses `knicks` should keep using the global active theme (it's about the whole session, not a specific attempt) — no change there.

## Out of scope / unchanged

- No change to gameplay logic, scoring, DDA, persistence schema beyond the new optional field, analytics events, or non-Knicks button styling.
- The `VisualThemeToggle` continues to switch the global active theme; switching mid-session no longer rewrites past attempts.
- Practice/freeplay result rendering is unaffected (it doesn't use the daily summary slides).

## Back-compat

Existing localStorage entries that lack `visualTheme` on an attempt will fall back to the current global theme so already-saved sessions still render.
