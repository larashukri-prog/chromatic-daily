# Staggered 2-3-2 diamond share board

Replace the filled 3x3 emoji block in the share text with a staggered 2-3-2 diamond that echoes the radial board. All other share copy — header, day number, badge, "Attempt N" lines, Visual Style, Speed Stars, Peak, and the play URL — stays exactly as it is.

## New board shape

Per attempt, three rows with no filler squares:

```text
 🟢🟢
🟢🟢🟢
 🟢🟢
```

The 2-emoji rows get a single leading space so they read as centered against the 3-emoji middle row.

## Node mapping

The board is a center anchor (index 6) with six ring nodes orbiting clockwise from the top (0 = top, 3 = bottom). Read clockwise into the diamond:

- Row 1 (top pair): ring 0, ring 1
- Row 2 (left, center, right): ring 5, center 6, ring 2
- Row 3 (bottom pair): ring 4, ring 3

Every one of the 7 slots appears exactly once, so nothing is dropped and no padding is needed.

## Unplayed attempts

Skipped or unplayed attempts keep the neutral ⚪ indicator in all 7 positions, using the identical 2-3-2 row structure, so every attempt block lines up.

## Technical scope

- `src/lib/game.ts` → `radialEmojiLines`: drop the `⬛` filler constant and return the three staggered rows using the mapping above.
- The existing call sites in `generateShareText` (played attempt and unplayed attempt) stay unchanged.
- No other files touched; the in-app radial board and summary are unaffected.

Note: emoji are wider than a space character, so the stagger is a close approximation rather than pixel-exact in every chat client. WhatsApp and iMessage render it as a readable diamond.
