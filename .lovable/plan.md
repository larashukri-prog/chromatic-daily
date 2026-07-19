## Enlarge MTA bullet glyphs to match reference

Single file: `src/components/MtaOverlay.tsx`. The circle already fills the tile; only the glyph size needs to grow to match the reference image where the character visually spans roughly 65–70% of the circle diameter.

### Change

- Bump `fontSize` in the `<foreignObject>` div from `62px` to `78px` (viewBox is 100 units, so ~78% of diameter — matches the reference for wide chars like `A`, `F`, `G`).
- Tighten `letterSpacing` slightly to `-0.03em` so wide glyphs don't crowd the edge.
- Drop the `paddingTop: '2px'` optical nudge — at the larger size it's no longer needed, and centering should stay clean from flexbox.

### Verification

Reload `/play` in MTA theme. Compare picker bullets to the attached reference: characters should fill the circle just like `A`, `B`, `G`, `1`, `4`, `7` in the image — bold, dominant, with a thin ring of brand color around them.

### Out of scope

No changes to palette, tile size, or centering logic.