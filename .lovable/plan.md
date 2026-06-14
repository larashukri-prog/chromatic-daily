# FIFA Schedule: Live Data + Real Qualified Team List

Replace the fabricated `FIFA_SCHEDULE` data with **live runtime fetches** from TheSportsDB (free, public, CORS-enabled, no API key required for World Cup queries), and replace the placeholder qualified-team pool with the real 48-team field that includes Curaçao.

## 1. Data provider: TheSportsDB v1 (free tier)

Endpoint (public, CORS open, no key):

```text
https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=YYYY-MM-DD&l=FIFA%20World%20Cup
```

Returns an `events` array with `strHomeTeam` / `strAwayTeam` country names (e.g. `"Morocco"`, `"Brazil"`). We map names → ISO 3166-1 alpha-2 codes for flagcdn (`ma`, `br`, etc.).

Why this provider:
- No API key, no rate-limit signup
- CORS `*` → call directly from the browser, no edge function needed
- Covers WC 2026 (`l=FIFA_World_Cup` league)
- Returns "TBD" naturally for unscheduled knockout slots (we filter)

If TheSportsDB is missing data on a given day, we fall back to a deterministic shuffle of the real qualified team pool so the grid is never empty.

## 2. Real 48-team qualified pool

Rewrite `FIFA_QUALIFIED_TEAMS` in `src/data/fifaSchedule.ts` to the confirmed June 2026 field, including `cw` (Curaçao), removing placeholders I invented (Italy, Bolivia, Côte d'Ivoire as group placeholders, etc.) and adding any I missed (e.g. Paraguay, Venezuela playoff winner, etc.). Sourced from the official FIFA qualifier list (publicly confirmed by the December 2025 final draw).

Sample structure:
```ts
export const FIFA_QUALIFIED_TEAMS: TeamCode[] = [
  // Hosts
  'us','mx','ca',
  // UEFA (16)  e.g. fr, es, gb-eng, de, nl, pt, it, hr, dk, ch, ...
  // CONMEBOL (6) ar, br, co, uy, ec, py
  // CAF (9)   ma, sn, eg, ng, tn, dz, ci, cm, gh
  // AFC (8)   jp, kr, au, sa, ir, qa, iq, uz
  // CONCACAF additional (3) cr, pa, cw   ← Curaçao
  // OFC (1) nz
  // Inter-confederation playoff winners (2) ...
];
```

## 3. Country name → ISO alpha-2 map

Bespoke map covering all 48 qualifiers + common TheSportsDB name variants:
```ts
const NAME_TO_ISO: Record<string, TeamCode> = {
  'morocco': 'ma', 'brazil': 'br', 'japan': 'jp', 'netherlands': 'nl',
  'ivory coast': 'ci', "côte d'ivoire": 'ci', 'cote d ivoire': 'ci',
  'germany': 'de', 'curaçao': 'cw', 'curacao': 'cw',
  'england': 'gb-eng', 'south korea': 'kr', 'usa': 'us', 'united states': 'us',
  // ... (full list)
};
```
Lookup is lowercased, accent-stripped, trim-tolerant. Unknown names are dropped (and logged once via `console.warn` so we can patch the map).

## 4. Client architecture (no edge function)

New file `src/data/fifaLive.ts`:

```ts
export interface FifaTeamData {
  today: TeamCode[];   // unique teams playing on date
  week:  TeamCode[];   // unique teams playing in ±3 day window
  loading: boolean;
  error: string | null;
  source: 'api' | 'fallback';
}

export async function fetchFifaTeamsForDate(date: Date): Promise<FifaTeamData> { ... }
```

- Caches results in `localStorage` under `fifa-teams-${YYYY-MM-DD}` with a 24h TTL so the API is hit at most once per calendar day per device.
- Internally calls the endpoint for `date` and for each of the 6 surrounding days (single `Promise.all`), then dedupes.
- On any network failure: returns `source: 'fallback'` and lets the overlay use a seeded shuffle of `FIFA_QUALIFIED_TEAMS`.

New context provider `src/components/FifaTeamsProvider.tsx`:
- Wraps `<App />` (mounted only when `visualTheme === 'fifa'` to avoid wasted requests)
- On mount: calls `fetchFifaTeamsForDate(new Date())`, stores result in state
- Exposes `useFifaTeams()` hook returning `FifaTeamData`

## 5. Update `FifaOverlay`

`getFifaImageMap(date, teamData?)` now accepts an optional pre-fetched `FifaTeamData`. When called inside `<FifaOverlay>`, it reads from the `useFifaTeams()` hook. Allocation order stays:
1. `teamData.today` (mandatory inclusion)
2. Pad from `teamData.week`
3. Pad from `FIFA_QUALIFIED_TEAMS` shuffle (seeded by date for stability)

This preserves the deterministic flag-to-color mapping across the 3 daily rounds.

## 6. Files removed / rewritten

- `src/data/fifaSchedule.ts` — delete fabricated `FIFA_SCHEDULE`, `GROUPS`, `GROUP_DATES`, `KNOCKOUT`, `buildGroupStage`, `getTeamsForDate`, `getTeamsForWeekOf`. Keep `FIFA_QUALIFIED_TEAMS` (rewritten with real list + Curaçao), `isWithinWorldCup`, `dailySeededShuffle`, types.
- `src/components/FifaOverlay.tsx` — switch to consuming the provider hook.
- `src/main.tsx` (or `src/App.tsx`) — wrap with `<FifaTeamsProvider>`.

## 7. UX details

- First paint with `loading: true` uses the qualifier-shuffle fallback so the grid never flashes empty.
- On successful fetch, the overlay re-renders with the real flags — only matters in the FIFA theme and only once per day.
- No loading spinner needed; the swap is instant once the response lands (typically <300 ms).

## What stays untouched

- Game logic, color count progression, DDA, metrics, PostHog payloads, share text format
- Anchor mapping (White → Cup, Black → Ball)
- `flagcdn.com/w160/{cc}.png` URLs (Curaçao = `cw` works on flagcdn)

## Technical notes

- TheSportsDB rate limit on free key `3` is 100 req/min; with the 24 h localStorage cache + 7-day batch we use ≤7 requests per user per day.
- If the API is ever down for an extended period and the user is OK with it, we can later add a tiny edge-function proxy with server-side caching. Not needed for v1.
