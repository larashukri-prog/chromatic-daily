

## Fix: "Daily Summary" title hidden on mobile

**Problem**: The h1 title gets `hidden sm:block` when `phase === 'result'`, which also applies when `showDailySummary` is true. This hides "Daily Summary" on smaller screens.

**Fix** (1 file, 1 line):

In `src/pages/Index.tsx` line 607, change the conditional class so it only hides during active gameplay result phase, not during the summary:

```tsx
// Before
className={`... ${phase === 'recall' || phase === 'result' ? 'hidden sm:block' : ''}`}

// After  
className={`... ${!showDailySummary && (phase === 'recall' || phase === 'result') ? 'hidden sm:block' : ''}`}
```

This ensures the "Daily Summary" title is always visible on the summary screen regardless of viewport size.

