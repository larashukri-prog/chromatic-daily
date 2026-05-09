## Why iOS shows a grey tile

iOS ignores `favicon.ico` and standard PWA manifest icons when adding to Home Screen. It looks specifically for an **`apple-touch-icon`** link in the HTML head. When none is found, iOS generates a grey tile from a screenshot of the page. Android, by contrast, happily uses `favicon.ico` or any reasonably-sized PNG, which is why it looks fine there.

There's also an iOS-specific quirk: the icon **must be opaque** (no transparency). Transparent PNGs get composited onto black, producing a dark/grey-looking tile.

## Plan

1. **Generate a 180×180 opaque PNG** of the Chromatic Daily mark (white or branded background, no transparency) and save it as `public/apple-touch-icon.png`. iOS auto-rounds the corners — supply a square, full-bleed image.
2. **Add the link tag** to `index.html` `<head>`:
   ```html
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   ```
3. *(Optional, nice-to-have)* Add `<meta name="apple-mobile-web-app-title" content="Chromatic">` so the label under the icon is clean, and `<meta name="apple-mobile-web-app-capable" content="yes">` if we want it to launch standalone.

## Notes for the user

- iOS aggressively caches Home Screen icons. To test the fix, the existing tile must be deleted from the Home Screen and re-added (a hard refresh in Safari isn't enough).
- No service worker / PWA changes required — this is purely a static asset + meta tag fix.

## Files touched
- `public/apple-touch-icon.png` (new, 180×180, opaque)
- `index.html` (one `<link>` tag, optionally two `<meta>` tags)