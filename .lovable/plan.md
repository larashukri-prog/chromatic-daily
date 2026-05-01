# PostHog Tracking: Game Start by Visual Style

Add two new PostHog events that include the user's current `visual_style` (`'colors' | 'patterns' | 'shapes'`), so you can compare style popularity across competitive (Daily) vs casual (Practice) play.

## Changes

All edits are in `src/pages/Index.tsx`. The `visualTheme` value is already available via `useVisualTheme()` (line 166).

### 1. `game_started` — fired on Standard (Daily) game start

In `startGame` (line 306), alongside the existing `'Game Start'` capture:

```ts
posthog.capture('game_started', {
  visual_style: visualTheme,
  round_number: roundIndex + 1,
  day_number: dayNum,
  difficulty: difficultyName,
});
```

Add `visualTheme` to the `useCallback` dependency array.

The existing `'Game Start'` event is left intact so historical dashboards keep working.

### 2. `practice_started` — fired on Practice Session start

In `startFreePlay` (line 342), update the existing `practice_mode_started` capture (or add a new one) so the new event name is emitted:

```ts
posthog.capture('practice_started', {
  visual_style: visualTheme,
  difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
  color_count: puzzle.colorCount,
});
```

Keep the existing `practice_mode_started` event for back-compat with current funnels. Add `visualTheme` to the dependency array.

## Result

In PostHog you'll get two clean events that share a `visual_style` property, letting you build a single insight broken down by `visual_style` and filtered by event name to compare Daily vs Practice popularity per style.
