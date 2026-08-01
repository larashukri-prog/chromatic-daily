# Recall Card Micro-Interactions

Make the post-result recall card (the attempt carousel in `DailySummary`) feel alive instead of appearing rigidly. Purely visual/animation work — no scoring, seeds, or game rules change.

## 1. Card entrance
- The whole summary card springs in: fade + slight rise (y 12 -> 0) with a soft spring, instead of appearing instantly.
- Inner sections stagger in shortly after: header/attempt label, grid, badge line, share buttons, stats block — each offset ~60ms.

## 2. Tile reveal
- Replace the flat scale-in with a spring pop per tile (0.6 -> 1.04 -> 1) and a diagonal stagger (top-left to bottom-right) so the grid reads as a wave.
- Correct tiles: their green glow ramps up after the pop settles instead of being on from frame one.
- Incorrect tiles: a single soft head-shake (translateX -3px to 3px, 200ms) once they land, then the red ring fades in.

## 3. Neural Match progress
- The progress bar animates from 0% to its value over ~700ms with an ease-out curve.
- The percentage number counts up in sync with the bar.

## 4. Result badge and stats
- The badge label ("Flawless", "So Close!", etc.) scales in with a small overshoot; the emoji gets a one-shot pop.
- Speed Stars count and metric rows fade/slide in as part of the stagger; the star emoji does a single gentle wiggle.

## 5. Carousel navigation
- Slide transitions get spring physics rather than a linear 250ms fade-slide, so swipes feel weighted.
- Arrow buttons scale to 0.9 on press and lift slightly on hover.
- Dot indicators animate width with a spring; the active dot glows faintly.
- "View Solution" flip keeps its Y-axis rotation but gains easing so it settles instead of snapping.

## 6. Buttons
- Share / WhatsApp / Practice Mode buttons scale to 0.96 on press and 1.02 on hover.
- "Copied!" state fades/swaps text rather than replacing it instantly.

## Technical notes
- All work lives in `src/components/DailySummary.tsx` using the existing `framer-motion` import (`motion`, `AnimatePresence`) plus a `motion.create`-free approach: wrap shadcn `Button` in a `motion.div` rather than restyling the component.
- Add reusable variants (`cardVariants`, `staggerContainer`, `tileVariants`) at module scope in that file; no new dependencies.
- Any new keyframes (star wiggle, badge pop) go in `tailwind.config.ts` alongside the existing `board-pulse`; no hardcoded color utilities.
- Everything respects `prefers-reduced-motion` via `useReducedMotion()` from framer-motion, falling back to instant states.
