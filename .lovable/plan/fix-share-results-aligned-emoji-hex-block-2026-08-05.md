# Fix share results: aligned emoji hex block

The shared text still zigzags because emoji glyphs are far wider than any space character, so space-padded lines never line up in WhatsApp, iMessage, or X.

## New format
Replace the space-padded 5-line flower in `src/lib/game.ts` (`radialEmojiLines`) with an all-emoji 3-row block — no space characters at all, so every row has identical width and always aligns:

```text
⬛ 🟢 ⬛
🟢 🟢 🟢
⬛ 🟢 ⬛
```

Mapping to the radial board (rendered without the spaces shown above):
- Row 1: filler, node 0 (top), filler
- Row 2: node 5, node 6 (center), node 1
- Row 3: node 4, node 3 (bottom), node 2

Node 2 and node 4 (lower ring) fold into the bottom row corners, keeping all 7 nodes present in a compact hex-in-square shape.

Cell glyphs stay as they are today: correct = green, wrong/missed = red, inactive slot = white circle. The 2 corner fillers use a neutral dark square so they read as background rather than as a playable slot.

## Scope
- Only `radialEmojiLines` changes; it already feeds both the daily share text and the practice session share, so both update together.
- No changes to game logic, scoring, or on-screen board rendering.
