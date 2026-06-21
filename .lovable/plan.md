# Plan: Update tomorrow's FIFA flag URLs

## Goal
Swap the current FIFA World Cup theme flag URLs in `FifaOverlay.tsx` with the 6 new team flag URLs for tomorrow, preserving the existing image-position anchors.

## What will change
1. `src/components/FifaOverlay.tsx`
   - Replace the `currentDayFlags` array entries with the 6 new URLs in the order provided:
     1. `https://flagcdn.com/w320/jo.png`
     2. `https://flagcdn.com/w320/dz.png`
     3. `https://flagcdn.com/w320/fr.png`
     4. `https://flagcdn.com/w320/iq.png`
     5. `https://flagcdn.com/w320/ar.png`
     6. `https://flagcdn.com/w320/sn.png`
   - Keep the existing `objectPosition` anchor logic for `jo.png` (`object-left`) and the placeholders for `qa.png` / `tr.png`. No new anchors are needed for `dz`, `fr`, `iq`, `ar`, or `sn`.

## What will not change
- `FLAG_SLOT_HEXES` and the deterministic date-seeded shuffle that maps flags to color slots.
- The filler image fallback for any slot without a flag.
- `fifaSchedule.ts` and the rest of the FIFA/theme logic.

## Verification
- Run a quick build/typecheck to ensure no syntax errors.
- Optionally inspect a preview tile to confirm one of the new flags renders (e.g., `jo.png`).

## Source of truth
User-provided flag URLs for tomorrow's fixtures, replacing the existing `currentDayFlags` values.