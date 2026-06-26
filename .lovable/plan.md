## Goal
Replace the 7 flag URLs in the FIFA theme overlay with the new teams playing tomorrow.

## What will change
**File:** `src/components/FifaOverlay.tsx`

The `currentDayFlags` array will be updated from:
- cw, ec, de, tn, us, uz, tr

To:
- no, fr, sa, es, eg, iq, be

All other logic — date-seeded shuffling, slot mapping, object-position overrides, filler assets — remains exactly the same.