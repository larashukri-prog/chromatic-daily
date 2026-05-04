## Plan: Fix Blank/White PNG Capture in SessionReport

### Goal
Make the downloaded/share PNG reliably render the full branded stats card instead of a blank/white image, while preserving the desktop fallback download behavior and mobile native share flow.

### Changes to `src/components/SessionReport.tsx`

1. **Change the capture node mounting strategy**
   - Replace `left: -10000px` with an in-render-tree fixed placement.
   - Use `position: fixed`, visible viewport coordinates, `opacity: 0`, `pointerEvents: 'none'`, and a negative/low z-index so it is painted by the browser but invisible and non-interactive.
   - Keep explicit `width: 420px`, `background: '#ffffff'`, `color: '#111'`, border, radius, and `boxSizing: 'border-box'`.

2. **Add a reliable pre-flight render wait**
   - After `setIsCapturing(true)`, wait for two `requestAnimationFrame` cycles:
     - first frame: React commits the capture DOM/styles,
     - second frame: browser has painted it before rasterization.
   - Explicitly check:
     ```ts
     if (!captureRef.current) return;
     ```
     before calling `htmlToImage.toPng`.

3. **Update html-to-image options for reliable output**
   - Capture with:
     ```ts
     htmlToImage.toPng(node, {
       pixelRatio: 2,
       cacheBust: true,
       backgroundColor: '#ffffff',
       skipFonts: false,
     })
     ```
   - Use `skipFonts: false` so text embedding is not skipped. Because the capture card uses system fonts, this stays fast while avoiding missing text.
   - Keep the explicit background color to prevent transparent PNGs showing as a white/black void in social apps.

4. **Keep V2 metric alignment synced**
   - Ensure the capture card and visible card use these metrics:
     - `ROUNDS`
     - `REFLEX AVG`
     - `PEAK`
     - `DECODED`
   - Keep the existing no-overlap flex row structure: `display: flex`, `alignItems: center`, `gap: 12px`, and `flexShrink: 0` on icons/value/labels.

5. **Preserve share/download behavior**
   - Mobile with file sharing support: use native `navigator.share` with the PNG.
   - Desktop/fallback: download `Chromatic_Practice_Results.png` and copy the caption to clipboard.
   - Do not open WhatsApp or `api.whatsapp.com` on desktop.

### Expected Result
The capture target remains active in the browser paint tree, waits two frames before rasterization, and exports a sharp PNG with a solid background and the correct stats labels instead of an empty white image.