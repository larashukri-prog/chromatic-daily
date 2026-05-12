## Goal

Remove the red circle-X icon from the wrong-attempt result modal so users stop tapping it thinking it's a close button.

## Change

**File:** `src/pages/Index.tsx` (around line 1314–1316)

Remove the `<XCircle />` shown in the incorrect branch of the result modal. The "Not Quite" / "Game Over" title and the Neural Match progress bar already communicate the outcome clearly.

Before:
```tsx
{isCorrect ? (
  <div className="flex flex-col items-center mb-4">
    {isSpeedRound && <span className="text-2xl mb-1">⭐️</span>}
    <Trophy className="w-12 h-12 text-yellow-500" />
  </div>
) : (
  <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
)}
```

After: keep the correct branch unchanged; drop the `<XCircle>` (render nothing for the incorrect branch).

Also remove `XCircle` from the lucide-react import in the same file if no longer used elsewhere there.

## Out of scope

No changes to `DailySummary.tsx` (where `XCircle` marks incorrect attempts in the carousel summary — that's a recap, not a tap target).
