// FIFA World Cup 2026 schedule data (June 11 – July 19, 2026).
// 48 teams, 12 groups of 4. Group stage uses a deterministic round-robin spread
// across matchdays. Knockout dates use the published FIFA 2026 calendar.

/** ISO 3166-1 alpha-2 country code (lowercase for flagcdn) */
export type TeamCode = string;

export interface FifaMatch {
  /** ISO yyyy-mm-dd */
  date: string;
  home: TeamCode;
  away: TeamCode;
}

/** 48-team pool (host nations + plausible qualifiers / continental confederation slots). */
export const FIFA_QUALIFIED_TEAMS: TeamCode[] = [
  // Hosts
  'us', 'mx', 'ca',
  // UEFA (16)
  'fr', 'es', 'gb-eng', 'pt', 'de', 'it', 'nl', 'be', 'hr', 'dk', 'ch', 'pl', 'rs', 'at', 'no', 'tr',
  // CONMEBOL (6)
  'br', 'ar', 'uy', 'co', 'ec', 'pe',
  // CAF (9)
  'ma', 'sn', 'eg', 'ng', 'tn', 'dz', 'ci', 'cm', 'gh',
  // AFC (8)
  'jp', 'kr', 'au', 'sa', 'ir', 'qa', 'iq', 'uz',
  // CONCACAF (3 more)
  'cr', 'pa', 'jm',
  // OFC (1)
  'nz',
  // Inter-confederation playoff winners (2)
  'cd', 'bo',
];

/** Group structure — 12 groups of 4 (A–L). */
const GROUPS: TeamCode[][] = [
  ['mx', 'tn', 'au', 'cd'],   // A
  ['ca', 'eg', 'kr', 'bo'],   // B
  ['us', 'ng', 'jp', 'jm'],   // C
  ['fr', 'gh', 'sa', 'nz'],   // D
  ['es', 'ci', 'iq', 'cr'],   // E
  ['gb-eng', 'sn', 'uz', 'pa'], // F
  ['pt', 'cm', 'ir', 'ec'],   // G
  ['de', 'ma', 'qa', 'pe'],   // H
  ['it', 'dz', 'au', 'co'],   // I (au listed twice ok? swap)
  ['nl', 'tr', 'no', 'uy'],   // J
  ['be', 'at', 'rs', 'ar'],   // K
  ['br', 'hr', 'dk', 'pl'],   // L
];
// fix duplicate
GROUPS[8] = ['it', 'dz', 'ch', 'co'];

const GROUP_DATES: string[][] = [
  // 6 round-robin matches per group, spread over 3 matchdays.
  // Matchday 1: Jun 11-16, MD2: Jun 17-22, MD3: Jun 23-27.
  ['2026-06-11', '2026-06-17', '2026-06-23'], // A
  ['2026-06-12', '2026-06-18', '2026-06-23'], // B
  ['2026-06-12', '2026-06-18', '2026-06-24'], // C
  ['2026-06-13', '2026-06-19', '2026-06-24'], // D
  ['2026-06-13', '2026-06-19', '2026-06-25'], // E
  ['2026-06-14', '2026-06-20', '2026-06-25'], // F
  ['2026-06-14', '2026-06-20', '2026-06-26'], // G
  ['2026-06-15', '2026-06-21', '2026-06-26'], // H
  ['2026-06-15', '2026-06-21', '2026-06-27'], // I
  ['2026-06-16', '2026-06-22', '2026-06-27'], // J
  ['2026-06-16', '2026-06-22', '2026-06-23'], // K
  ['2026-06-17', '2026-06-19', '2026-06-24'], // L
];

function buildGroupStage(): FifaMatch[] {
  const matches: FifaMatch[] = [];
  GROUPS.forEach((g, idx) => {
    const [d1, d2, d3] = GROUP_DATES[idx];
    // MD1: team[0] v team[1], team[2] v team[3]
    matches.push({ date: d1, home: g[0], away: g[1] });
    matches.push({ date: d1, home: g[2], away: g[3] });
    // MD2: team[0] v team[2], team[1] v team[3]
    matches.push({ date: d2, home: g[0], away: g[2] });
    matches.push({ date: d2, home: g[1], away: g[3] });
    // MD3 (simultaneous): team[0] v team[3], team[1] v team[2]
    matches.push({ date: d3, home: g[0], away: g[3] });
    matches.push({ date: d3, home: g[1], away: g[2] });
  });
  return matches;
}

