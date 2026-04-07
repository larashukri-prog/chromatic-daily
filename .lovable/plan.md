

## Remove Countdown from freeplayNext and freeplayRetry

### Problem
Currently, the 3-2-1 countdown fires every time the player moves to the next puzzle or retries after a failure in Practice Mode. It should only appear once — when "Start Practice Mode" is first tapped.

### Changes to `src/pages/Index.tsx`

**`freeplayNext` (~line 467)**: Replace `startCountdown(() => startFreePlayObservation(puzzle))` with a direct call to `startFreePlayObservation(puzzle)` (wrapped in a short `setTimeout` like the daily mode uses, ~50ms).

**`freeplayRetry` (~line 478)**: Replace `startCountdown(() => { ... })` with the same observation-start logic inline (no countdown wrapper). Keep the existing timer/phase logic, just remove the countdown wrapping.

**`startFreePlay` (~line 249)**: Keep the countdown here — this is the only entry point that should have it.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove `startCountdown` wrapping from `freeplayNext` and `freeplayRetry` |

