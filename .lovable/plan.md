
# Chromatic Daily — 3x2 Grid + 3-Stage Progression Refactor

## Goal
Replace the weekday-scaling 3x3 model with a fixed 3x2 grid and a 3-stage daily progression. All visual styles (colors, patterns, shapes, FIFA), CSS, animations, onboarding copy structure, theme toggle, and accessibility behavior stay byte-identical aside from the cell count and difficulty wording. Daily-seed determinism, win/loss history, and streak logic are preserved. Practice mode also adopts the new 3x2 grid.

## New game model (Daily)

Each day = 3 stages, one attempt per stage with the rules below.

```text
Stage 1: 3 elements
  solved -> Stage 2
  failed -> regenerate Stage 1, still 3 elements

Stage 2: 5 elements
  solved -> Stage 3
  failed -> Stage 2b (4 elements)
    Stage 2b solved -> Stage 3
    Stage 2b failed -> regenerate Stage 2b until solved

Stage 3: 6 elements (fills the 3x2 grid)
  solved -> Daily WIN -> Daily Summary
  failed -> Daily LOSS -> Daily Summary (immediately)
```

The "3 games played" map to the three stages. Daily Summary shows one card per stage reflecting its final attempt. Share text emits three 3x2 emoji blocks.

## Determinism (daily seed)

Existing `dayNumber` seed stays canonical. Per-puzzle seeds:

```text
baseSeed       = dailySeed
stage1 seed n  = baseSeed + 1_000 + n * 7919
stage2 main    = baseSeed + 2_000
stage2b seed n = baseSeed + 2_500 + n * 7919
stage3 seed    = baseSeed + 3_000
```

Every user worldwide sees the same Stage 1, same regeneration sequence, same Stage 2 / 2b / Stage 3. No wall-clock RNG. Anchors (Black/White) remain in the pool so the FIFA theme keeps Cup/Ball. `getNonAdjacentPositions` is adapted to 3x2 adjacency.

## Files to change

### `src/lib/game.ts`
- `GRID_SIZE = 6`, replace every hardcoded `9` / `Array(9)` with `GRID_SIZE`.
- New 3x2 adjacency map (each cell has up to 5 neighbors incl. diagonals) used by `getNonAdjacentPositions`.
- Remove weekday color scaling. Add:
  ```ts
  export type StageId = 1 | 2 | 3;
  export const STAGE_COLOR_COUNTS = { 1: 3, 2: 5, '2b': 4, 3: 6 } as const;
  export function generateStageSolution(stage: StageId | '2b', regenIndex = 0)
  ```
  Old `generateSolution` / `generateSolutionDDA` become thin wrappers so freeplay keeps compiling; daily flow uses `generateStageSolution`.
- `MAX_ROUNDS` stays exported (=3) but means "3 stages".
- New persisted shape with migration from legacy `rounds[]`:
  ```ts
  interface StageAttempt { grid; isCorrect; solution; visualTheme?; recallMs?; }
  interface StageRecord  { stage: 1|2|3; substage: 'main'|'2b'|null;
                           regenIndex: number; attempts: StageAttempt[]; solved: boolean; }
  interface StoredData   { lastPlayed; currentStreak; maxStreak;
                           stages: StageRecord[]; finished: boolean; }
  ```
  `loadData()` migrates old `{rounds:[…]}` so streak counters survive.
- `getCurrentRoundInfo` -> `getCurrentStageInfo` returning `{ stage, substage, regenIndex, finished, stages }`, with a back-compat alias mapping `roundIndex = stage - 1`.
- `saveRoundAttempt` -> `saveStageAttempt(stage, substage, regenIndex, isCorrect, playerGrid, solution, theme, recallMs)`. Streak rules unchanged: increment on first daily finish today AND Stage 3 solved; reset otherwise. `finished = stage3.solved || stage3 attempted-and-failed`.
- `generateShareText` rewritten: three 3x2 blocks labeled `Stage 1/2/3`; header line `Stages: 3 / 5 / 6` (or `3 / 4 / 6` if dropped to 2b).
- `getResultMessage` reworked for regen / drop-down / game-over flow.

### `src/components/GameGrid.tsx`
- Keep `grid-cols-3`; render `GRID_SIZE` cells → naturally 3x2.
- Adjust container max-width only if tiles look wrong (likely keep as-is).
- All overlays (`PatternOverlay`, `ShapeOverlay`, `FifaOverlay`), borders, glow, verifying animation untouched.

### `src/components/FifaOverlay.tsx`
- No change. Mapping is hex-keyed; with 6 cells per puzzle a deterministic subset of flags/anchors renders.

### `src/pages/Index.tsx`
- Replace `roundIndex` / `attemptInRound` state with `stage`, `substage`, `regenIndex`.
- Verify-handler transitions per the model above. Stage 3 fail immediately opens Daily Summary.
- Swap `generateSolution(roundIndex)` / `generateSolutionDDA` daily calls for `generateStageSolution(stage|substage, regenIndex)`. Freeplay path keeps `generateSolutionDDA`.
- Status bar, turn tracker, onboarding text and the "Daily Scaling" explainer rewritten to describe Stage 1 (3) → Stage 2 (5, falls back to 4) → Stage 3 (6).
- Analytics: keep event names; send `stage` and `substage` (also mirror into existing `round_number` for dashboard continuity).
- Result modal behavior (non-dismissible, 2s auto-transition) unchanged.

### `src/components/DailySummary.tsx` and `src/components/SessionReport.tsx`
- Iterate `stages` instead of `rounds`. Card per stage: stage number, tile count actually played (3 / 5 or 4 / 6), solved/failed, recall time. Carousel + styling identical.
- Metrics:
  - Consistency = solved stages / 3.
  - Peak Complexity = max tile count among solved stages.
  - Tiles Decoded = correctly placed tiles across each stage's final attempt.
  - Reflex Avg = mean `recallMs` over stages with a recorded time.

### `src/lib/freeplay.ts` + Practice rendering (per user feedback)
- Change practice grid to 6 cells (3x2). Update the random color count band from 2–5 to **2–4** so it stays meaningful within a 6-cell board, and ensure `Array(GRID_SIZE)` is used everywhere practice constructs a solution.
- Lavender background, DDA bypass, no-persistence behavior unchanged.
- `GameGrid` is shared, so practice automatically renders 3x2 once `GRID_SIZE = 6`; we just verify Practice's solution arrays are length 6.

## Out of scope (explicitly unchanged)
Color palette, FIFA flag list, patterns, shapes, animations, glassmorphism, fonts, modal styling, timer behavior, "Ready" / Speed Star flow, PostHog event names, error boundary, accessibility patterns/strokes, onboarding modal structure (only copy referring to weekday scaling is updated).

## Verification
1. Build passes (auto).
2. Playwright on `localhost:8080`: 3x2 grid renders in Daily and Practice; Stage 1 win → Stage 2 (5 tiles); Stage 1 fail regenerates with different tiles; Stage 2 fail drops to 4 tiles; Stage 3 fail opens Daily Summary; share text contains 3 blocks of two 3-emoji rows.
3. Reload mid-run rehydrates current stage / substage / regenIndex from localStorage.
4. Streak: solving Stage 3 today after solving yesterday increments streak; failing Stage 3 resets it.
