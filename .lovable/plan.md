## Replace Ball & Filler Images

**Goal:** Swap the existing `ball.png` (Black anchor) and `filler.png` assets with the newly uploaded images.

**Mapping:**
- `Mask_group_15.png` (Trionda ball) → new `ball.png` (Black anchor)
- `Mask_group_14.png` (Classic B&W ball) → new `filler.png` (empty chromatic slots)

**Steps:**
1. Delete old `src/assets/fifa/ball.png.asset.json` and `src/assets/fifa/filler.png.asset.json` from CDN and repo.
2. Upload `Mask_group_15.png` as `ball.png` → write new `src/assets/fifa/ball.png.asset.json`.
3. Upload `Mask_group_14.png` as `filler.png` → write new `src/assets/fifa/filler.png.asset.json`.
4. No code changes in `FifaOverlay.tsx`; imports already reference filenames, so new URLs are picked up automatically.