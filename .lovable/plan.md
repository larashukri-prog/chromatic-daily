Replace the 8 flag URLs in the `currentDayFlags` array inside `src/components/FifaOverlay.tsx` with the new team flags provided by the user. The White→Cup and Black→Ball anchor mappings remain untouched.

**New flags (in order):**
- France (fr)
- Senegal (sn)
- Iraq (iq)
- Norway (no)
- Argentina (ar)
- Algeria (dz)
- Austria (at)
- Jordan (jo)

**Technical details:**
- File: `src/components/FifaOverlay.tsx`
- Target: `currentDayFlags` array (lines 6-15)
- Keep `cup.png.asset.json`, `ball.png.asset.json`, and `filler.png.asset.json` references unchanged.
- The `getFifaImageMap` deterministic shuffle will distribute these new flags across the 9 chromatic slots as before.