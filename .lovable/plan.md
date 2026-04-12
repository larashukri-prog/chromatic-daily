

## Hide CircularTimer Visually

### What Changes
Remove the `<CircularTimer>` component from the JSX rendering in `src/pages/Index.tsx` (lines 699-704). All the underlying timer logic (intervals, `timerProgress`, `timerDuration`, `observationStartTime` ref) stays intact — only the visual display is removed.

### File: `src/pages/Index.tsx`
- Delete the `CircularTimer` render block (lines 699-704) inside the status text area
- Keep the import (no harm, or remove for cleanliness) — prefer removing it to keep things tidy
- All timer state, intervals, and Speed Star threshold calculations remain untouched

