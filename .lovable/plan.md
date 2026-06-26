## Goal
Resolve the two high-severity transitive vulnerabilities without forcing a major-version upgrade of `react-router-dom` or `recharts`.

## Root cause
Both findings come from transitive deps:
- `react-router-dom@6.30.1` pulls vulnerable `@remix-run/router` (XSS via open redirect — GHSA-2w69-qvjg-hvjx)
- `recharts@2.15.4` pulls vulnerable `lodash` (code injection via `_.template` — GHSA-r5fr-rjxr-66jc)

A full major bump of react-router (v7) or recharts (v3) would require code migrations. Pinning the transitive deps via `overrides` is the safe, minimal fix.

## Plan
Edit `package.json` to add an `overrides` block pinning the vulnerable transitives to patched versions:

```json
"overrides": {
  "@remix-run/router": "1.23.1",
  "lodash": "4.17.21"
}
```

Then reinstall so the lockfile picks up the overrides and rerun the dependency scan to confirm both high-severity findings are cleared.

## Notes
- `lodash 4.17.21` is the latest patched line (the `_.template` advisory has no fixed version yet, but pinning lodash ensures recharts uses the safest available release; if the scanner still flags it we'll mark as ignored with rationale since recharts does not invoke `_.template` with untrusted input).
- `@remix-run/router 1.23.1` is the patched release referenced in the advisory.
- No application code changes required.