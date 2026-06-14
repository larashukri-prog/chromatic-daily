// FIFA World Cup 2026 helpers + fallback team pool.
// Live fixture data is fetched at runtime (see src/data/fifaLive.ts).
// This file only exposes the qualified-team fallback list, types, the
// in-window date check, and a deterministic shuffle used by FifaOverlay
// when the live API is unavailable.

/** ISO 3166-1 alpha-2 country code (lowercase for flagcdn) */
export type TeamCode = string;

export interface FifaMatch {
  /** ISO yyyy-mm-dd */
  date: string;
  home: TeamCode;
  away: TeamCode;
}

/** Real 48-team field for FIFA World Cup 2026 (best-effort, includes Curaçao).
 *  Used as a fallback when the live fixture API can't tell us who is playing. */
export const FIFA_QUALIFIED_TEAMS: TeamCode[] = [
  // Hosts
  'us', 'mx', 'ca',
  // UEFA (16)
  'fr', 'es', 'gb-eng', 'pt', 'de', 'it', 'nl', 'be', 'hr', 'dk', 'ch', 'pl', 'rs', 'at', 'no', 'tr',
  // CONMEBOL (6)
  'br', 'ar', 'uy', 'co', 'ec', 'py',
  // CAF (9)
  'ma', 'sn', 'eg', 'ng', 'tn', 'dz', 'ci', 'cm', 'gh',
  // AFC (8)
  'jp', 'kr', 'au', 'sa', 'ir', 'qa', 'iq', 'uz',
  // CONCACAF (3 more) — incl. Curaçao (cw)
  'cr', 'pa', 'cw',
  // OFC (1)
  'nz',
  // Inter-confederation playoff winners (2)
  'bo', 'nc',
];

const WC_START = new Date('2026-06-11T00:00:00');
const WC_END = new Date('2026-07-19T23:59:59');

export function isWithinWorldCup(d: Date): boolean {
  return d >= WC_START && d <= WC_END;
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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