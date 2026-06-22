## Goal
Make the 3 daily attempts adaptive so failures don't feel punishing: failure keeps difficulty flat, success ramps it up.

## New progression rules

| State entering attempt | Attempt 1 | Attempt 2 | Attempt 3 |
|---|---|---|---|
| A1✓, A2✓ | 3 | 5 | 6 |
| A1✓, A2✗ | 3 | 5 | 5 (different puzzle) |
| A1✗, A2✓ | 3 | 3 (different style) | 5 |
| A1✗, A2✗ | 3 | 3 | 3 |

Rule of thumb: **win → step up; loss → repeat the same tier with a fresh puzzle**.

## Changes

### 1. `src/lib/game.ts`
- Add new stage keys: `stage1b` (3 colors), `stage1c` (3 colors, third attempt after two losses), `stage2r` (5 colors, repeat). Retire `stage2b` (4-color fallback) — no longer used.
- Update `STAGE_COLOR_COUNTS`, `STAGE_SEED_OFFSETS`, `stageNumber`, and `stageToRoundIndex` accordingly.
- Add helper `getNextStage(currentStage, wasCorrect)`:
  - `stage1` + win → `stage2` (5)
  - `stage1` + loss → `stage1b` (3, fresh puzzle)
  - `stage2` + win → `stage3` (6)
  - `stage2` + loss → `stage2r` (5 repeat, fresh puzzle)
  - `stage1b` + win → `stage2` (5)
  - `stage1b` + loss → `stage1c` (3, fresh puzzle)
  - `stage1c`, `stage2r`, `stage3` → terminal
- Update `getStageResultMessage` for the new transitions.
- Share text already uses `Attempt N` labels — no copy change needed; tile-count differences just show in emoji grid width.

### 2. `src/pages/Index.tsx`
- Replace the static `currentStageKey` derivation (~lines 220–223) with logic that derives the stage from prior rounds' outcomes in `data.rounds`.
- Replace hardcoded `nextStage` logic (~684–690 and ~724–746) with `getNextStage(currentStageKey, correct)`.
- Update `isFinal` / `canContinue`: daily ends after the 3rd attempt regardless of stage key (use `roundIndex === 2`, not `currentStageKey === 'stage3'`).
- Resume logic (~282–290) walks `data.rounds` in order and applies `getNextStage` to determine which stage to load.

### 3. Out of scope
- DDA boost, practice mode, share-card layout, summary carousel structure, About modal copy, analytics. Attempt labels in summary/share already read "Attempt 1/2/3" and stay correct.
- "Different style" already comes from per-puzzle `visualTheme` + regen seed — no extra theming work.

## Verification
Local play-through of all four branches via `?reset`, confirming color counts match the table and the summary carousel renders the right tile grids.
