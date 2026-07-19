## Reset local state so you can replay today's daily + Practice

Today's daily result is locked in `localStorage` (key `chromatic-daily`) once you finish all 3 attempts — that's why the app keeps showing the last result. The project already ships two safe ways to clear it; no code changes needed.

### Option 1 — one-shot URL reset (recommended)

Open the preview with the reset query param appended:

```
/play?reset
```

This clears the `chromatic-daily` local storage entry on load, then drops you back at a fresh daily attempt 1. Practice Mode uses no persistence, so it always starts clean.

### Option 2 — manual clear from DevTools

In the preview browser: DevTools → Application → Local Storage → your preview origin → delete the `chromatic-daily` key → reload.

### If you also want a persistent in-app reset button

Say the word and I'll add a small dev-only "Reset today" affordance to the UI (already scoped by the existing test-utilities memory). Otherwise, `?reset` is the fastest path and doesn't touch code.

### Out of scope

No code changes in this plan — this is a "how to unstick your test session" walkthrough. If you want the dev button added, approve and tell me and I'll follow up with a build-mode change.
