# Track Visual Style Across All PostHog Events

Make `visual_style` available on every PostHog event (not just `game_started` / `practice_started`), and distinguish users who **kept the default `colors`** from users who **actively chose `colors`**.

## Changes

### 1. `src/lib/posthog.ts` — register super property on init

Read the stored theme from localStorage at init time and register it as a super property so it auto-attaches to every event:

```ts
const stored = localStorage.getItem('chromatic-visual-theme');
const initialTheme = stored === 'patterns' || stored === 'shapes' ? stored : 'colors';

posthog.register({
  project_language: 'English',
  ui_direction: 'LTR',
  visual_style: initialTheme,
});
```

### 2. `src/hooks/useAccessibility.tsx` — keep super property in sync

In the `useEffect` that persists `theme`, also call `posthog.register({ visual_style: theme })` so the super property updates whenever the theme changes (from any source).

### 3. `src/components/VisualThemeToggle.tsx` — richer change event + first-set tracking

Update `handleChange`:

```ts
posthog.capture('visual_theme_changed', {
  theme: next,
  previous_theme: theme,
});

// One-time event the first time a user actively picks a style
const TOUCHED_KEY = 'chromatic-visual-theme-touched';
if (!localStorage.getItem(TOUCHED_KEY)) {
  localStorage.setItem(TOUCHED_KEY, '1');
  posthog.capture('visual_style_first_set', {
    theme: next,
    previous_theme: theme, // tells you what the default was for that user
  });
}
```

## Result in PostHog

- **Every event** (pageviews, autocaptured clicks, game events) now carries `visual_style` → breakdown any insight by visual style.
- **`visual_theme_changed`** now includes `previous_theme` → see migration patterns (e.g. `colors → shapes`).
- **`visual_style_first_set`** fires once per user → cohort of "users who actively chose a style" vs everyone else (defaulters).
  - Users with `visual_style = 'colors'` AND no `visual_style_first_set` event → kept the default.
  - Users with `visual_style = 'colors'` AND `visual_style_first_set { theme: 'colors' }` → actively chose colors after trying another.

## Files edited

- `src/lib/posthog.ts`
- `src/hooks/useAccessibility.tsx`
- `src/components/VisualThemeToggle.tsx`
