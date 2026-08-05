# Center the Daily Summary Radial Board

## Problem
In the Daily Summary carousel card the radial board is visually offset slightly to the right of center. The user wants it perfectly centered between the carousel arrows and aligned with the Start Practice Mode button below.

## Root cause
`src/components/DailySummary.tsx` renders the summary radial board with duplicated inline `radialSlotStyle` code instead of the shared `RadialLayout` component. The current wrapper uses `flex justify-center`, but the inner `motion.div` (`w-full aspect-square max-w-[190px]`) does not carry `mx-auto`, so the board can shift depending on card padding, arrow placement, and the parent `text-center` context.

## Plan
1. **Refactor `DailySummary.tsx` to use `RadialLayout`** for both the played `SlideContent` and the `UnplayedSlide`, replacing the duplicated inline radial-slot markup.
2. **Force horizontal centering** by wrapping `RadialLayout` in a `w-full flex justify-center` container; the `RadialLayout` component already includes `mx-auto`, giving two layers of centering.
3. **Keep the board size consistent** at `190px` max-width (or reduce to `180px` if the arrows crowd it), preserving the existing `AnimatePresence` flip animation and `MixedTile` rendering.
4. **Unify `UnplayedSlide`** so its placeholder neutral board uses the same centered `RadialLayout` wrapper, removing the stray right offset there too.
5. **Verify** with `tsgo --noEmit`, then visually confirm at `/summary` that the radial board sits dead-center between the carousel arrows and lines up with the Start Practice Mode button.
