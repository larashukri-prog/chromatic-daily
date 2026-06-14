import {
  FIFA_QUALIFIED_TEAMS,
  dailySeededShuffle,
  getTeamsForDate,
  getTeamsForWeekOf,
  isWithinWorldCup,
  type TeamCode,
} from '@/data/fifaSchedule';

/** Chromatic anchors mapped strictly: White → Golden Cup, Black → Soccer Ball. */
const WHITE = '#FFFFFF';
const BLACK = '#000000';

/** The 9 chromatic hex slots (in COLORS order) that flags can occupy. */
const FLAG_SLOT_HEXES: string[] = [
  '#EF4444', // Red
  '#FDE047', // Yellow
  '#2DD4D4', // Teal
  '#FD9349', // Orange
  '#8B5CF6', // Purple
  '#7AC00F', // Lime
  '#3F6212', // Green
  '#F198C4', // Pink
  '#2563EB', // Blue
];

type SlotEntry =
  | { kind: 'flag'; code: TeamCode }
  | { kind: 'cup' }
  | { kind: 'ball' };

const flagUrl = (code: TeamCode) => `https://flagcdn.com/w160/${code.toLowerCase()}.png`;

/** Build the per-day hex → asset map.
 *  - White anchor → Cup
 *  - Black anchor → Ball
 *  - All 9 chromatic slots get flag assignments (deterministic per date),
 *    so that whichever colors the daily puzzle generator selects, every slot
 *    has a flag ready. Match-day teams come first; week-fill / qualifier pool
 *    pads the remainder. */
export function getFifaImageMap(date: Date = new Date()): Record<string, SlotEntry> {
  const map: Record<string, SlotEntry> = {
    [WHITE]: { kind: 'cup' },
    [BLACK]: { kind: 'ball' },
  };

  // Build the day's flag pool (deduped, mandatory inclusion first).
  const pool: TeamCode[] = [];
  const seen = new Set<TeamCode>();
  const push = (codes: TeamCode[]) => {
    for (const c of codes) {
      if (!seen.has(c)) { seen.add(c); pool.push(c); }
    }
  };

  if (isWithinWorldCup(date)) {
    push(getTeamsForDate(date));            // mandatory: today's teams
    if (pool.length < FLAG_SLOT_HEXES.length) {
      push(getTeamsForWeekOf(date));        // pad with this week's teams
    }
    if (pool.length < FLAG_SLOT_HEXES.length) {
      push(dailySeededShuffle(FIFA_QUALIFIED_TEAMS, date));
    }
  } else {
    // Out-of-window: 9 random flags from the qualifier pool, anchors still shown.
    push(dailySeededShuffle(FIFA_QUALIFIED_TEAMS, date));
  }

  // Assign to chromatic hex slots in a deterministic order.
  const ordered = dailySeededShuffle(pool, date).slice(0, FLAG_SLOT_HEXES.length);
  FLAG_SLOT_HEXES.forEach((hex, i) => {
    const code = ordered[i] ?? FIFA_QUALIFIED_TEAMS[i % FIFA_QUALIFIED_TEAMS.length];
    map[hex] = { kind: 'flag', code };
  });

  return map;
}

interface FifaOverlayProps {
  colorHex: string | null;
  className?: string;
  /** Optional override (used by share-modal previews). */
  date?: Date;
}

/** Inline soccer ball — classic black/white pentagon pattern, scales to fill. */
function SoccerBall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx="32" cy="32" r="30" fill="#FFFFFF" stroke="#111" strokeWidth="2" />
      <polygon points="32,16 40,22 37,32 27,32 24,22" fill="#111" />
      <polygon points="32,16 24,22 16,18 18,10 28,10" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
      <polygon points="32,16 40,22 48,18 46,10 36,10" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
      <polygon points="27,32 24,22 16,18 12,28 18,36" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
      <polygon points="37,32 40,22 48,18 52,28 46,36" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
      <polygon points="27,32 18,36 22,46 32,46 32,40" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
      <polygon points="37,32 46,36 42,46 32,46 32,40" fill="#FFFFFF" stroke="#111" strokeWidth="1.2" />
    </svg>
  );
}

/** Inline golden trophy — World Cup style silhouette. */
function GoldenCup({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="goldgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="50%" stopColor="#E8A93B" />
          <stop offset="100%" stopColor="#8C5A1A" />
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path
        d="M22 10 h20 v10 c0 8 -4 14 -10 16 c-6 -2 -10 -8 -10 -16 z"
        fill="url(#goldgrad)"
        stroke="#7A4A14"
        strokeWidth="1.2"
      />
      {/* Handles */}
      <path d="M22 14 c-6 0 -8 4 -8 8 c0 4 4 6 8 6" fill="none" stroke="url(#goldgrad)" strokeWidth="2.5" />
      <path d="M42 14 c6 0 8 4 8 8 c0 4 -4 6 -8 6" fill="none" stroke="url(#goldgrad)" strokeWidth="2.5" />
      {/* Stem + base */}
      <rect x="28" y="36" width="8" height="8" fill="url(#goldgrad)" stroke="#7A4A14" strokeWidth="1" />
      <rect x="20" y="44" width="24" height="6" rx="1.5" fill="url(#goldgrad)" stroke="#7A4A14" strokeWidth="1" />
      <rect x="18" y="50" width="28" height="4" rx="1" fill="url(#goldgrad)" stroke="#7A4A14" strokeWidth="1" />
    </svg>
  );
}

/** Hex-keyed image overlay for the FIFA theme. Renders a flag, the Cup,
 *  or the Ball depending on which hex slot is being painted. */
export function FifaOverlay({ colorHex, className = '', date }: FifaOverlayProps) {
  if (!colorHex) return null;
  const up = colorHex.toUpperCase();
  const map = getFifaImageMap(date ?? new Date());
  const entry = map[up] ?? map[colorHex];
  if (!entry) return null;

  const base = `absolute inset-0 w-full h-full pointer-events-none ${className}`;

  if (entry.kind === 'cup') {
    return <GoldenCup className={`${base} p-1.5`} />;
  }
  if (entry.kind === 'ball') {
    return <SoccerBall className={`${base} p-1`} />;
  }
  // Flag — circular crop with subtle ring so white edges don't bleed.
  return (
    <img
      src={flagUrl(entry.code)}
      alt=""
      aria-hidden
      loading="lazy"
      className={`${base} object-cover rounded-full ring-1 ring-black/10 shadow-sm`}
    />
  );
}

/** Back-compat shape echoing the old KNICKS_IMAGE_FOR_HEX map. Some callers
 *  used to read the map directly; kept here so referencing code keeps working. */
export const FIFA_IMAGE_FOR_HEX_KEYS = [...FLAG_SLOT_HEXES, WHITE, BLACK];