# PostHog Telemetry Cleanup

Align analytics with the unified visual design (no themes), remove dead theme state, and standardize event payloads.

## What changes

### 1. Remove legacy theme tracking (`src/lib/posthog.ts`)
The init currently reads the retired `chromatic-visual-theme` localStorage key and registers a `visual_style` super-property on every event and pageview. Remove that read and the `visual_style` property; keep `project_language` and `ui_direction`, and keep autocapture, pageview/pageleave capture, and session recording exactly as they are.

No other file passes `theme`, `visual_style`, `mode_type`, or `theme_selected` — the earlier refactor already removed `visual_theme_changed` / `visual_style_first_set`.

### 2. De-duplicate gameplay events (`src/pages/Index.tsx`)
Two pairs of events fire for the same action with near-identical payloads:
- `Game Start` and `game_started` -> keep only `game_started`
- `practice_mode_started` and `practice_started` -> keep only `practice_started`

The legacy-cased/duplicate names are dropped so dashboards read one canonical event each.

### 3. Streamline core event payloads
- `game_started`: `round_number`, `day_number`, `difficulty`, `mode`
- `game_completed`: `day` (daily game date/day name), `difficulty`, `result`, `stars_earned`, plus `rounds_solved` and `attempts_used` so completion has score/accuracy without a join
- `Round Verified` -> renamed `round_verified` (snake_case, consistent with the rest): `round_number`, `stage`, `is_correct`, `speed_bonus`, `recall_seconds`
- `game_abandoned`, `practice_started`, `practice_next_level`, `practice_results_viewed`, `practice_card_shared`: unchanged payloads, `practice_mode_next_level` renamed to `practice_next_level` for naming consistency

### 4. Onboarding and streak events
Neither `onboarding_completed` nor `daily_streak_updated` exists today. Add both, minimally:
- `onboarding_completed` fired when the "Got it" button dismisses the how-to-play overlay — no properties beyond the default set.
- `daily_streak_updated` fired after a daily round is saved, with `current_streak` and `max_streak` only.

### 5. Untouched
User identification, distinct IDs, session recording, pageleave/retention config, and `trackVirtualPageview` / `trackEngagement` in `src/lib/analytics.ts` stay as-is.

## Technical notes

- Files touched: `src/lib/posthog.ts`, `src/pages/Index.tsx`, `src/components/OnboardingOverlay.tsx`.
- There is no `src/utils/analytics`; PostHog init lives in `src/lib/posthog.ts` and helpers in `src/lib/analytics.ts`.
- Renaming events creates new series in PostHog; historical data under the old names remains but will not continue.
