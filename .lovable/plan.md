Replace the Australian flag URL with Jordan's flag URL in the FIFA overlay.

## What will change
- File: `src/components/FifaOverlay.tsx`
- Update the first entry of the `currentDayFlags` array from `https://flagcdn.com/w320/au.png` to `https://flagcdn.com/w320/jo.png`.

## What stays the same
- All other 7 flag URLs remain unchanged.
- White (Cup) and Black (Ball) anchors remain unchanged.
- Flag slot mapping, object-position rules, shuffle logic, and all other game behavior remain unchanged.