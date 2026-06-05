In `src/pages/Index.tsx`, conditionally switch five action buttons to Knicks blue (`#006BB6`) when `knicksMode` is true, keeping existing `bg-primary` styling for all other themes:

1. **"I'm ready" button** (line ~1213) — observation phase
2. **"Verify" button** (line ~1226) — recall phase
3. **"Next Level" button** (line ~1468) — freeplay result, correct
4. **"Try Again" button** (line ~1472) — freeplay result, incorrect
5. **"Next Round / Try Again" button** (line ~1480) — daily result, can continue

All buttons currently use `bg-primary hover:bg-primary/90`. In Knicks mode they will use `bg-[#006BB6] hover:bg-[#005a9e] text-primary-foreground`. No game logic, other UI, or non-Knicks styles are affected.