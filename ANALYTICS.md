# Analytics schema (PostHog)

Super-properties on every event: `environment` ('production' | 'development'), `app_version`.
Pageviews: automatic via `defaults: '2025-05-24'` (history_change). Never capture `$pageview` manually.

| Event | Properties |
|---|---|
| game_started | game_mode, challenge_id?, mode, round_number, day_number, difficulty, puzzle_id |
| game_stage_started | game_mode, challenge_id?, stage_number |
| game_stage_completed | game_mode, challenge_id, stage_number, is_correct, speed_star_earned |
| daily_challenge_completed | game_mode='daily', challenge_id, stages_completed, completion_time_ms, speed_star_earned (once per challenge per device) |
| share_clicked | game_mode, challenge_id?, share_method ('clipboard' / 'whatsapp' / 'practice_card') |
| practice_started | (legacy props) |

Legacy events kept for history: guess_submitted, round_verified, daily_streak_updated, game_completed (now once per day per page session), game_abandoned, results_shared, practice_*, onboarding_completed, ready_clicked, color_selected.
