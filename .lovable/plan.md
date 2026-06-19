Update the FIFA theme's daily flag roster in `src/components/FifaOverlay.tsx`.

## What
Replace the existing `currentDayFlags` array entries with the 8 new team flag URLs for tomorrow:

1. https://flagcdn.com/w320/au.png
2. https://flagcdn.com/w320/us.png
3. https://flagcdn.com/w320/gb-sct.png
4. https://flagcdn.com/w320/ma.png
5. https://flagcdn.com/w320/br.png
6. https://flagcdn.com/w320/ht.png
7. https://flagcdn.com/w320/tr.png
8. https://flagcdn.com/w320/py.png

Because only 8 URLs are supplied, the 9th chromatic slot will automatically fall back to the filler image (existing behavior in `getFifaImageMap`).

## Unchanged
- White anchor → Golden Cup
- Black anchor → Soccer Ball
- Flag positioning rules (`jo.png` → `object-left`, `qa.png` → `object-[30%_center]`, all others → `object-center`)
- Date-seeded shuffling logic
- No other UI, game logic, or styles affected