## Goal
Replace the 7 daily FIFA flag URLs in `FifaOverlay.tsx` with the new teams provided for tomorrow.

## Changes

### `src/components/FifaOverlay.tsx`
Update `currentDayFlags` array (lines 5–12):

Old:
- pt.png, uz.png, gb-eng.png, gh.png, pa.png, hr.png, co.png

New:
- ch.png (Switzerland)
- ca.png (Canada)
- ba.png (Bosnia and Herzegovina)
- za.png (South Africa)
- ma.png (Morocco)
- br.png (Brazil)
- kr.png (South Korea)

No special `object-position` overrides are needed for any of the new flags. All other logic (date-seeded shuffle, slot mapping, filler fallback) remains unchanged.