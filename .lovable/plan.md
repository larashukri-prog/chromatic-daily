

## Update Four Color Hex Values

### File: `src/lib/game.ts`

Update these four colors in both the `COLORS` array and the `FALLBACK_PALETTE` array:

| Color | Old Hex | New Hex |
|-------|---------|---------|
| Pink | `#EC4899` | `#F198C4` |
| Orange | `#F97316` | `#FD9349` |
| Teal | `#2DD4BF` | `#2DD4D4` |
| Lime | `#84CC16` | `#7AC00F` |

Four find-and-replace operations across the two arrays in `game.ts`. No other files reference these hex values directly (patterns use the `COLORS` import).

