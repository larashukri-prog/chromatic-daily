# Metrics Upgrade: Consistency, Reflex Avg, Peak Complexity, Tiles Decoded

## Goal
Replace the current `Focus`/`Top Speed` pair with a richer 4-metric model that tells a more honest story of a session, then surface these everywhere a session ends (Practice report, Daily summary, share PNG, PostHog).

---

## 1. Data model — `SessionStats` (SessionReport.tsx + Index.tsx)

Extend the type with two new fields and rename one for clarity. Existing `bestSpeed` is dropped in favor of a list of correct-round times we can average.

New shape:
```ts
type SessionStats = {
  roundsPlayed: number;
  totalCorrect: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  // NEW
  correctTimes: number[];        // recallSeconds for each correct round
  tilesDecoded: number;          // cumulative correctly-placed tiles in successful rounds
  peakComplexity: {              // largest successful round in the session
    tiles: number;               // number of color tiles in that round (effectiveColorCount)
    seconds: number;             // recallSeconds for that round
  } | null;
};
```

Derived helpers (computed at render time, not stored):
- **Consistency** = `roundsPlayed ? round((totalCorrect / roundsPlayed) * 100) : 0` %  
  *(Note: rename uses `roundsPlayed` as the denominator — one verify per round in practice. Today's code already increments both `roundsPlayed` and `totalAttempts` together, so the value is identical; we'll standardize on `roundsPlayed` and drop `totalAttempts` from the type since it's redundant.)*
- **Reflex Avg** = average of the 3 smallest values in `correctTimes` (or all of them if fewer than 3). Returns `null` when `correctTimes` is empty.
- **Peak Complexity label** = `${peakComplexity.tiles} Tiles in ${peakComplexity.seconds.toFixed(1)}s` or `—` when null.
- **Tiles Decoded** = raw counter, displayed as integer.

## 2. Verify-time updates (`src/pages/Index.tsx`, `verify()` ~line 487)

In the freeplay branch, when a round is verified:

- Always push `recallSeconds` into `correctTimes` if `correct`.
- If `correct`, increment `tilesDecoded` by the count of `true` entries in `res` (i.e. correctly-placed tiles for that round — equal to `effectiveColorCount` on a perfect round, but using the array keeps it future-proof).
- If `correct` and `effectiveColorCount > (peakComplexity?.tiles ?? 0)`, set `peakComplexity = { tiles: effectiveColorCount, seconds: recallSeconds }`. Tie-break on equal tiles by keeping the faster time.
- Daily mode (non-freeplay branch) needs the same accounting so the Daily Summary can display the metrics — track it into a separate `dailyStats` state with the same shape, updated at lines ~524+ when a round resolves. Reset on new day alongside other daily resets.

## 3. Practice end-of-session report (`SessionReport.tsx`)

Replace the 4-tile grid with the new metrics. Keep the existing `StatCard` component, just swap inputs:

| Position | Icon | Label | Value |
|---|---|---|---|
| 1 | `Target` | Consistency | `${consistency}%` |
| 2 | `Zap` (Bolt) | Reflex Avg | `${reflexAvg.toFixed(2)}s` or `—` |
| 3 | `Crown` | Peak | `${peak.tiles} Tiles in ${peak.seconds.toFixed(1)}s` or `—` |
| 4 | `Brain` | Decoded | `${tilesDecoded}` |

Add `Crown` and `Brain` to the `lucide-react` imports; remove `Eye` and `Trophy` if no longer used. The "Wins" tile is removed (Consistency + Tiles Decoded now carry that signal). The Peak tile's value string is longer than the others — bump that single tile's value font size down one step (e.g. `text-base`) so it fits without wrapping at 420px width.

Update `getInsight()` to use the new metrics: trigger the "Elite reflexes" message off `reflexAvg < 1.0` instead of `bestSpeed`.

## 4. Daily Summary (`src/components/DailySummary.tsx`)

The component currently shows only the "focused for X seconds" + stars block at the bottom. Add a metrics block above that block — same minimal card style, 2x2 grid of small text rows (no big icons, to keep the summary calm):

```text
┌─────────────────────────────┐
│  CONSISTENCY     67%        │
│  REFLEX AVG      1.84s      │
│  PEAK            7 in 2.3s  │
│  DECODED         42 tiles   │
└─────────────────────────────┘
```

Pass the new `dailyStats` from `Index.tsx` into `DailySummary` via a new `stats` prop (typed identically to `SessionStats`). Keep the focus-seconds + stars card as-is below it.

## 5. Share PNG card (`SessionReport.tsx`, `handleShareCard`)

The PNG is rendered from the same `cardRef` as the on-screen report, so the new metrics will already appear in the snapshot. To honor the "no icons in PNG" constraint without changing the on-screen UI:

- Add an `isCapturing` class toggle on the four `StatCard` icons so they `display: none` while capturing (the spinner state already hides the buttons via the same pattern). The on-screen view is unchanged; only the PNG omits icons.
- Update labels to uppercase `CONSISTENCY` and `REFLEX AVG` only inside the snapshot — easiest path is to render the labels with the existing uppercase styling (`text-[10px] uppercase tracking-widest`) which already produces the requested look. So no extra logic needed; just confirm the strings in `<StatCard label="...">` are `Consistency`, `Reflex Avg`, `Peak`, `Decoded` (the CSS uppercases them).
- Update the WhatsApp `caption` string to use Reflex Avg instead of Peak speed:
  ```ts
  const reflex = reflexAvg ? `${reflexAvg.toFixed(2)}s` : '—';
  const caption = `My Chromatic Practice Stats ⚡️\nRounds: ${stats.roundsPlayed} · Consistency: ${consistency}% · Reflex: ${reflex}\n\nhttps://chromatic-daily.lovable.app`;
  ```

## 6. PostHog analytics (`src/pages/Index.tsx` ~lines 748–790)

Replace `best_speed` with `reflex_avg_seconds`, add `tiles_decoded`, `peak_complexity_tiles`, `peak_complexity_seconds`. Keep `longest_streak`. This keeps event schema honest with the new UI.

## 7. Cleanup

- Drop unused `totalAttempts` field once all reads are migrated to `roundsPlayed`.
- Remove `bestSpeed` references project-wide (`rg "bestSpeed"` should return empty after the change).
- Add a one-line memory note under `mem://features/...` describing the new metric definitions so future changes don't regress them.

---

## Files touched
- `src/components/SessionReport.tsx` — type, tiles, icons, caption, capture-time icon hiding
- `src/pages/Index.tsx` — `initialStats`, freeplay verify handler, daily verify handler, daily reset, PostHog payload, `DailySummary` prop wiring
- `src/components/DailySummary.tsx` — new `stats` prop + minimal 2x2 metrics block
- `mem://features/session-metrics` (new memory) + index update
