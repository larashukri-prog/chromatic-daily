

## Reorder Focus Stats Card in Daily Summary

Move the "Focus + Stars" stat card from above the action buttons to below them, so the layout flows as:
1. Daily Challenge Complete message
2. Share buttons (Share Result, WhatsApp)
3. Start Practice Mode button
4. Focus + Stars stat card (moved to bottom)

**File: `src/components/DailySummary.tsx`**

Relocate lines 148-165 (the Focus + Stars stat card div) to after line 186 (closing of Free Play button div), just before the closing `</div>` of the main card container at line 187.

The JSX structure changes from:
```tsx
{/* Rest indicator */}
<div className="px-6 py-4 text-center border-t border-border">...</div>

{/* Focus + Stars stat card */}
<div className="px-6 pt-4 pb-2">...</div>

{/* Share buttons */}
<div className="px-6 pb-4 flex justify-center gap-3">...</div>

{/* Free Play button */}
<div className="px-6 pb-6 flex justify-center">...</div>
```

To:
```tsx
{/* Rest indicator */}
<div className="px-6 py-4 text-center border-t border-border">...</div>

{/* Share buttons */}
<div className="px-6 pb-4 flex justify-center gap-3">...</div>

{/* Free Play button */}
<div className="px-6 pb-6 flex justify-center">...</div>

{/* Focus + Stars stat card - moved to bottom */}
<div className="px-6 pt-4 pb-6">...</div>
```

Also update the stat card's bottom padding from `pb-2` to `pb-6` so it has consistent spacing at the bottom of the card.

