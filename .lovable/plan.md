# Fix: No more duplicated Cup/Ball, add filler image

## Problem
With 8 flags today, the current logic places Cup OR Ball into the 9th chromatic slot — but the White anchor already renders the Cup and the Black anchor already renders the Ball. Result: the same Cup (or Ball) image shows up twice in the 3×3 grid. The user wants Cup and Ball to appear **only** at their anchor positions (White → Cup, Black → Ball), never anywhere else.

## Solution

### 1. Upload the attached soccer-ball image as a new "filler" asset
- Upload `Screen Shot 2026-06-14 at 6.54.46 PM.png` via `lovable-assets` to `src/assets/fifa/filler.png.asset.json`.
- This is a distinct, separate image used **only** when a chromatic slot has no flag assigned (it is NOT the anchor Ball).

### 2. New strict slot rules in `FifaOverlay.tsx`
Priority order, with no overlap between anchors and chromatic slots:

- **Anchors (fixed, never change):**
  - White (`#FFFFFF`) → Cup
  - Black (`#000000`) → Ball
- **Chromatic slots (9 colored hexes):**
  - Filled in date-seeded random order with `currentDayFlags` URLs (priority).
  - Any remaining unfilled chromatic slot → the new `filler.png` image.
  - **Cup and Ball are never placed in chromatic slots.**

This means:
| N flags | Chromatic slot contents |
|---|---|
| 9+ | 9 flags |
| 8  | 8 flags + 1 filler |
| 7  | 7 flags + 2 fillers |
| ≤6 | N flags + (9−N) fillers |
| 0  | 9 fillers |

The filler image can repeat across slots (it is not the Cup/Ball, so it does not violate the "never duplicate the World Cup" rule). Only Cup and Ball are unique-per-grid.

### 3. Code changes (`src/components/FifaOverlay.tsx`)
- Import new `fillerAsset` from `@/assets/fifa/filler.png.asset.json`.
- Extend `SlotEntry` with `{ kind: 'filler' }`.
- Rewrite `getFifaImageMap`:
  - Keep White → cup, Black → ball.
  - Shuffle the 9 chromatic hexes by date.
  - Place flags into the first N shuffled slots.
  - Fill all remaining chromatic slots with `{ kind: 'filler' }`.
  - Remove the N=8 / N=7 Cup/Ball insertion logic entirely (this was the bug).
- In the renderer, add a `filler` branch that renders the filler image with the same circular styling used for flags (or `object-contain p-1` like Cup/Ball — see open question).
- Keep `dateSeededShuffle` for slot order; remove its use for picking Cup/Ball.

### 4. Out of scope
Game mechanics, colors, daily flag list, anchor mapping rule (White=Cup, Black=Ball stays), Cup/Ball assets.

## Open question
Should the new filler image be rendered with the **flag style** (`w-full h-full rounded-full object-cover border border-gray-200` — fills the circle, cropped) or the **Cup/Ball style** (`object-contain p-1` — floats inside the colored circle showing the chromatic background)? Defaulting to the **Cup/Ball style** so the filler reads as a "ball-like" decorative element sitting on the slot color, matching how the anchors look. Tell me if you'd rather it fill the circle edge-to-edge.
