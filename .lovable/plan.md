

## Remove "View Result" Button in Practice Mode

### Problem
When a guess fails in Practice Mode, there's a brief ~800ms window where a "View Result" button flashes on screen before the result dialog auto-opens. This button is unnecessary.

### Solution
Remove the freeplay-specific "View Result" button from `src/pages/Index.tsx` (lines 821-829). The result dialog already auto-opens after the shake animation, so this button serves no purpose.

### File: `src/pages/Index.tsx`
- Delete the block at lines 821-829 that renders the "View Result" button when `phase === 'result' && isFreeplay && !showResult`

