## Plan

### What
Swap the six flag URLs in `src/components/FifaOverlay.tsx` so tomorrow's matches display the new team flags.

### Current URLs (to be replaced)
```
https://flagcdn.com/w320/jo.png
https://flagcdn.com/w320/dz.png
https://flagcdn.com/w320/fr.png
https://flagcdn.com/w320/iq.png
https://flagcdn.com/w320/ar.png
https://flagcdn.com/w320/sn.png
```

### New URLs (in order, keeping the same 6-slot anchor)
```
https://flagcdn.com/w320/pt.png
https://flagcdn.com/w320/uz.png
https://flagcdn.com/w320/gb-eng.png
https://flagcdn.com/w320/gh.png
https://flagcdn.com/w320/pa.png
https://flagcdn.com/w320/hr.png
```

### Technical details
- Only `src/components/FifaOverlay.tsx` is edited.
- The `currentDayFlags` array order is preserved so the daily seeded shuffle mapping to color slots stays deterministic.
- The `objectPosition` special-casing (jo/qa/tr) will be reviewed: none of the new codes match those strings, so all new flags will default to `object-center`. If any flag looks off-center when rendered, an additional position rule can be added.

### Not in scope
- No changes to `fifaSchedule.ts`, game logic, DDA, or color mapping.
- No styling or layout changes beyond the URL swap.