## What
Replace the 7 flag URLs in `src/components/FifaOverlay.tsx` with the new set for tomorrow.

## How
- Update the `currentDayFlags` array (lines 5-13) from the existing 7 URLs to:
  1. https://flagcdn.com/w320/cw.png
  2. https://flagcdn.com/w320/ec.png
  3. https://flagcdn.com/w320/de.png
  4. https://flagcdn.com/w320/tn.png
  5. https://flagcdn.com/w320/us.png
  6. https://flagcdn.com/w320/uz.png
  7. https://flagcdn.com/w320/tr.png

## Notes
- The `object-position` special-case logic for `tr.png` already exists (line 106) and will continue to work since `tr.png` remains in the list.
- No other file changes are required. The date-seeded shuffle, slot mapping, filler fallback, and overlay rendering all remain unchanged.