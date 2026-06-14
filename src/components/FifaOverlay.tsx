import {
  FIFA_QUALIFIED_TEAMS,
  dailySeededShuffle,
  type TeamCode,
} from '@/data/fifaSchedule';
import { getFlagsForDate } from '@/data/fifaDailyFlags';
import cupAsset from '@/assets/fifa/cup.png.asset.json';
import ballAsset from '@/assets/fifa/ball.png.asset.json';

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
export function getFifaImageMap(
  date: Date = new Date(),
): Record<string, SlotEntry> {
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

  const manual = getFlagsForDate(date);
  if (manual) push(manual);
  if (pool.length < FLAG_SLOT_HEXES.length) {
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
    return <img src={cupAsset.url} alt="" aria-hidden className={`${base} object-contain p-1`} />;
  }
  if (entry.kind === 'ball') {
    return <img src={ballAsset.url} alt="" aria-hidden className={`${base} object-contain p-1`} />;
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