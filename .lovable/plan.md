

## Add PostHog Tracking for Practice Mode Events

### Changes to `src/pages/Index.tsx`

**1. `startFreePlay` (line 249)** — Add `posthog.capture('practice_mode_started', ...)` right after the puzzle is generated, before the countdown starts:
```ts
posthog.capture('practice_mode_started', {
  difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
  color_count: puzzle.colorCount,
});
```

**2. `freeplayNext` (line 467)** — Add `posthog.capture('practice_mode_next_level', ...)` after generating the new puzzle, with `freeplayRoundNum` incremented:
```ts
setFreeplayRoundNum(prev => prev + 1);
posthog.capture('practice_mode_next_level', {
  difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
  color_count: puzzle.colorCount,
  round_number: freeplayRoundNum + 1,
});
```

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add two `posthog.capture` calls in `startFreePlay` and `freeplayNext` |

