# Radial layout parity: result card, summary spacing, share text

Three fixes so every view matches the 7-circle radial board.

## 1. Recall / result card (image 1)
Today the end-of-attempt dialog draws the result as five lines of emoji circles, which renders as a lopsided vertical zigzag.

Replace that emoji block in `src/pages/Index.tsx` with the real radial board: a square container using `radialSlotStyle(i)` for all 7 slots, sized ~150px, showing:
- green fill for correctly matched tiles
- red/dark fill for missed or wrong tiles
- neutral grey for slots not part of the attempt

Same geometry as the game board, so the card reads as the same flower.

## 2. Summary card spacing (image 2)
The board sits too low and the bottom circle covers the "View Your Attempt" / "View Solution" link.

In `src/components/DailySummary.tsx`:
- Tighten the space between the "Attempt X of 3" header / Neural Match bar and the board so the flower starts right beneath it.
- Slightly reduce the board container size and add real bottom clearance (accounting for the glow halo) so the toggle link always sits below the lowest circle.
- Apply the same clearance to the "Not Played" slide so all slides align.

## 3. Share results text (image 3)
The shared text uses ideographic spaces for padding, which are narrower than emoji, so the flower collapses into a zigzag.

In `src/lib/game.ts` (`radialEmojiLines`), pad each line with emoji-width spacing so the five lines align as:

```text
    ⚪
 ⚪    ⚪
    ⚪
 ⚪    ⚪
    ⚪
```

Same change applies everywhere share text is generated (daily + practice session share).

## Technical notes
- No changes to game logic, seeds, adjacency, timers, or tap handlers — layout and text formatting only.
- `radialSlotStyle` stays the single source of geometry; the result card imports it rather than duplicating math.
