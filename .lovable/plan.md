## Fix Jordanian flag cropping in FIFA grid

### Problem
The Jordanian flag (`jo.png`) has a star on its left side that gets cropped out because `object-cover` crops from the center by default.

### Solution
Update the flag image rendering in `src/components/FifaOverlay.tsx` to conditionally adjust the `object-position` class:

- If the flag URL includes `jo.png` → apply `object-left` so the star remains visible.
- For all other flags → apply `object-center` to keep the flag perfectly centered.

### Changes
**File: `src/components/FifaOverlay.tsx`** (flag rendering block, lines 115–123)

Replace the single static class string for flag images with a conditional expression that appends `object-left` or `object-center` based on the URL. The existing `w-full h-full rounded-full object-cover border border-gray-200` base classes remain unchanged.

No other components, schedules, or anchor mappings are affected.
