# Fix High-Severity Dependency Vulnerabilities

Update three packages to versions that include patched transitive dependencies. No app code changes — these are dependency-only bumps within compatible ranges.

## Changes

1. **posthog-js** `^1.364.1` → `^1.404.0`
   - Pulls in a patched `protobufjs` (resolves GHSA-66ff-xgx4-vchm, 75px-5xx7-5xc7, jvwf-75h9-cwgg, 685m-2w69-288q, wcpc-wj8m-hjx6).
   - Same major (1.x); existing PostHog analytics integration is unaffected.

2. **react-router-dom** `^6.30.1` → `^6.31.0` (or latest 6.x)
   - Brings in patched `@remix-run/router` (resolves GHSA-2w69-qvjg-hvjx XSS via open redirects).
   - Same major (6.x); routing API unchanged.

3. **recharts** `^2.15.4` → `^2.15.5`+ / latest 2.x
   - Brings in patched `lodash` (resolves GHSA-r5fr-rjxr-66jc).
   - Same major (2.x); chart components unchanged.

## How

- Run `bun add posthog-js@latest react-router-dom@^6 recharts@^2` to update `package.json` + lockfile in one shot.
- After install, verify the dev server still boots and PostHog/routing/charts still render with no console errors.
- Re-run the security scan to confirm the three findings clear.

## Notes

- Staying on react-router v6 and recharts v2 avoids breaking-change migrations (v7 and v3 respectively).
- No source files need editing.
