# Fix 404 from virtual pageviews

## Cause
The new `trackVirtualPageview` helper calls `history.pushState('/play')` (and `/summary`, `/practice`, `/practice/results`). React Router's config in `src/App.tsx` only declares `path="/"` plus the catch-all `path="*"` → `NotFound`. As soon as the URL flips to `/play`, the matcher falls through to the 404 page.

This also breaks page refresh and direct-link sharing for those virtual URLs.

## Fix
Register the virtual paths as aliases of `<Index />` so the router happily matches them. No component or game-logic changes required.

### `src/App.tsx`
Add these routes above the catch-all, all rendering `<Index />`:
- `/play`
- `/summary`
- `/practice`
- `/practice/results`

Use a single array + `.map` or list them explicitly — explicit is clearer here (4 lines).

### Why this works with Lovable hosting
Lovable's SPA fallback already serves `index.html` for unknown paths, so refreshing `/play` reaches React, and React Router now finds a match instead of 404. Lovable Analytics keeps seeing distinct pageviews (`/`, `/play`, `/summary`, …), so the bounce-rate fix from the previous plan is preserved.

## Verification
1. Start a daily round → URL becomes `/play`, no 404.
2. Refresh on `/play` → game loads (in idle state, which is fine).
3. Analytics still shows multiple page entries (`/`, `/play`, `/summary`).

## Files touched
- Edited: `src/App.tsx` (add 4 route lines)