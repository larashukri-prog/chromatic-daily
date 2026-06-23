## Goal
Ensure the picker renders all **7 chromatic buttons (Red, Orange, Yellow, Teal, Purple, Lime, Pink)** at every stage (1, 2, and 3) so each round becomes pure recall against an over-sized pool, not elimination. Grid stays 6 slots.

## Findings
After the previous patch:
- `pickerColors = COLORS` already iterates the full 7-color array unconditionally — there's no per-stage filtering of picker buttons.
- `generateStageSolution` already draws the stage's color count from the 7-pool for every stage (`shuffled.slice(0, colorCount)`), so distractors apply to stages 1 and 2 too.

So the behaviour the user is asking for is **already implemented in code** — but two small things can still make it render inconsistently and are worth fixing in this pass:

## Changes

### 1. `src/pages/Index.tsx`
- Update the stale comment on line 247: `// Picker shows the six chromatic colors only` → `// Picker shows all seven chromatic colors at every stage — pool > grid forces recall over elimination.`
- No logic change to `pickerColors`.

### 2. Verification pass (no code change unless gap found)
In build mode, launch the preview and confirm via a quick Playwright check that:
- Stage 1 (3-color puzzle): picker renders 7 buttons, wrapped 4 + 3 on mobile width.
- Stage 2 (5-color puzzle): picker renders 7 buttons.
- Stage 3 (6-color puzzle): picker renders 7 buttons.
- FIFA mode shows the Colombia flag on the pink slot at every stage.
- Patterns mode shows checkerboard on the pink slot at every stage.
- Shapes mode shows the droplet icon on the pink slot at every stage.

If any of those render fewer than 7, trace the cause (likely a stale localStorage `activeColors` snapshot from before the palette grew) and either:
- guard the picker so it always falls back to `COLORS` (already the case), or
- bump a palette-version key in the persisted daily state so old 6-color snapshots are invalidated cleanly.

## Out of scope
- Grid size (stays 2×3 / 6 slots).
- Stage color counts (stay 3 / 5 / 6).
- Scoring, DDA, badges, share card.
