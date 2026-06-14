# FIFA World Cup Theme Swap

Replace the existing "Knicks" visual theme with a "FIFA" theme. Preserves every aspect of game logic: the Mon→Sun color-count progression (2→9), DDA, metrics, PostHog hooks, share format, and 3-round daily loop. Only visual mapping + theme labels change.

## 1. Schedule data (`src/data/fifaSchedule.ts`)

New module exporting the FIFA World Cup 2026 fixture list (June 11 – July 19, 2026):

```ts
export interface FifaMatch { date: string; home: string; away: string; }  // ISO yyyy-mm-dd, ISO 3166-1 alpha-2 codes
export const FIFA_SCHEDULE: FifaMatch[] = [ ... ];
export const FIFA_QUALIFIED_TEAMS: string[] = [ ... ];  // 48-team pool for fallback
export function getTeamsForDate(d: Date): string[];       // unique team codes, deduped
export function getTeamsForWeekOf(d: Date): string[];     // 7-day window for knockout padding
export function isWithinWorldCup(d: Date): boolean;
```

The group-stage portion (matchdays + teams) is well-known; knockout bracket dates use FIFA's published schedule with `TBD` teams filtered out.

## 2. Theme map builder (`src/components/FifaOverlay.tsx`)

Replaces `KnicksOverlay.tsx`. Same render contract — `<FifaOverlay colorHex={hex} />` — but the hex→image map is **built per render-day**, not static.

```ts
import { Trophy } from 'lucide-react';                          // anchors via lucide
// flagcdn.com served at 80px width; rounded with subtle ring
const flagUrl = (code: string) => `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
```

Builder function `getFifaImageMap(date: Date): Record<string, { kind: 'flag'|'cup'|'ball'; src?: string; code?: string }>` applied to the 9 hex slots:

Anchor mapping is **strict and reserved**:
- `#FFFFFF` (White) → 🏆 Golden Cup (lucide `Trophy` filled gold)
- `#000000` (Black) → ⚽ Soccer Ball (inline SVG, classic black/white pentagon ball)

Flag-to-hex allocation algorithm:
1. `teams = unique(getTeamsForDate(today))`
2. If out-of-window: `teams = shuffle(FIFA_QUALIFIED_TEAMS).slice(0, 7)` (anchors fill 8 & 9)
3. If `teams.length < 7`: pull additional unique team codes from `getTeamsForWeekOf(today)` until exactly 7 flags
4. If `teams.length >= 7`: take first 7 (preserves the "mandatory inclusion" rule for today's matches first; week-fillers only used when short)
5. Assign 7 flags deterministically to the 7 chromatic hex slots (stable seeded by date so the same day shows the same mapping across rounds)
6. Anchors keep their fixed white/black slots regardless

`FifaOverlay` renders:
- Flag: `<img src={flagUrl} className="… rounded-full ring-1 ring-black/10 shadow-sm">` (subtle border prevents white-edge bleed)
- Cup: lucide `Trophy` over solid white background
- Ball: inline soccer-ball SVG over solid white background

## 3. Theme registration

`src/hooks/useAccessibility.tsx`:
- `VisualTheme` union: `'colors' | 'patterns' | 'shapes' | 'fifa'`
- Replace `{ value: 'knicks', label: 'Knicks' }` with `{ value: 'fifa', label: 'FIFA' }`
- Update `loadInitial` migration: if stored value is `'knicks'`, migrate to `'fifa'`

## 4. Rename `knicks` → `fifa` everywhere

Mechanical replacement of identifier/literal across:
- `src/lib/game.ts` — type unions in `RoundAttempt`, `saveRoundAttempt`, `getResultMessage`; rename local `knicks` var to `fifa`
- `src/components/GameGrid.tsx` — rename var, swap import to `FifaOverlay`
- `src/components/DailySummary.tsx` — rename vars; copy updates: `'Game Over — Swish!'` → `'Full Time — Goal!'`; `'Championship Game complete! Tip-off resets tomorrow.'` → `'Final whistle! Kickoff resets tomorrow.'`; `'Tomorrow's tip-off…'` → `'Tomorrow's kickoff brings a tougher matchup!'`
- `src/pages/Index.tsx` — rename `knicksMode`/`knicksCelebrationKey`/`fireKnicksCelebration`, swap import; replace Knicks blue (`#006BB6`) buttons with FIFA primary color (`#326295` — official FIFA blue); update `'Swish! Run it back?'` → `'Goal! Run it back?'`; confetti palette → FIFA blue + gold
- `KnicksOverlay.tsx` deleted; `src/assets/knicks/*` folder deleted in full (all 10 `.asset.json` pointers + their CDN assets via `assets--delete_asset`)

## 5. Share text (`src/lib/game.ts` — `generateShareText`)

Visual-style label comes from `getVisualThemeLabel()`. Renaming the option to `'FIFA'` automatically produces `🎨 Visual Style: FIFA` in clipboard output. Score/win-loss/grid emoji format untouched. No other share-text changes.

## 6. Memory update

Update `mem://style/color-palette` and add `mem://features/fifa-theme` describing the new schedule-driven mapping. Remove Knicks references from index.

## What is NOT changing

- `generateSolution` / `generateSolutionDDA` — palette generation unchanged
- Mon→Sun color-count progression
- DDA difficulty boosts, round logic, 3-attempts/day, calendar locking
- Timer scaling, metrics (Reflex Avg / Peak / Consistency / Tiles Decoded)
- PostHog event names and payload schemas (only the `visual_style` value string changes from `'knicks'` to `'fifa'`)
- Result modal behavior, onboarding, share grid emoji format

## Technical notes

- flagcdn.com is a stable static CDN (no API key); 2D flat round flag PNGs at `/w160/{cc}.png`. Long-cache headers. No CORS issues for `<img>`.
- Seeded date-based flag assignment ensures rounds 1/2/3 of the same day show identical flag-to-color mapping, preserving the "memorize then recall" mechanic.
- Today (June 14, 2026) falls within the World Cup window, so the FIFA theme will show real matchday flags immediately after build.
