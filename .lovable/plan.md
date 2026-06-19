## Center the Turkey flag crescent and star

The FIFA overlay currently treats every flag as `object-center` except Jordan (`object-left`) and Qatar (`object-[30%_center]`). The Turkey flag's crescent and star are not reading as centered in the circular crop, so we will add a dedicated object-position rule for `tr.png`.

### Plan
1. **Update `src/components/FifaOverlay.tsx`**
   - Add a `tr.png` branch to the existing object-position ternary.
   - Start with `object-[40%_center]` — a subtle shift toward the hoist side so the crescent/star sit in the visual middle of the circle while keeping red field visible on both sides.

2. **Verify visually**
   - Run the app and use Playwright to capture a screenshot of the Turkey flag tile.
   - If the crescent/star still look off-center, iterate the percentage (e.g., 35%, 45%, 50%) based on what the screenshot shows.

3. **Ship the chosen value**
   - Commit the final percentage once the flag looks centered.

### Out of scope
- No changes to other flags, anchors, game logic, or the daily flag list.