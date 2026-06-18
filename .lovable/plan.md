Update the `currentDayFlags` array in `src/components/FifaOverlay.tsx` with the 9 new flag URLs provided by the user for tomorrow's fixtures.

Changes:
1. Replace the existing 10 flag URLs in `currentDayFlags` with the 9 new URLs:
   - https://flagcdn.com/w320/co.png
   - https://flagcdn.com/w320/cz.png
   - https://flagcdn.com/w320/za.png
   - https://flagcdn.com/w320/ch.png
   - https://flagcdn.com/w320/ba.png
   - https://flagcdn.com/w320/ca.png
   - https://flagcdn.com/w320/qa.png
   - https://flagcdn.com/w320/mx.png
   - https://flagcdn.com/w320/kr.png

2. No logic changes required. The existing `jo.png` → `object-left` and all-other-flags → `object-center` positioning rules in the `FifaOverlay` component remain untouched. White and Black anchors (Cup and Ball) also remain unchanged.

3. The `getFifaImageMap` function already slices to `FLAG_SLOT_HEXES.length` (9), so 9 URLs is the correct count.