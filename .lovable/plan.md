# PostHog Analytics Audit & Update

## Current state (verified)

- `src/lib/posthog.ts` initializes posthog-js once from `src/main.tsx` with a **hardcoded** project key and `api_host: https://app.posthog.com`. There is no `.env` file and no React provider — the app uses the plain `posthog-js` singleton, not `posthog-js/react`.
- Events already firing: `game_started`, `round_verified`, `daily_streak_updated`, `game_completed`, `game_abandoned`, `practice_started`, `practice_next_level`, `practice_results_viewed`, `practice_card_shared`, `onboarding_completed`, plus `color_selected` / `color_placed` / `ready_clicked` via `trackEngagement`.
- Missing: no event at all on the daily share actions (`share`, `shareWhatsApp` in `src/pages/Index.tsx`).
- Guarding is inconsistent: some calls are bare `posthog.capture(...)`, some check `posthog.__loaded`, some sit in `try/catch`.
- Color swatches and grid tiles are already native `<button>` elements (`motion.button`), so autocapture can see them, but they carry no stable identifying attributes.

## Changes

### 1. Env-driven initialization
Read the key and host from `import.meta.env.VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`, falling back to the current hardcoded values so nothing breaks before the vars are set. Skip init entirely when no key resolves. Add the two vars to `.env` and type them in `src/vite-env.d.ts`.

No `PostHogProvider` wrapper is added — the app uses the posthog-js singleton everywhere and a provider would add a second init path. If you specifically want the React provider API (`usePostHog()`), say so and it will be swapped in `src/App.tsx` instead.

### 2. Safe capture helper
Add `track(event, props?, options?)` to `src/lib/analytics.ts`: no-ops when `posthog` is unloaded, wrapped in try/catch. Route every capture in `Index.tsx`, `OnboardingOverlay.tsx`, and `analytics.ts` through it, so no analytics call can ever throw or fire pre-init.

### 3. Explicit event coverage
- `game_started` — add `puzzle_id` (today's date seed) alongside existing `mode`, `round_number`, `day_number`, `difficulty`.
- `guess_submitted` — new, fired on Verify for both daily and practice: `attempt_number`, `round_number`, `accuracy` (matched tiles / active tiles, 0-100), `tiles_total`, `is_correct`, `mode`. `round_verified` stays as-is for the daily flow.
- `color_selected` — enrich with `color_hex`, `color_name`, `slot_index`, `action` (`selected` | `placed`); keeps the existing `color_placed` distinction inside one payload shape.
- `game_completed` — add `puzzle_id`, `total_time_seconds` (total focus seconds), `current_streak`, `max_streak` to the existing day/difficulty/result/stars/rounds fields.
- `results_shared` — new, fired from both daily share paths with `channel` (`clipboard` | `whatsapp`), `puzzle_id`, `stars_earned`, `rounds_solved`. Practice keeps `practice_card_shared` and also emits `results_shared` with `channel: 'practice_card'` for one unified funnel.

### 4. Autocapture attributes
Add `data-ph-capture-attribute-*` to interactive elements so heatmaps and autocapture read cleanly without relying on DOM text:
- color swatches: `element-type="color-swatch"`, `color-name`, `color-hex`
- grid tiles (`GameGrid.tsx`): `element-type="grid-tile"`, `tile-index`
- primary actions (Start, I'm Ready, Verify, Share, WhatsApp, Practice, Results): `element-type="cta"`, `action="<name>"`

All elements are already native buttons; no tag changes needed.

## Technical notes

Files touched: `src/lib/posthog.ts`, `src/lib/analytics.ts`, `src/pages/Index.tsx`, `src/components/GameGrid.tsx`, `src/components/OnboardingOverlay.tsx`, `src/vite-env.d.ts`, `.env`.

New event names (`guess_submitted`, `results_shared`) start fresh series in PostHog; existing names keep their history.
