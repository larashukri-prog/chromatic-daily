import cupAsset from '@/assets/fifa/cup.png.asset.json';
import ballAsset from '@/assets/fifa/ball.png.asset.json';
import fillerAsset from '@/assets/fifa/filler.png.asset.json';

// Update this array daily with the direct flag image URLs of teams playing.
const currentDayFlags: string[] = [
  "https://flagcdn.com/w320/au.png",
  "https://flagcdn.com/w320/us.png",
  "https://flagcdn.com/w320/nl.png",
  "https://flagcdn.com/w320/se.png",
  "https://flagcdn.com/w320/de.png",
  "https://flagcdn.com/w320/ci.png",
  "https://flagcdn.com/w320/ec.png",
  "https://flagcdn.com/w320/cw.png",
];

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
  | { kind: 'flagUrl'; url: string }
  | { kind: 'cup' }
  | { kind: 'ball' }
  | { kind: 'filler' };

/** Tiny deterministic per-date RNG (mulberry32 seeded by YYYYMMDD). */
function dateSeededShuffle<T>(arr: T[], date: Date): T[] {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the per-day hex → asset map.
 *  - White anchor → Cup; Black anchor → Ball (always, ONLY here).
 *  - Chromatic slots: flags first (date-seeded order), filler image for the rest.
 *  - Cup and Ball are NEVER placed in chromatic slots. */
export function getFifaImageMap(
  date: Date = new Date(),
): Record<string, SlotEntry> {
  const map: Record<string, SlotEntry> = {
    [WHITE]: { kind: 'cup' },
    [BLACK]: { kind: 'ball' },
  };

  const flags = currentDayFlags.slice(0, FLAG_SLOT_HEXES.length);
  const N = flags.length;
  const slotOrder = dateSeededShuffle(FLAG_SLOT_HEXES, date);

  for (let i = 0; i < N; i++) {
    map[slotOrder[i]] = { kind: 'flagUrl', url: flags[i] };
  }
  // Remaining chromatic slots get the filler image (never Cup/Ball).
  for (let i = N; i < slotOrder.length; i++) {
    map[slotOrder[i]] = { kind: 'filler' };
  }

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
  if (entry.kind === 'filler') {
    return <img src={fillerAsset.url} alt="" aria-hidden className={`${base} object-contain p-1`} />;
  }
  // Flag URL — fills the slot with a circular crop and subtle border.
  const objectPosition = entry.url.includes('jo.png')
    ? 'object-left'
    : entry.url.includes('qa.png')
      ? 'object-[30%_center]'
      : entry.url.includes('tr.png')
        ? 'object-[40%_center]'
        : 'object-center';
  return (
    <img
      src={entry.url}
      alt=""
      aria-hidden
      loading="lazy"
      className={`${base} w-full h-full rounded-full object-cover ${objectPosition} border border-gray-200`}
    />
  );
}

/** Back-compat shape echoing the old KNICKS_IMAGE_FOR_HEX map. Some callers
 *  used to read the map directly; kept here so referencing code keeps working. */
export const FIFA_IMAGE_FOR_HEX_KEYS = [...FLAG_SLOT_HEXES, WHITE, BLACK];