# Fix: Show icons AND branded footer in shared Practice Session PNG

## Why icons are missing today
In `src/components/SessionReport.tsx`, `StatCard` renders its lucide icon with `${isCapturing ? 'hidden' : ''}`. When Share Card is tapped, `isCapturing` flips to `true` right before `html-to-image` snapshots the card, so the four icons (Target, Zap, Crown, Brain) get hidden along with the buttons. The branded footer ("ChromaticDaily · chromatic-daily.lovable.app") is already shown only during capture — that part works.

## Changes

**File:** `src/components/SessionReport.tsx`

1. **Keep icons visible during capture.** In `StatCard` (around line 160), drop the `isCapturing` toggle from the Icon className:

   ```tsx
   // Before
   <Icon className={`w-4 h-4 text-muted-foreground ${isCapturing ? 'hidden' : ''}`} />

   // After
   <Icon className="w-4 h-4 text-muted-foreground" />
   ```

2. **Make sure the branded footer is captured cleanly.** It already renders when `isCapturing` is true, so it will appear in the PNG. Two small hardening tweaks so it never renders blank:
   - Confirm `/share-logo.png` exists in `public/`. If it does not, the `onError` handler hides the `<img>` and only the wordmark is captured — fine, but worth verifying.
   - The capture already waits two animation frames after toggling `isCapturing`, so the footer is in the DOM before `html-to-image.toPng` runs. No change needed there.

Buttons (Resume / Share / Restart / Main Menu) keep hiding during capture — that's correct, they're interactive UI we don't want in the shareable image.

## Result
The shared PNG will show:
- Each stat's icon above its value (Target, Zap, Crown, Brain)
- The branded "ChromaticDaily · chromatic-daily.lovable.app" footer at the bottom
- No buttons or interactive links
