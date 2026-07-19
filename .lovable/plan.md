The MTA subway bullets currently render as an SVG that is only 86% of the slot size, leaving a transparent (white) ring around the colored circle. The circle itself has a radius of 48, so it also stops short of the SVG boundary.

Changes:
1. Update `src/components/MtaOverlay.tsx`
   - Set the SVG to fill 100% of its slot container (remove the 86% sizing).
   - Increase the circle radius from 48 to 50 so the color reaches the edge of the slot, and optionally push it slightly past the viewBox to create a subtle bleed/overlap.
   - Keep the white character centered and unchanged.

2. Verify in preview
   - Take a screenshot of the game grid in MTA mode to confirm the bullets now sit flush with no visible white frame and the colors bleed to the slot boundaries.

No game logic, state, or history changes. Only the MTA overlay SVG geometry changes.