import { FIFA_QUALIFIED_TEAMS, toIsoDate, type TeamCode } from './fifaSchedule';

/** TheSportsDB free, public, CORS-enabled. Free key is the literal "3".
 *  Free tier rejects the `l=` league parameter, so we fetch all soccer events
 *  for the day and filter to the FIFA World Cup league client-side. */
const ENDPOINT = 'https://www.thesportsdb.com/api/v1/json/3/eventsday.php';
const TARGET_LEAGUE = 'fifa world cup';
const CACHE_PREFIX = 'fifa-teams-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface FifaTeamData {
  today: TeamCode[];
  week: TeamCode[];
  loading: boolean;
  error: string | null;
  source: 'api' | 'fallback' | 'cache';
}

/** Country / team name → ISO 3166-1 alpha-2 (lowercase) for flagcdn.
 *  Covers the realistic WC 2026 field plus common TheSportsDB name variants. */
const NAME_TO_ISO: Record<string, TeamCode> = {
  // Hosts
  'united states': 'us', 'usa': 'us', 'us': 'us',
  'mexico': 'mx',
  'canada': 'ca',
  // UEFA
  'france': 'fr', 'spain': 'es', 'england': 'gb-eng', 'portugal': 'pt',
  'germany': 'de', 'italy': 'it', 'netherlands': 'nl', 'holland': 'nl',
  'belgium': 'be', 'croatia': 'hr', 'denmark': 'dk', 'switzerland': 'ch',
  'poland': 'pl', 'serbia': 'rs', 'austria': 'at', 'norway': 'no',
  'turkey': 'tr', 'turkiye': 'tr', 'türkiye': 'tr',
  // CONMEBOL
  'brazil': 'br', 'argentina': 'ar', 'uruguay': 'uy', 'colombia': 'co',
  'ecuador': 'ec', 'paraguay': 'py', 'peru': 'pe', 'bolivia': 'bo',
  'venezuela': 've', 'chile': 'cl',
  // CAF
  'morocco': 'ma', 'senegal': 'sn', 'egypt': 'eg', 'nigeria': 'ng',
  'tunisia': 'tn', 'algeria': 'dz',
  'ivory coast': 'ci', "côte d'ivoire": 'ci', "cote d'ivoire": 'ci', 'cote d ivoire': 'ci',
  'cameroon': 'cm', 'ghana': 'gh', 'south africa': 'za',
  // AFC
  'japan': 'jp', 'south korea': 'kr', 'korea republic': 'kr', 'korea': 'kr',
  'australia': 'au', 'saudi arabia': 'sa', 'iran': 'ir', 'ir iran': 'ir',
  'qatar': 'qa', 'iraq': 'iq', 'uzbekistan': 'uz', 'jordan': 'jo',
  // CONCACAF
  'costa rica': 'cr', 'panama': 'pa', 'jamaica': 'jm',
  'curacao': 'cw', 'curaçao': 'cw',
  'haiti': 'ht', 'honduras': 'hn',
  'el salvador': 'sv', 'guatemala': 'gt', 'trinidad and tobago': 'tt', 'suriname': 'sr',
  // UEFA non-qualifiers that may appear in pre-WC friendlies
  'scotland': 'gb-sct', 'wales': 'gb-wls', 'northern ireland': 'gb-nir',
  'republic of ireland': 'ie', 'ireland': 'ie',
  'sweden': 'se', 'finland': 'fi', 'iceland': 'is', 'romania': 'ro',
  'ukraine': 'ua', 'czech republic': 'cz', 'czechia': 'cz', 'greece': 'gr',
  'hungary': 'hu', 'slovakia': 'sk', 'slovenia': 'si', 'albania': 'al',
  'north macedonia': 'mk', 'bulgaria': 'bg', 'georgia': 'ge', 'armenia': 'am',
  'bosnia and herzegovina': 'ba', 'montenegro': 'me', 'kosovo': 'xk',
  'cape verde': 'cv',
  // OFC
  'new zealand': 'nz', 'new caledonia': 'nc',
};

function normaliseName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const warnedUnknown = new Set<string>();
function nameToIso(name: string | null | undefined): TeamCode | null {
  if (!name) return null;
  const cleaned = normaliseName(name);
  if (!cleaned || cleaned === 'tbd' || cleaned.includes('to be')) return null;
  const iso = NAME_TO_ISO[cleaned];
  if (!iso && !warnedUnknown.has(cleaned)) {
    warnedUnknown.add(cleaned);
    console.warn(`[FIFA] Unknown team name from API: "${name}" — add to NAME_TO_ISO`);
  }
  return iso ?? null;
}

interface SportsDbEvent {
  strHomeTeam?: string;
  strAwayTeam?: string;
  strLeague?: string;
}

async function fetchDay(date: Date): Promise<TeamCode[]> {
  const iso = toIsoDate(date);
  const url = `${ENDPOINT}?d=${iso}&s=Soccer`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { events?: SportsDbEvent[] | null };
  const teams = new Set<TeamCode>();
  for (const ev of json.events ?? []) {
    const league = (ev.strLeague ?? '').toLowerCase();
    if (!league.includes(TARGET_LEAGUE)) continue;
    const h = nameToIso(ev.strHomeTeam);
    const a = nameToIso(ev.strAwayTeam);
    if (h) teams.add(h);
    if (a) teams.add(a);
  }
  return Array.from(teams);
}

function readCache(key: string): { today: TeamCode[]; week: TeamCode[] } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, today, week } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return { today, week };
  } catch { return null; }
}

function writeCache(key: string, today: TeamCode[], week: TeamCode[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), today, week }));
  } catch { /* quota — ignore */ }
}

/** Fetch teams playing on `date` and across the 7-day window centered on it.
 *  Cached per calendar day in localStorage. Never throws — falls back to
 *  an empty result so the overlay can use its shuffled qualifier pool. */
export async function fetchFifaTeamsForDate(date: Date): Promise<FifaTeamData> {
  const iso = toIsoDate(date);
  const cacheKey = `${CACHE_PREFIX}${iso}`;

  const cached = readCache(cacheKey);
  if (cached) {
    return { today: cached.today, week: cached.week, loading: false, error: null, source: 'cache' };
  }

  try {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    const results = await Promise.all(
      offsets.map((o) => {
        const d = new Date(date);
        d.setDate(d.getDate() + o);
        return fetchDay(d).catch(() => [] as TeamCode[]);
      }),
    );
    const today = results[3];
    const weekSet = new Set<TeamCode>();
    results.forEach((r) => r.forEach((t) => weekSet.add(t)));
    const week = Array.from(weekSet);
    writeCache(cacheKey, today, week);
    return { today, week, loading: false, error: null, source: 'api' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[FIFA] live fetch failed — using fallback pool:', msg);
    return {
      today: [],
      week: [...FIFA_QUALIFIED_TEAMS],
      loading: false,
      error: msg,
      source: 'fallback',
    };
  }
}

export const EMPTY_TEAM_DATA: FifaTeamData = {
  today: [],
  week: [],
  loading: true,
  error: null,
  source: 'fallback',
};