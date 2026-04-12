

## User-Paced "Ready" System with Speed Star

This feature replaces the auto-timer countdown during the observation phase with a user-controlled "I am ready" button, adds a "Speed Star" reward for fast players, and includes multi-sensory feedback (visual, audio, haptic).

### How It Works (Non-Technical)

- **Study at your pace**: Instead of the timer auto-advancing, you press "I am ready" when you've memorized the pattern.
- **Speed Star**: If you press "ready" before the old timer would have expired, you earn a gold star shown on your result card, plus a satisfying animation, sound, and vibration.
- **First-time players** still see the 3-2-1 countdown before the pattern reveals. Returning players get a smooth fade transition instead.

### Technical Changes

#### 1. `src/pages/Index.tsx` — Core Logic Changes

**Observation phase rework:**
- Remove the auto-timer interval that transitions to `recall` phase after duration expires.
- Keep the `CircularTimer` as a visual reference (it still counts down), but it no longer auto-transitions.
- Add an `observationStartTime` ref to track when observation began.
- Add `isSpeedRound` state (`boolean`, default `false`).
- When "I am ready" / "أنا جاهز" is pressed:
  - Calculate elapsed time vs `getObservationDuration()`.
  - If elapsed < duration, set `isSpeedRound = true`, trigger Star Pop animation, play chime, fire haptic.
  - Transition to `recall` phase.
- The timer still runs visually but reaching 0 does **not** auto-transition — user must click the button.

**Countdown logic (new vs returning user):**
- Check `localStorage.getItem('chromatic-has-played')` to distinguish new/returning users.
- New users: existing 3-2-1 countdown overlay before observation.
- Returning users: 500ms fade-out transition (use framer-motion opacity transition) before observation.
- Set `chromatic-has-played = true` in localStorage after first game start.

**Result card updates:**
- Pass `isSpeedRound` to the result dialog.
- If `isSpeedRound && isCorrect`, display a gold ⭐️ emoji above the trophy icon.

**Verify button:**
- Enable the "Verify" button as soon as any color is placed on the grid (i.e., `selectedCount > 0` instead of `selectedCount === effectiveColorCount`). *Note: re-reading the request — "Enable 'Check' button immediately upon slider interaction" — this likely means enable it once any placement happens, but keeping correctness requires all colors placed. I'll keep the existing `canVerify` logic unchanged since the game requires exact color count.*

**PostHog analytics:**
- Add `speed_bonus: isSpeedRound` to the existing `'Round Verified'` event capture.

#### 2. `src/pages/Index.tsx` — UI Changes

**"I am ready" button (during observation phase):**
```tsx
{phase === 'observation' && !cheatDetected && (
  <Button onClick={handleReady} className="w-full rounded-xl h-12 ...">
    I am ready
  </Button>
)}
```

**Star Pop animation (center of screen):**
- An `AnimatePresence` block that renders a gold ⭐️ emoji with:
  - `scale: [0.3, 1.5, 0]` over 400ms
  - `opacity: [0, 1, 0]` over 400ms
- Triggered by a `showStarPop` state, auto-clears after 400ms.

**Result card gold star:**
```tsx
{isSpeedRound && isCorrect && (
  <span className="text-2xl">⭐️</span>
)}
```

#### 3. Audio & Haptic Feedback (inline in `Index.tsx`)

**Audio — Web Audio API chime (no external files):**
```typescript
function playSuccessChime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880; // A5
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}
```

**Haptic — Vibration API:**
```typescript
if (navigator.vibrate) navigator.vibrate(50);
```

#### 4. New State & Refs Summary

| State/Ref | Type | Purpose |
|-----------|------|---------|
| `isSpeedRound` | `boolean` | Tracks if user beat the timer |
| `showStarPop` | `boolean` | Triggers star animation |
| `observationStartTime` | `ref<number>` | When observation began |

#### 5. localStorage Key

- `chromatic-has-played`: `'true'` — set after first game start, used to skip 3-2-1 countdown for returning users.

#### 6. Files Modified

- **`src/pages/Index.tsx`** — All changes are in this single file (observation flow, ready button, star animation, audio/haptic, result card, analytics).

### What Is Preserved (Golden Rule)
- All game logic, scoring, round progression, DDA, streak calculation — untouched.
- RTL styling — untouched (this is the English version).
- `CircularTimer` component — unchanged, still displays during observation as visual reference.
- Color picker, grid interaction, verify logic — all unchanged.

