## Goal

Replace "Reflex Avg" in the Share Result text with a new "Visual Style" line listing every visual style the user actually played during today's session, in encounter order, deduped. The 4th option's label is pulled dynamically (currently "Knicks", future "FIFA", etc.) from the toggle's option definitions, not hard-coded.

## Source of truth for played styles

Per-attempt `visualTheme` is already persisted on each `RoundAttempt` (done in the previous change). The set of styles played = unique `visualTheme` values across `savedRounds` → `attempts`, preserved in attempt order. This is more accurate than a separate runtime tracker and survives reloads on the summary screen.

## Changes

### 1. `src/hooks/useAccessibility.tsx`
- Export a `VISUAL_THEME_OPTIONS` array (the existing `[{ value, label }]` list currently duplicated in `VisualThemeToggle`) as the single source of truth for theme value → display label.
- Export a small helper `getVisualThemeLabel(theme: VisualTheme): string` that looks it up.

### 2. `src/components/VisualThemeToggle.tsx`
- Import `VISUAL_THEME_OPTIONS` from the hook instead of defining `OPTIONS` locally. No behavior change.

### 3. `src/lib/game.ts` — `generateShareText(...)`
- Extend the `metrics` argument with `visualStyles?: string` (already-formatted comma-separated label string, e.g. `"Colors, Knicks"`).
- Remove the `⚡ Reflex Avg: …` line entirely.
- Keep `reflexAvg` in the metrics type for now (still consumed by the on-screen summary), but stop emitting it in share text.
- Insert the visual-style line **immediately before** `⭐️ Speed Stars: …`, only when `visualStyles` is non-empty:

  ```text
  Solved in X/3 attempts
  🎨 Visual Style: Colors, Knicks
  ⭐️ Speed Stars: N
  🎯 Consistency: N%
  👑 Peak: …
  🧩 Decoded: N tiles
  ```

  (Emoji prefix `🎨` chosen to match the existing emoji style of the other metric lines. The user's example showed a bare string — happy to drop the emoji if preferred; flagging as a small choice.)

### 4. `src/pages/Index.tsx` — `buildShareMetrics()` / `share()` / `shareWhatsApp()`
- Build `visualStyles` from `savedRounds`:
  1. Flatten attempts in order.
  2. Collect each `attempt.visualTheme` (skip `undefined` for back-compat / fall back to current global theme only if the entire list is empty).
  3. Dedupe preserving first-seen order (`Array.from(new Set(...))`).
  4. Map each value to its label via `getVisualThemeLabel(...)` so the 4th option's display name comes from `VISUAL_THEME_OPTIONS` automatically.
  5. Join with `", "`.
- Pass the result on the `metrics` object to `generateShareText(...)` (both `share` and `shareWhatsApp` already share `buildShareMetrics()`).

## Out of scope / unchanged

- On-screen Daily Summary metrics block (`Reflex Avg` row in `DailySummary.tsx`) — untouched, this change is share-text only as requested.
- Practice-mode `SessionReport` share card — uses its own builder, not the daily share text; no change.
- No new persistence schema beyond what's already stored (`visualTheme` on each attempt).
- No gameplay, scoring, DDA, analytics, or button styling changes.

## Back-compat

Attempts saved before per-attempt `visualTheme` existed will be missing the field. They're skipped from the styles list; if every attempt is missing it, the share text falls back to the currently-active global theme so the line is still present and non-empty.
