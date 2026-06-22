## Plan

Fix the FIFA flag rendering regression by making the flag mapping stable between the color picker and the game grid.

### What is wrong
- The picker was wrapped with the full 6-color FIFA palette, so every picker chip gets a flag.
- The game grid is wrapped with only the current stage colors, so the same hex can map differently—or not map at all—after placement.
- Result: a flag looks valid in the picker, but the placed slot can render as a white circle.

### Changes
1. Update `FifaOverlay` / `getFifaImageMap` so flag assignment is deterministic by the canonical 6 color slots, not by whatever subset a caller provides.
2. Keep `activeHexes` only as an optional visibility/filter hint where needed, without changing which flag belongs to which color hex.
3. Ensure Stage 1 still has 3 active flags in the board, while picker chips and placed grid slots use the same hex-to-flag mapping.
4. Do not alter CSS layout, game progression, saved state, or core game phases.

### QA
- Verify FIFA mode recall: select each picker flag and place it into a slot; the slot should show the same flag, not a blank white circle.
- Verify Stage 1 board still shows flags for all active colors.