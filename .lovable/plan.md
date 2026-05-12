# Fix Inaccurate Bounce Rate in Lovable Analytics

Lovable Analytics treats single-pageview sessions as bounces. Because Chromatic Daily is a SPA, every visitor only ever loads `/` once, so even a 7-minute play session shows as a bounce. Lovable's tracker (like Plausible/Umami) listens to `history.pushState` to record virtual pageviews — we just need to emit them at the right moments and add a small engagement signal.

## What to change

All work is in the frontend. No new dependencies, no backend.

### 1. Add a tiny analytics helper
New file: `src/lib/analytics.ts`

- `trackVirtualPageview(path: string, title?: string)` — calls `window.history.pushState({}, '', path)` then dispatches a `popstate`-equivalent custom event. Also calls `posthog.capture('$pageview', { $current_url: ... })` so PostHog stays consistent.
- `trackEngagement(name: string, props?)` — thin wrapper around `posthog.capture` that also sets `sessionStorage['cd_engaged'] = '1'` and emits a `beforeunload`-safe `navigator.sendBeacon`-style ping is **not** needed; the pushState alone resolves Lovable's bounce calculation. We only keep the helper to centralize the call sites.
- Guards: no-op during SSR, swallow errors, never throw.

Paths used (clean, human-readable, all under `/`):
- `/` — Start Screen (initial load, already tracked)
- `/play` — entering the Game Loop (observation phase begins)
- `/summary` — Daily Summary shown
- `/practice` — Practice mode loop
- `/practice/results` — Practice Session Report

### 2. Fire virtual pageviews on phase transitions
File: `src/pages/Index.tsx`

- When `startRound` runs for daily mode → `trackVirtualPageview('/play')` (only on first round of the session, not on every round, to avoid inflating pageviews).
- When `showDailySummary` becomes true → `trackVirtualPageview('/summary')`.
- When practice mode starts → `trackVirtualPageview('/practice')`.
- When the Practice `SessionReport` opens → `trackVirtualPageview('/practice/results')`.
- When the user returns to the start screen (Main Menu / back arrow) → `trackVirtualPageview('/')`.

Implementation detail: do this inside the existing `useEffect`s that already react to `phase` / `showDailySummary` / `showSessionReport`, so we don't add new effects.

### 3. Engagement signals on key interactions
- "I'm Ready" button click → `trackEngagement('ready_clicked')`.
- First color selection of a round → `trackEngagement('first_color_selected')` (gated by a ref so it only fires once per round).
- "Verify" / round verified → already captured via `posthog.capture('Round Verified', ...)`; no change needed beyond ensuring it stays before any unmount.

These don't directly change Lovable's bounce metric, but they ensure PostHog session recordings/engagement stay accurate, and the second pageview from step 2 is what flips Lovable's bounce flag off.

### 4. Capture exit actions before unmount
File: `src/components/SessionReport.tsx` and Index share/play-again handlers.

- In `handleShareCard`, the `posthog.capture('practice_card_shared', ...)` already fires before `navigator.share` resolves — confirm it stays *before* the `await navigator.share(...)` call (currently it's after). Move it earlier so it isn't lost if the user dismisses the share sheet and then closes the tab.
- For "Play Again" / "Restart Session" / "Main Menu" buttons, wrap their handlers so the analytics call runs synchronously before the state change that may unmount the component. Use the new `trackEngagement` helper.

### 5. No changes to `index.html` or PostHog init
The Lovable analytics script is injected automatically on the published domain; we don't touch it. PostHog's `capture_pageview: true` already captures the initial load — virtual pageviews are added explicitly via `posthog.capture('$pageview', ...)` in the helper.

## Verification

1. Publish, open the live site, play one daily round.
2. In DevTools → Network, confirm a Lovable Analytics beacon fires on the `/play` and `/summary` transitions (not just `/`).
3. Wait for analytics to update (usually within a few minutes) and confirm bounce rate drops from ~50% toward a realistic value.
4. PostHog → Live events: confirm `$pageview` events for `/play`, `/summary`, `/practice`, `/practice/results`.

## Files touched

- New: `src/lib/analytics.ts`
- Edited: `src/pages/Index.tsx` (4–6 call sites)
- Edited: `src/components/SessionReport.tsx` (reorder share capture, wire helper into Restart/Main Menu)