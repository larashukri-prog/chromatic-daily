

## Hide subtitle on small screens during Daily Summary

**Problem**: The "Monday · #834 · Level: Minimalist" subtitle takes up space on small screens, pushing the "Start Practice Mode" button below the fold.

**Fix** (1 file, 1 line):

In `src/pages/Index.tsx` line 612, add `hidden sm:block` when showing the daily summary:

```tsx
// Before
<p className="text-sm text-muted-foreground tracking-wide uppercase">

// After
<p className={`text-sm text-muted-foreground tracking-wide uppercase ${showDailySummary ? 'hidden sm:block' : ''}`}>
```

This hides the day/number/level line on mobile only when viewing the summary, keeping the Practice Mode button above the fold.

