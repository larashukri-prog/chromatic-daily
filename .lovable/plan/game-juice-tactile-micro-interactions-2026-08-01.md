# Game Juice: Tactile Micro-Interactions

Adds spring physics, tactile slot states, a card-flip board transition, and staged auto-verification feedback across daily and practice modes. No game rules, seeds, difficulty, or scoring change.

## 1. Color swatches

- Each picker swatch becomes a spring-animated button: press scales to 0.92, the selected swatch springs to 1.05 (replaces the current static 1.15 scale).
- The selected swatch gains a soft glowing ring in its own hue instead of the hard black outline.
- Assigning a color to a slot fires a crisp snap: the swatch pops and settles, and selection clears as it does today.

## 2. Tile slots

- Empty slots get an inset shadow plus a subtle dashed ring so they read as physical receptacles.
- Filling a slot plays a bounce on that tile only (0.9 -> 1.05 -> 1.0).
- Clearing an occupied slot plays a fast fade-out with a small horizontal wobble.

## 3. "I'm ready" board flip

- On press, the target tiles flip face-down on the Y axis (rotateY 180deg, 400ms, lightly staggered) and land as empty grey receptacles, then the recall phase begins.
- The existing speed-star pop and chime still fire on top of the flip.

## 4. Staged auto-verification

- Placing the final tile starts an 800ms "Staged Check" buffer with an ambient pulse glow on the card border; verification then runs automatically.
- The Verify button is removed. Clear stays available and cancels the pending check if tapped during the buffer.
- Stage clear: a ripple sweeps across correct tiles from top-left to bottom-right; a successful attempt 3 also fires a confetti burst using the existing confetti helper.
- Incorrect: the current red highlight shows first, then only the wrong tiles head-shake (translateX -4px to 4px, 200ms) and fade smoothly back to empty. The full-card shake is replaced by this softer per-tile feedback.

## Technical notes

- `src/components/GameGrid.tsx`: per-tile animation state (fill, clear, flip, ripple, shake) driven by a new prop; tiles use Framer Motion variants with spring transitions.
- `src/pages/Index.tsx`: swatch motion and glow ring; place/clear handlers emit tile animation events; a new staged-check timer replaces the manual `verify()` trigger; Verify button removed; flip state gates `handleReady` before entering recall.
- `tailwind.config.ts` / `src/index.css`: add `tile-bounce`, `tile-wobble`, `board-pulse`, and `ripple` keyframes plus glow/ring tokens — no hardcoded colors in components.
- All new motion respects `prefers-reduced-motion`, falling back to instant state changes.
- Behavior is identical across Colors, Patterns, Shapes, and MTA themes, and in Practice Mode.