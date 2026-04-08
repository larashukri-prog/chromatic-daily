

## Replace "Start Practice Mode" Button on Last Result Card

### What changes
The "Start Practice Mode" button on the **last daily result card** (the dialog shown when all attempts are used and `alreadyFinished` is true) gets replaced with a motivational message. The button in the **DailySummary carousel** (below Share/WhatsApp) stays unchanged.

### File: `src/pages/Index.tsx` (lines 998-1002)

Replace:
```tsx
{!canContinue && alreadyFinished && (
  <Button onClick={startFreePlay} variant="outline" className="rounded-xl gap-2">
    <Sparkles className="w-4 h-4" /> Start Practice Mode
  </Button>
)}
```

With:
```tsx
{!canContinue && alreadyFinished && (
  <p className="text-sm text-muted-foreground text-center mt-2">
    Nice try! See you tomorrow for a new challenge.
  </p>
)}
```

No changes to `DailySummary.tsx` — the button there remains as-is.

