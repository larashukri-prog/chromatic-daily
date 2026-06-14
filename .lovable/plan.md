## Goal

Replace the World Cup theme's daily flag data source with a single hardcoded `currentDayFlags` URL array in `FifaOverlay.tsx` that you edit by hand each day, and update the 9-slot allocation rules around the two anchors (White → Golden Cup, Black → Soccer Ball).

## Changes

### 1. `src/components/FifaOverlay.tsx` — hardcoded URL array

Add at the top:

```ts
// Update this array daily with the direct flag image URLs of teams playing.
const currentDayFlags: string[] = [
  "https://flagcdn.com/w320/es.png",
  "https://flagcdn.com/w320/cv.png",
  "https://flagcdn.com/w320/be.png",
  "https://flagcdn.com/w320/eg.png",
  "https://flagcdn.com/w320/sa.png",
  "https://flagcdn.com/w320/uy.png",
  "https://flagcdn.com/w320/ir.png",
  "https://flagcdn.com/w320/nz.png",
];
```

(Today's 8 unique teams — your message had `eg` and `uy` duplicated.)

### 2. Slot allocation rules (9 chromatic slots + White/Black anchors)

Rewrite `getFifaImageMap` so a slot can be `{ kind: 'flagUrl'; url: string }`, `{ kind: 'cup' }`, `{ kind: 'ball' }`, or absent. Driven by `currentDayFlags.length` (N):

- White anchor slot always → Cup; Black anchor slot always → Ball.
- **N ≥ 9**: first 9 URLs fill the 9 chromatic slots.
- **N = 8**: 8 URLs fill 8 chromatic slots; the 9th chromatic slot is randomly Cup or Ball (date-seeded so it's stable for the day).
- **N = 7**: 7 URLs fill 7 chromatic slots; remaining 2 chromatic slots are locked to Cup + Ball (date-seeded order).
- **N < 7** (knockouts): N URLs fill N chromatic slots; 2 more chromatic slots are locked to Cup + Ball; remaining chromatic slots are left empty (overlay returns `null`, raw chromatic color shows).
- **N = 0**: only the White/Black anchors render Cup/Ball; no chromatic slots get overlays.

Chromatic-slot assignment order remains date-seeded so it's stable per day.

### 3. Visual styling (option B)

Render flag URLs with:

```tsx
<img
  src={entry.url}
  alt=""
  aria-hidden
  loading="lazy"
  className="w-full h-full rounded-full object-cover border border-gray-200"
/>
```

Wrapped in the existing `absolute inset-0` container so it fills the slot at any size.

### 4. Cleanup

- Delete `src/data/fifaDailyFlags.ts`.
- Remove unused imports from `FifaOverlay.tsx` (`getFlagsForDate`, `FIFA_QUALIFIED_TEAMS`, `TeamCode`). Keep `dailySeededShuffle` for the Cup/Ball coin-flip ordering, or inline a tiny date-seeded picker.
- `src/data/fifaSchedule.ts` left untouched (other modules may still import constants from it).

## Out of scope

No changes to game logic, color palette, scoring, persistence, analytics, or the Cup/Ball assets.
