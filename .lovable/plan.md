# PostHog Integration Repair

## Audit findings (verified in code)

- Single `posthog.init()` in `src/lib/posthog.ts`, called once from `src/main.tsx`. No provider, no StrictMode, but also no `__loaded` guard against HMR re-init.
- `posthog-js ^1.393.4` (current). Config has no `defaults` preset; `capture_pageview: true` only fires on first load, not SPA route changes.
- Host is legacy `https://app.posthog.com` (fallback + `.env`). Should be the regional ingest host (`us.i.posthog.com` or `eu.i.posthog.com`).
- Session recording is not disabled; `recordCrossOriginIframes: true` is unnecessary.
- `trackVirtualPageview` pushes history, dispatches synthetic `popstate`/`locationchange` events, and manually captures `$pageview` with an overridden `$current_url`. This drops UTM params from later pageviews, can make React Router re-render, and will double-count once history-based pageviews are on.
- No `identify()` / `reset()` calls — identity persistence is fine.
- No `environment` / `app_version` tagging; dev preview traffic goes to the production project.
- Onboarding still calls `posthog.capture` directly.
- Existing events: `game_started`, `guess_submitted`, `round_verified`, `daily_streak_updated`, `game_completed`, `game_abandoned`, `results_shared`, `practice_*`, `onboarding_completed`, `ready_clicked`, `color_selected`, `main_menu_clicked`.

Most likely reason recordings and metrics look broken: SPA pageviews come from manual synthetic events, not PostHog's history tracking. That breaks attribution and page paths. The legacy host and missing defaults preset add to it. Recording replay itself also depends on a dashboard toggle, which can't be checked from code.

## Changes

1. **Init (`src/lib/posthog.ts`)**: guard with `posthog.__loaded`, add `defaults: '2025-05-24'` (gives `capture_pageview: 'history_change'`), keep autocapture/pageleave, drop the iframe option, use `persistence: 'localStorage+cookie'`. Default the host to `https://us.i.posthog.com` (I will confirm the region with you). Register super-properties `environment` (from `import.meta.env.MODE`/hostname) and `app_version`. In development, keep events flowing but tagged `environment: 'development'` so they can be filtered out.
2. **Pageviews (`src/lib/analytics.ts`)**: `trackVirtualPageview` becomes a plain `history.pushState` that keeps the existing query string. No synthetic events and no manual `$pageview`, so PostHog's history tracking records one pageview per route with the UTMs intact.
3. **Typed taxonomy**: add an `AnalyticsEvents` map with typed props, plus `track<E>()` that strips `undefined` values. Keep the historical names and add the canonical ones the brief asks for:
   - `game_started` (kept) — once per genuine session, deduped by a session key
   - `game_stage_started` — new, when an attempt begins (on reveal)
   - `game_stage_completed` — new, fired with `round_verified` after a verify
   - `daily_challenge_completed` — new, once per `challenge_id` (localStorage guard), only when the day finishes
   - `share_clicked` — new, alongside `results_shared`
   - `practice_started` (kept)
   - Shared props: `game_mode`, `challenge_id`, `stage_number`, `stages_completed`, `completion_time_ms`, `speed_star_earned`, `share_method`. `app_version` and `environment` come in as super-properties.
4. **Dedup guards**: per-challenge "completed" flag, and stage events keyed by `challenge_id`+`stage_number` so re-renders or repeat callbacks can't refire. Completion never fires on abandon or reset.
5. **Onboarding**: route through `track`.
6. **Docs**: add an `ANALYTICS.md` event schema and an AGENTS.md rule ("all captures go through typed `track`").

## Deliverable report after building
Root cause, files changed, final schema, the dashboard checks (Session Replay enabled, authorized domains include `chromatic-daily.lovable.app`, filter on `environment`), and how to test recordings locally vs in production.

## Technical notes
Files: `src/lib/posthog.ts`, `src/lib/analytics.ts`, `src/pages/Index.tsx`, `src/components/OnboardingOverlay.tsx`, `.env`, new `ANALYTICS.md`, `AGENTS.md`. Plus a small vitest for `track` stripping undefined values and the once-per-challenge completion guard.
