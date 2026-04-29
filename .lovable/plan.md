## Practice Mode: Session Report Overlay

Add a session-stats system, milestone celebrations every 10 rounds, and a full-screen Session Report overlay for Practice Mode only. Daily Challenge logic, GameLoop, and brand styling stay untouched.

### 1. Dependency

Install `canvas-confetti` (and `@types/canvas-confetti`) — used only inside Practice Mode milestone trigger.

### 2. New file: `src/components/SessionReport.tsx`

Full-screen frosted-glass overlay component. Props: `stats`, `onResume`, `onShare`, `onRestart`, `onMainMenu`, `copied`.

Layout (centered card, inset-0 fixed, `bg-white/40 backdrop-blur-xl` over a `bg-black/20` scrim, z-index above header):
- Header: "Session Complete" — Playfair serif (matches brand).
- Subhead: dynamic Insight line (rules below).
- 2×2 stats grid with lucide icons:
  - `Target` — Rounds Played
  - `Zap` — Top Speed (`bestSpeed.toFixed(2)s` or `—`)
  - `Eye` — Focus % (`totalAccuracy`)
  - `Flame` — Longest Streak
- Primary button: "Resume Practice" (full-width, `bg-primary`).
- Secondary button: "Share Results" (outline). Shows "Copied!" state for 2s.
- Footer row: two small text-muted-foreground links — "Restart Session" · "Main Menu".

Insight priority (first matching wins):
1. `bestSpeed > 0 && bestSpeed < 1.0` → "Elite reflexes. You're ready for the Daily Challenge."
2. `totalAccuracy > 95` → "Incredible focus. You're in the zone."
3. `longestStreak > 10` → "Great rhythm! Your consistency is improving."
4. else → "You're getting faster! Your reaction time is peaking."

### 3. Stats tracking in `src/pages/Index.tsx`

Add Practice-only state:
```ts
type SessionStats = {
  roundsPlayed: number;       // successful (correct) rounds
  bestSpeed: number;          // lowest recall time in seconds (0 = none yet)
  totalCorrect: number;
  totalAttempts: number;      // verifies in practice
  currentStreak: number;
  longestStreak: number;
};
```
- Derived: `totalAccuracy = totalAttempts ? round(totalCorrect/totalAttempts*100) : 0`.
- New ref `recallStartTime` set when entering `phase==='recall'` in freeplay (in `handleReady` when `isFreeplay`).
- New state `showSessionReport: boolean`.

Update points (all gated by `isFreeplay`):
- **`startFreePlay`** (entry to Practice Mode): reset `sessionStats` to zeros, `showSessionReport=false`.
- **`verify`** in the freeplay branch: when `correct === true`, compute `recallSeconds = (Date.now() - recallStartTime)/1000`; bump `roundsPlayed`, update `bestSpeed = min(prev||∞, recallSeconds)`, `totalCorrect++`, `currentStreak++`, `longestStreak = max(...)`. On incorrect: `currentStreak = 0`. Always `totalAttempts++`.
- After updating, if `roundsPlayed > 0 && roundsPlayed % 10 === 0` → call `triggerMilestone()`.

### 4. Milestone "juice"

New helper inside Index (or `src/lib/milestone.ts`):
- `triggerMilestone()`:
  - Fires `canvas-confetti` two bursts (left + right origins, ~120 particles total, brand-aligned color array drawn from existing `COLORS`).
  - Plays a preloaded `HTMLAudioElement` (royalty-free cheer, e.g. `https://cdn.pixabay.com/audio/2022/03/15/audio_d1718ab41b.mp3` or similar short success cue). Audio element created once via `useRef` + `useEffect` on mount with `audio.preload='auto'` and `audio.volume=0.5`. Wrapped in try/catch (autoplay may be blocked — fail silently).

### 5. "Results" button

Inside the Practice Mode header block (the `isFreeplay` branch around line 651), add a top-right button:
- Position: absolute top-right of the page header area (use a relative wrapper or fixed positioning at `top-4 right-4` matching existing `AccessibilityToggle` placement).
- Visible only when `isFreeplay && sessionStats.roundsPlayed >= 1 && !showSessionReport`.
- Style: `text-xs text-muted-foreground hover:text-foreground bg-card/60 backdrop-blur border border-border rounded-full px-3 py-1.5` with `BarChart3` icon.
- onClick: pause game (clear `timerRef`/`countdownRef`), set `showSessionReport=true`. Game state preserved as-is so Resume continues the current phase.

### 6. Overlay actions wiring

- **Resume Practice**: `setShowSessionReport(false)`. If the paused phase was `observation`, restart the observation timer for the current `activeColors` (reuse `freeplayRetry`'s timer-restart pattern but keep grid/solution). If `recall` or `result`, just close — user keeps interacting.
- **Share Results**: copy to clipboard:
  ```
  Chromatic Lab Session ⚡️
  Peak Speed: {bestSpeed.toFixed(2)}s
  Rounds: {roundsPlayed}
  Can you beat my speed? https://chromatic-daily.lovable.app
  ```
  Set `copied=true` for 2s.
- **Restart Session**: reset `sessionStats`, close overlay, call `startFreePlay()` to begin a fresh round 1.
- **Main Menu**: call existing `backToDaily()`.

### 7. Render

Render `<SessionReport ... />` inside the Index return tree, after the main card, gated by `showSessionReport && isFreeplay`. Use `AnimatePresence` + fade for entry/exit.

### 8. Memory update

Refresh `mem://features/practice-mode` to record: session stats tracking, milestone confetti every 10 wins, Session Report overlay with Resume/Share/Restart/Main Menu actions.

### Notes

- All changes are additive; no edits to `game.ts`, `freeplay.ts` puzzle logic, or daily flow.
- No new colors or fonts; uses existing `bg-card`, `border-border`, `Playfair Display`, `Inter`, primary/muted tokens.
- Audio + confetti are no-ops if blocked or unavailable — never throw.
