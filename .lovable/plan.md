## Goal
Replace the AI-generated `apple-touch-icon.png` with the existing `share-logo.png`, flattened onto a white background.

## Steps

1. **Process `public/share-logo.png` → `public/apple-touch-icon.png`** using ImageMagick:
   - Resize to fit within 180×180.
   - Pad to a square 180×180 canvas with a **white** background.
   - Strip alpha channel (fully opaque) — this is what fixes the iOS grey-tile bug.
2. Leave `public/share-logo.png` untouched (still used for OG/social share previews).
3. No `index.html` changes needed — the existing `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` already points to the right path.

## Notes
- iOS aggressively caches Home Screen tiles. To verify after publishing: delete the old tile and re-add via Safari → Share → Add to Home Screen.
- No code or markup changes — purely an asset swap.

## Files touched
- `public/apple-touch-icon.png` (overwritten with white-background, 180×180 version of share-logo)