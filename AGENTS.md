# Agent rules
- All analytics captures go through typed `track`/`trackOnce`/`trackOncePersistent` in `src/lib/analytics.ts`; schema lives in `ANALYTICS.md`. Why: one guarded, deduped, typed path keeps PostHog metrics consistent.
- PostHog is initialized only in `src/lib/posthog.ts` (guarded by `__loaded`), with no manual `$pageview`. Why: double init or manual pageviews split sessions and duplicate counts.
