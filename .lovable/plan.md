# FIFA: Manual per-day flag map + new anchor assets

## What changes

1. **Manual per-day flag schedule** replaces the live TheSportsDB fetch. You give me the daily team list; I hardcode it.
2. **Anchors swap to your uploaded images**: golden trophy PNG → White, patterned soccer ball PNG → Black. Inline SVG `GoldenCup` and `SoccerBall` components are removed.

## Day 1 of the manual schedule

**Monday June 15, 2026** — Spain, Cabo Verde, Belgium, Egypt, Saudi Arabia, Uruguay, Iran, New Zealand (8 teams; 9th slot filled deterministically from the qualified pool so every chromatic color has a flag if it appears).

## Files

- **New** `src/data/fifaDailyFlags.ts`
  ```ts
  // ISO alpha-2 codes for flagcdn
  export const FIFA_DAILY_FLAGS: Record<string, TeamCode[]> = {
    '2026-06-15': ['es','cv','be','eg','sa','uy','ir','nz'],
    // add more days here as you provide them
  };
  export function getFlagsForDate(date: Date): TeamCode[] | null { ... }
  ```
  Key format `YYYY-MM-DD` in local time (matches the rest of the game's daily-key logic).

- **Upload anchor assets via `lovable-assets`** (from `/mnt/user-uploads/`):
  - `src/assets/fifa/cup.png.asset.json`
  - `src/assets/fifa/ball.png.asset.json`

- **Edit** `src/components/FifaOverlay.tsx`:
  - Remove `GoldenCup` and `SoccerBall` SVG components.
  - Import the two `.asset.json` pointers and render `<img src={cupAsset.url}>` / `<img src={ballAsset.url}>` for the cup/ball slots (same `absolute inset-0 object-contain` sizing, small padding).
  - In `getFifaImageMap`: replace the `teamData`/`week`/seeded-shuffle pool with `getFlagsForDate(date) ?? dailySeededShuffle(FIFA_QUALIFIED_TEAMS, date)`. Padding remainder still comes from the qualified pool so all 9 slots are covered.

- **Edit** `src/components/FifaOverlay.tsx` callsite: drop `useFifaTeams()` usage.

- **Delete**:
  - `src/data/fifaLive.ts`
  - `src/components/FifaTeamsProvider.tsx`
  - Provider wrap in `src/App.tsx`

## Preserved

Game state machine, 3-round logic, metrics, PostHog payloads, color count progression, deterministic per-date flag → color assignment, `FIFA_QUALIFIED_TEAMS` pool (still used as fallback for undefined days), `isWithinWorldCup`, `dailySeededShuffle`.

## Open question

For days you haven't specified yet (e.g. today, June 14), the overlay falls back to a deterministic shuffle of the 48-team qualified pool — same behavior as before. Confirm that's fine, or tell me to render no flags (chromatic colors only) on unspecified days.
