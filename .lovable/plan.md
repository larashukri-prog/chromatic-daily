## Plan to fix the blank Practice Session PNG

I checked `SessionReport.tsx` and the current implementation is still using `html-to-image` against a hidden capture node (`opacity: 0`, `zIndex: -1`). The console also shows `html-to-image` is hitting cross-origin stylesheet/font access errors while trying to inline Google Fonts. That combination can produce an all-white PNG even when the DOM node exists.

### Changes I will make

1. **Stop capturing the hidden React node directly**
   - Keep the user-facing report modal unchanged.
   - Replace the current hidden `captureRef` capture flow with a temporary, isolated capture wrapper created only during sharing.
   - The wrapper will be fixed on screen, visible to the renderer, but placed behind normal UI with no pointer events.
   - It will have explicit dimensions and a solid white background.

2. **Capture a plain HTML clone instead of the original component tree**
   - Build the share-card markup with plain DOM elements and inline styles in the share handler.
   - Use text/emoji or inline SVG-safe content for visual markers instead of live `lucide-react` SVG components, reducing rasterization failure points.
   - Use system fonts only for the generated PNG card to avoid the Google Fonts `cssRules` security errors shown in the logs.

3. **Use a reliable pre-flight render sequence**
   - Append the temporary card to `document.body`.
   - Wait for `document.fonts.ready` when available.
   - Wait for two `requestAnimationFrame` cycles before calling `htmlToImage.toPng`.
   - Verify the node exists and has a non-zero `getBoundingClientRect()` before capture.

4. **Harden `html-to-image` options**
   - Call `htmlToImage.toPng(tempNode, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff', skipFonts: true })`.
   - `skipFonts: true` should avoid the current cross-origin Google Fonts stylesheet failure while keeping the card readable through inline/system fonts.

5. **Clean up and preserve current share behavior**
   - Always remove the temporary DOM node after capture, success or failure.
   - Keep mobile native share for file-capable devices.
   - Keep desktop behavior as direct PNG download plus copied caption, with no `api.whatsapp.com` redirect.

6. **Keep metrics synced**
   - Ensure the generated PNG displays exactly: `ROUNDS`, `REFLEX AVG`, `PEAK`, and `DECODED`.
   - Ensure layout rows use fixed width, `display: flex`, `align-items: center`, `gap: 12px`, and non-shrinking labels/values so the share card cannot overlap or stack incorrectly.

### Why this should fix it

The current hidden-node approach still gives `html-to-image` a node that the browser can optimize away or render unpredictably, and the logs show `html-to-image` is failing while reading external Google Font CSS. Capturing a temporary visible, inline-styled, system-font-only DOM card avoids both the hidden-render issue and the cross-origin stylesheet issue.