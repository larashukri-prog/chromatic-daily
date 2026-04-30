# Optimize Practice Results Share Card

Refine the `html-to-image` capture in `src/components/SessionReport.tsx` for sharper output on retina mobile displays, plus tighter loading-state UX.

## Changes — `src/components/SessionReport.tsx`

### 1. Capture container

- Add a fixed pixel width to the captured card during snapshot so the layout doesn't reflow at higher pixel ratios.
  - Current: `max-w-sm` (responsive). Target: temporarily lock width to `420px` while `isCapturing` is true via inline style applied to `cardRef.current` (set before capture, cleared in `finally`).
- Apply `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` inline on the cardRef during capture for crisper glyphs.

### 2. Pixel ratio with perf fallback

- Default `pixelRatio: 3`.
- Detect mobile (`/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)`) and a low-memory hint (`(navigator as any).deviceMemory <= 4` or `hardwareConcurrency <= 4`) → in that case start at `pixelRatio: 2`.
- Wrap the `htmlToImage.toPng` call with `performance.now()` timing. If a first attempt at 3x exceeds 1500ms (logged), set a `sessionStorage` flag `chromatic:lowResShare=1` so subsequent shares in the session use 2x immediately. (Cannot abort in-flight, but next click is fast.)
- Keep `toPng` (lossless). Pass `{ pixelRatio, cacheBust: true, backgroundColor: '#ffffff', skipFonts: false }`. No `quality` param needed (PNG).

### 3. Loading state

- Existing `isCapturing` already disables the button and swaps label → `Generating…` with `Loader2` spinner. Reinforce by:
  - Setting `isCapturing(true)` synchronously as the very first line of `handleShareCard` (already true).
  - Wrapping the heavy work in `await new Promise(r => setTimeout(r, 0))` after state set, so React paints the spinner before the main-thread-heavy `toPng` runs.
  - Keep the existing two `requestAnimationFrame` waits afterward so the hidden buttons / visible footer reflect in the snapshot.

### 4. Async execution

- `toPng` is already async. Add the `setTimeout(0)` yield above so the spinner UI commits before serialization begins; this prevents the visible "frozen button" feeling on lower-end devices.

## Technical notes

- `pixelRatio: 3` with a 420px-wide card → ~1260px output, ideal for WhatsApp/IG status.
- Fixed width via inline style avoids `max-w-sm` collapsing on tiny viewports during capture, which currently can produce a narrow, stretched-looking PNG.
- `-webkit-font-smoothing` only affects WebKit/Blink; harmless elsewhere. Pairs with `-moz-osx-font-smoothing` for completeness.
- Perf gate uses `sessionStorage` so the user gets one slow share max per tab session, then auto-downshifts.
- No new dependencies. No changes to `Index.tsx`, analytics, or game state.

## Out of scope

- Switching to `toJpeg` (PNG preserves crisp text/borders better for this card).
- Server-side rendering or offscreen-canvas rasterization.
- Custom share-only card layout distinct from the modal.
