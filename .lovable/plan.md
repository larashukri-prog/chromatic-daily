# Soften the shared results into a flower shape

The share text currently pads the four unused corners with black squares, which makes the result read as a solid 3x3 grid instead of the radial board.

## Change

In the share-text builder, swap the corner filler from the black square to the neutral white square (the same tone already used for empty/unplayed tiles). Rows stay all-emoji and identical width, so alignment in WhatsApp and other chat apps stays guaranteed, but the colored tiles now read as a flower/hex against a light background.

Result shape per attempt:

```text
⬜ 🟢 ⬜
🟢 🟢 🟢
⬜ 🟢 🟢
```

(spaces shown for clarity only; the real output has no spaces)

## Technical detail

- `src/lib/game.ts` → `radialEmojiLines`: change the filler constant from `⬛` to `⬜`.
- Unplayed attempts already fill with `⚪`; keep that so a skipped attempt stays visually distinct from the corner filler.
- No other files change; the in-app radial board is unaffected.
