

## Remove Anti-Cheat Overlay

Remove the cheat detection system that shows jarring overlay messages during the observation phase.

### Changes in `src/pages/Index.tsx`

1. **Remove state variables** (lines ~78-79): `cheatDetected`, `cheatMessage`
2. **Remove `CHEAT_MESSAGES` array** (lines ~153-158)
3. **Remove `triggerCheatOverlay` callback** (lines ~160-163)
4. **Remove the `useEffect` for visibility/blur detection** (lines ~165-187)
5. **Remove `setCheatDetected(false)` from `startObservation`** (line ~198)
6. **Remove the anti-cheat overlay JSX** (lines ~747-761, the `AnimatePresence` block with the 🚫 emoji and message)
7. **Remove `!cheatDetected` condition** from the "I'm ready" button (line ~873) — just check `phase === 'observation'`

No other files affected.

