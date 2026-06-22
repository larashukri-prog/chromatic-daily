## Bug 1 — FIFA flag rendering on Stage 1

### Root cause
`getFifaImageMap` in `src/components/FifaOverlay.tsx` builds the hex→flag map against the full 6‑color chromatic palette (`FLAG_SLOT_HEXES`) using a date‑seeded shuffle, then fills the first N positions of that shuffled order with flags and the rest with the `filler.png` placeholder (the "?" tile).

The active stage palette is also chosen by a separate date‑seeded shuffle in `generateStageSolution` (`src/lib/game.ts`). The two shuffles are independent, so when Stage 1 uses only 3 of the 6 chromatic hexes, those 3 active hexes only randomly overlap with the first N flag‑bearing slots. The non‑overlapping active hexes resolve to `{ kind: 'filler' }` and render as the question‑mark placeholder.

This is why "1 of 3" (or however many happen to collide) shows a flag and the others fall back.

### Fix
Map flags onto the **active stage palette**, not the global chromatic palette.

1. Add a tiny React context `FifaPaletteContext` (new file `src/components/FifaPaletteContext.tsx`) that exposes `{ activeHexes: string[] }`. Default is `FLAG_SLOT_HEXES` so existing previews (Settings carousel, etc.) keep working.
2. In `src/pages/Index.tsx`, wrap the daily game tree in `<FifaPaletteProvider value={activeColors.map(c => c.hex.toUpperCase())}>` so the provider updates whenever the stage palette changes.
3. In `FifaOverlay.tsx`:
   - Extend `getFifaImageMap(date, activeHexes?)`. When `activeHexes` is provided, deterministically shuffle **that array** and assign flags 1:1 to those hexes (no filler — there are always ≥ active count flags available). For any chromatic hex NOT in `activeHexes`, omit it from the map.
   - In `FifaOverlay`, read `activeHexes` from context and pass it to `getFifaImageMap`. Keep current `colorHex.toUpperCase()` lookup.
4. For previews/pickers that intentionally iterate all 6 chromatic colors (color picker in Index, `DailySummary` solution view), wrap those subtrees in a provider whose `activeHexes = FLAG_SLOT_HEXES` so every chip continues to show a flag.

No CSS/layout changes; no edits to core game state.

## Bug 2 — Empty 3rd summary card on the daily results modal

### Root cause
`DailySummary` builds its 3 slides in `src/components/DailySummary.tsx` (lines 64‑80) by doing `rounds.find(r => r.roundIndex === i)` for `i = 0..maxRounds-1` and rendering the **last attempt** of that round.

The adaptive 3‑stage state machine in `src/lib/game.ts` collapses multiple stages onto the same `roundIndex` (via `stageNumber`):
- `stage1` → roundIndex 0
- `stage1b`, `stage2` → roundIndex 1
- `stage1c`, `stage2r`, `stage3` → roundIndex 2

So on the adaptive path `A1✗ → A2✓ → A3✓` (stages `stage1`, `stage1b`, `stage2`), all three attempts land in `roundIndex` 0 and 1 — `roundIndex 2` is never populated. Slide 3 finds no round, renders `UnplayedSlide`, and shows an empty 3rd card. Worse: slide 2 only shows the **last** attempt for roundIndex 1, hiding either `stage1b` or `stage2`.

This is the exact same shape as the share‑text bug we already fixed by flattening across attempts. The summary carousel was missed.

### Fix
Rewrite the slide builder in `DailySummary.tsx` to be attempt‑driven instead of round‑driven, mirroring `generateShareText`:

1. Build `const allAttempts = rounds.flatMap(r => r.attempts.map(a => ({ attempt: a, roundSolution: r.solution })))`. The push order of `rounds` and `attempts` is chronological, so this yields A1, A2, A3 in order.
2. For `i = 0..MAX_ROUNDS-1`:
   - If `allAttempts[i]` exists: push `{ attemptGrid: a.grid, solution: a.solution ?? roundSolution, isCorrect: a.isCorrect, roundIndex: i, visualTheme: a.visualTheme }`.
   - Else: push `null` so `UnplayedSlide` renders (covers genuine early‑abandon cases).
3. `totalSlides` stays `maxRounds` (always 3). Header still reads `Attempt {i+1} of 3`.

No changes to storage, `stageNumber`, `RoundData`, or `saveRoundAttempt` — the data is already complete; only the read path in the summary was misaligned.

## Files touched
- `src/components/FifaOverlay.tsx` — extend `getFifaImageMap`, read context.
- `src/components/FifaPaletteContext.tsx` — new file (context + provider).
- `src/pages/Index.tsx` — wrap daily tree in provider; wrap color‑picker preview in a "full palette" provider.
- `src/components/DailySummary.tsx` — flatten attempts for slide construction; wrap solution‑preview subtree in "full palette" provider so the solution view still shows all flags.

No CSS, layout, or game‑state changes.