/** Knockout stage placeholder dates. Teams resolved per round; we just pre-populate
 *  representative matchups from likely group winners so the overlay has flags to show. */
const KNOCKOUT: FifaMatch[] = [
  // Round of 32 (Jun 29 – Jul 3)
  { date: '2026-06-29', home: 'mx', away: 'pl' },
  { date: '2026-06-29', home: 'ca', away: 'tr' },
  { date: '2026-06-30', home: 'us', away: 'sn' },
  { date: '2026-06-30', home: 'fr', away: 'rs' },
  { date: '2026-07-01', home: 'es', away: 'no' },
  { date: '2026-07-01', home: 'gb-eng', away: 'ec' },
  { date: '2026-07-02', home: 'pt', away: 'jp' },
  { date: '2026-07-02', home: 'de', away: 'kr' },
  { date: '2026-07-03', home: 'it', away: 'ma' },
  { date: '2026-07-03', home: 'nl', away: 'co' },
  { date: '2026-07-03', home: 'be', away: 'uy' },
  { date: '2026-07-03', home: 'br', away: 'cm' },
  // Round of 16 (Jul 4–7)
  { date: '2026-07-04', home: 'mx', away: 'tr' },
  { date: '2026-07-04', home: 'us', away: 'fr' },
  { date: '2026-07-05', home: 'es', away: 'gb-eng' },
  { date: '2026-07-05', home: 'pt', away: 'de' },
  { date: '2026-07-06', home: 'it', away: 'nl' },
  { date: '2026-07-06', home: 'be', away: 'br' },
  { date: '2026-07-07', home: 'ar', away: 'ng' },
  { date: '2026-07-07', home: 'hr', away: 'dk' },
  // QF (Jul 9–11)
  { date: '2026-07-09', home: 'mx', away: 'us' },
  { date: '2026-07-09', home: 'es', away: 'pt' },
  { date: '2026-07-11', home: 'it', away: 'be' },
  { date: '2026-07-11', home: 'ar', away: 'hr' },
  // SF (Jul 14–15)
  { date: '2026-07-14', home: 'mx', away: 'es' },
  { date: '2026-07-15', home: 'it', away: 'ar' },
  // 3rd place (Jul 18) + Final (Jul 19)
  { date: '2026-07-18', home: 'us', away: 'pt' },
  { date: '2026-07-19', home: 'es', away: 'ar' },
];

export const FIFA_SCHEDULE: FifaMatch[] = [...buildGroupStage(), ...KNOCKOUT];

const WC_START = new Date('2026-06-11T00:00:00');
const WC_END = new Date('2026-07-19T23:59:59');

export function isWithinWorldCup(d: Date): boolean {
  return d >= WC_START && d <= WC_END;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Unique team codes playing on the given calendar date (deduped). */
export function getTeamsForDate(d: Date): TeamCode[] {
  const iso = toIsoDate(d);
  const teams = new Set<TeamCode>();
  for (const m of FIFA_SCHEDULE) {
    if (m.date === iso) {
      teams.add(m.home);
      teams.add(m.away);
    }
  }
  return Array.from(teams);
}

/** Unique team codes playing in the 7-day window around the given date. */
export function getTeamsForWeekOf(d: Date): TeamCode[] {
  const teams = new Set<TeamCode>();
  for (let offset = -3; offset <= 3; offset++) {
    const day = new Date(d);
    day.setDate(day.getDate() + offset);
    for (const t of getTeamsForDate(day)) teams.add(t);
  }
  return Array.from(teams);
}

/** Deterministic shuffle (Fisher–Yates seeded by date) so the same day always
 *  produces the same flag-to-color mapping across rounds. */
export function dailySeededShuffle<T>(arr: T[], date: Date): T[] {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}