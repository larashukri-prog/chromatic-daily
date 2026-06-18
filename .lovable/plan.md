### Qatar Flag Positioning Fix

**Problem:** The Qatar flag (`qa.png`) currently uses `object-center`, which shows only a tiny sliver of the white stripe. Using `object-left` (like Jordan) would show too much white and overwhelm the maroon.

**Goal:** Show roughly a quarter of the circle as white — enough to be clearly visible and recognizable, while keeping the maroon dominant.

**Approach:** Add a custom `object-position` for Qatar only, sitting between `object-center` and `object-left`.

**Changes in `src/components/FifaOverlay.tsx`:**
- Replace the existing `object-left` / `object-center` ternary with a three-case lookup:
  - `jo.png` → `object-left` (unchanged)
  - `qa.png` → `object-[30%_center]` (custom Tailwind arbitrary value, shifting the focal point to reveal ~25% white)
  - All other flags → `object-center` (unchanged)
- No other game logic, UI, or styles will be touched.

**Verification:** A quick visual check in the preview to confirm the Qatar flag slot shows a balanced white/maroon crop.