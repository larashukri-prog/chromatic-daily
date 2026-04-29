## Visual Image Sharing for Practice Results

Replace the "Share on WhatsApp" button in the Session Report modal with a "Share Card" button that captures the modal as a high-res PNG and either shares it via the Web Share API (mobile) or downloads it (desktop).

### Asset needed from user

Upload a logo image (PNG with transparency preferred, square or wide format). It will be placed in `public/share-logo.png`. Until provided, a text wordmark "Chromatic" in Playfair Display will render as a placeholder so the feature still works.

### Changes

**1. Install dependency**

Add `html-to-image` to the project.

**2. `src/components/SessionReport.tsx`**

- Add a `ref` (forwarded via `useRef` inside the component) to the modal card container — this is the capture target.
- Add `isCapturing` local state.
- Add a hidden-during-capture branding footer inside the card (only visible when `isCapturing` is true): logo image (`/share-logo.png`) + URL text `chromatic-daily.lovable.app`.
- Apply a CSS class that hides the action buttons (Resume Practice, Restart, Main Menu) and the Share Card button itself while `isCapturing` is true, using a conditional `data-capturing` attribute + Tailwind `[data-capturing=true]_.hide-on-capture { display: none }` style, or simpler: conditional class on each button (`isCapturing && 'hidden'`).
- Replace the existing "Share on WhatsApp" button with a single "Share Card" button:
  - Default label: `Share Card` with `Share2` icon.
  - While generating: show `Generating…` with a spinning `Loader2` icon and `disabled`.
- Capture flow on click:
  1. Set `isCapturing(true)`.
  2. `await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))` so DOM reflects hidden buttons + visible footer.
  3. Call `htmlToImage.toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' })`.
  4. Convert dataURL to a `File` (`Chromatic_Practice_Results.png`, `image/png`).
  5. If `navigator.canShare?.({ files: [file] })`, call `navigator.share({ files: [file], title: 'My Chromatic Practice Stats' })`.
  6. Else create an `<a download="Chromatic_Practice_Results.png">` and click it.
  7. `finally { setIsCapturing(false); }`.
- Wrap the share logic in try/catch; ignore `AbortError` from share dialog cancellation.
- Remove the now-unused `copied` prop and `onShare` becomes optional/unused (or rename to `onShareTriggered` for analytics, see below).

**3. `src/pages/Index.tsx`**

- Remove the `shareSession` callback and `sessionCopied` state (no longer needed for clipboard/WhatsApp text flow).
- Pass an `onShare` callback that fires the existing PostHog `practice_results_viewed`-style analytics — add a new event `practice_card_shared` with `{ rounds_played, best_speed, longest_streak }`. The component calls `onShare()` after a successful capture (before share/download dispatch is fine).
- Remove the `copied` prop from the `<SessionReport />` JSX.

**4. `public/share-logo.png`**

User-uploaded logo asset. The footer renders `<img src="/share-logo.png" />` at ~32px height with the URL beside it. If the file is missing, the `<img>` will broken-icon — acceptable until upload.

### Technical notes

- `html-to-image` works fully client-side, supports `pixelRatio` for retina output, and handles the modal's backdrop-blur/glassmorphism better than `html2canvas`.
- The capture target is the inner card (`max-w-sm` div), not the full overlay — that way the dark backdrop and outer blur layer aren't included.
- Web Share API file sharing requires HTTPS and user gesture — both satisfied (button click on the deployed app).
- During capture the modal still appears unchanged to the user (~100–300ms), since the hidden buttons + visible footer render only inside the captured snapshot frame, but visually the user sees them swap briefly. Acceptable; alternative (offscreen clone) is more complex and not requested.
- No changes to game state, persistence, or DDA logic.

### Out of scope

- WhatsApp-specific deep linking (Web Share API on mobile already surfaces WhatsApp as a target).
- Server-side image generation.
- Custom card design distinct from the modal — the modal IS the card.
