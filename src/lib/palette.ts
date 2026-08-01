// Chromatic Daily — OKLCH Dynamic Daily Palette Engine
//
// Generates a deterministic 9-color palette per calendar day (local device
// time). The palette shape matches ColorDef so every existing consumer
// (puzzle generation, picker, grid, share) keeps working unchanged.

export interface DailyColor {
  name: string;
  hex: string;
  hue: number;
  /** OKLCH lightness (0-1) — used to pick contrasting overlay strokes. */
  lightness: number;
}

export const DAILY_PALETTE_SIZE = 9;

// ---------------------------------------------------------------- OKLCH → hex

function gamma(x: number): number {
  return x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
}

function oklchToRgb(L: number, C: number, Hdeg: number): [number, number, number] {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  const eps = 0.0005;
  return (
    r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps
  );
}

function toHexChannel(v: number): string {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return n.toString(16).padStart(2, '0').toUpperCase();
}

/** Convert OKLCH to an sRGB hex string, reducing chroma until in gamut. */
export function oklchToHex(L: number, C: number, H: number): string {
  let c = Math.max(0, C);
  let rgb = oklchToRgb(L, c, H);
  let guard = 0;
  while (!inGamut(rgb) && c > 0 && guard < 60) {
    c -= 0.005;
    rgb = oklchToRgb(L, Math.max(0, c), H);
    guard++;
  }
  const [r, g, b] = rgb;
  return `#${toHexChannel(gamma(r))}${toHexChannel(gamma(g))}${toHexChannel(gamma(b))}`;
}

// ------------------------------------------------------------------- helpers

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dateSeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HUE_LABELS: { max: number; label: string }[] = [
  { max: 20, label: 'Red' },
  { max: 45, label: 'Orange' },
  { max: 70, label: 'Amber' },
  { max: 100, label: 'Lime' },
  { max: 160, label: 'Green' },
  { max: 200, label: 'Teal' },
  { max: 240, label: 'Cyan' },
  { max: 280, label: 'Blue' },
  { max: 320, label: 'Violet' },
  { max: 345, label: 'Magenta' },
  { max: 361, label: 'Red' },
];

function hueLabel(h: number): string {
  const hh = ((h % 360) + 360) % 360;
  return HUE_LABELS.find((e) => hh < e.max)?.label ?? 'Color';
}

function clamp01(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export interface DailyPaletteMeta {
  /** Human name of the day's palette theme, e.g. "Cool Depths". */
  name: string;
  colors: DailyColor[];
}

// -------------------------------------------------- minimum separation guard

interface Spec {
  L: number;
  C: number;
  H: number;
  /** When true the hue is theme-critical (monochrome) and must not drift. */
  lockHue?: boolean;
}

/**
 * Minimum perceptual distance required between any two colors of a day.
 * ~0.15 Oklab ≈ Delta E 15. Days whose rule fixes lightness and chroma
 * (Monday pastels, Tuesday brights) can only separate by hue, so they carry
 * their own achievable floor.
 */
const MIN_SEPARATION = 0.15;

/** Oklab coordinates of a rendered hex — measures what the eye actually sees. */
function hexToOklab(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = f(parseInt(m.slice(0, 2), 16) / 255);
  const g = f(parseInt(m.slice(2, 4), 16) / 255);
  const b = f(parseInt(m.slice(4, 6), 16) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s,
  ];
}

function labDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Deterministically nudges colors apart (lightness first, then a small hue
 * drift when allowed) until every pair clears MIN_SEPARATION, or the bounded
 * iteration budget runs out.
 */
function enforceSeparation(specs: Spec[], minSep: number = MIN_SEPARATION): Spec[] {
  const out = specs.map((s) => ({ ...s }));
  const L_MIN = 0.2;
  const L_MAX = 0.95;

  for (let pass = 0; pass < 80; pass++) {
    let worst = 0;
    // Distances are measured on the rendered (gamut-clamped) colors so
    // clipping can't collapse two swatches together.
    const labs = out.map((s) => hexToOklab(oklchToHex(s.L, s.C, s.H)));
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const d = labDistance(labs[i], labs[j]);
        if (d >= minSep) continue;
        worst = Math.max(worst, minSep - d);

        const deficit = minSep - d;
        // Deterministic direction: lower index keeps the darker slot.
        const lowFirst = out[i].L < out[j].L || (out[i].L === out[j].L && i < j);
        const lo = lowFirst ? out[i] : out[j];
        const hi = lowFirst ? out[j] : out[i];
        const step = deficit * 0.55;
        lo.L = Math.max(L_MIN, lo.L - step);
        hi.L = Math.min(L_MAX, hi.L + step);
        labs[i] = hexToOklab(oklchToHex(out[i].L, out[i].C, out[i].H));
        labs[j] = hexToOklab(oklchToHex(out[j].L, out[j].C, out[j].H));

        // If lightness is pinned at the rails, drift hue apart instead.
        if (!out[i].lockHue && !out[j].lockHue && lo.L <= L_MIN + 1e-6 && hi.L >= L_MAX - 1e-6) {
          const spread = (deficit / Math.max(0.05, (lo.C + hi.C) / 2)) * 20;
          lo.H -= spread;
          hi.H += spread;
          labs[i] = hexToOklab(oklchToHex(out[i].L, out[i].C, out[i].H));
          labs[j] = hexToOklab(oklchToHex(out[j].L, out[j].C, out[j].H));
        }
      }
    }
    if (worst === 0) break;
  }

  return out;
}

/** Fisher-Yates shuffle driven by the day's deterministic RNG. */
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Free-form daily palette: nine colors sampled independently across hue,
 * lightness and chroma. No weekday character, no smooth ramp — a deep blue can
 * sit next to a citrus pink and a bright yellow on the same day.
 */
function buildRaw(date: Date, attempt: number): DailyColor[] {
  const n = DAILY_PALETTE_SIZE;
  const rand = seededRandom(dateSeed(date) + 7919 + attempt * 104729);

  // Hue: nine buckets 40 apart, rotated per day, jittered, then shuffled so
  // the order around the wheel changes daily too.
  const spin = rand() * 360;
  const hues = shuffle(
    Array.from({ length: n }, (_, i) => spin + (360 / n) * i + (rand() - 0.5) * 22),
    rand
  );

  // Lightness: a wide ramp, shuffled, so light and dark tiles interleave
  // unpredictably rather than alternating.
  const lights = shuffle(
    Array.from({ length: n }, (_, i) => 0.3 + (0.62 * i) / (n - 1) + (rand() - 0.5) * 0.05),
    rand
  );

  const specs: Spec[] = [];
  for (let i = 0; i < n; i++) {
    const L = clamp01(lights[i], 0.28, 0.93);
    // Chroma sampled per slot: some tiles read vivid, some muted, on any day.
    const C = 0.06 + rand() * 0.18;
    specs.push({ L, C, H: hues[i] });
  }

  return enforceSeparation(specs, MIN_SEPARATION).map((c, i) => {
    const H = ((c.H % 360) + 360) % 360;
    const L = Math.min(0.97, Math.max(0.18, c.L));
    const C = Math.max(0, c.C);
    return {
      name: `${hueLabel(H)} ${i + 1}`,
      hex: oklchToHex(L, C, H),
      hue: H,
      lightness: L,
    };
  });
}

/** Mean perceptual distance between two palettes (higher = more different). */
function paletteDistance(a: DailyColor[], b: DailyColor[]): number {
  const la = a.map((c) => hexToOklab(c.hex));
  const lb = b.map((c) => hexToOklab(c.hex));
  let total = 0;
  for (const x of la) {
    let best = Infinity;
    for (const y of lb) best = Math.min(best, labDistance(x, y));
    total += best;
  }
  return total / la.length;
}

/** Minimum average shift required between consecutive days. */
const MIN_DAY_NOVELTY = 0.1;

function buildDay(date: Date, depth: number): DailyColor[] {
  if (depth <= 0) return buildRaw(date, 0);

  const prevDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  const prev = buildDay(prevDate, depth - 1);

  let best = buildRaw(date, 0);
  let bestScore = paletteDistance(best, prev);
  for (let attempt = 1; attempt < 6 && bestScore < MIN_DAY_NOVELTY; attempt++) {
    const cand = buildRaw(date, attempt);
    const score = paletteDistance(cand, prev);
    if (score > bestScore) {
      best = cand;
      bestScore = score;
    }
  }
  return best;
}

function buildPalette(date: Date): DailyPaletteMeta {
  const colors = buildDay(date, 2);
  const avgL = colors.reduce((s, c) => s + c.lightness, 0) / colors.length;
  const name = avgL > 0.68 ? 'Bright Mix' : avgL < 0.5 ? 'Deep Mix' : 'Daily Mix';
  return { name, colors };
}

const cache = new Map<string, DailyPaletteMeta>();

function getMeta(date: Date = new Date()): DailyPaletteMeta {
  const key = dateKey(date);
  const hit = cache.get(key);
  if (hit) return hit;
  let meta: DailyPaletteMeta;
  try {
    meta = buildPalette(date);
  } catch (err) {
    console.error('[Chromatic] palette generation failed, using fallback:', err);
    meta = {
      name: 'Chromatic',
      colors: [
        { name: 'Red 1', hex: '#EF4444', hue: 0, lightness: 0.63 },
        { name: 'Orange 2', hex: '#FD9349', hue: 25, lightness: 0.74 },
        { name: 'Amber 3', hex: '#FDE047', hue: 50, lightness: 0.9 },
        { name: 'Teal 4', hex: '#2DD4D4', hue: 180, lightness: 0.79 },
        { name: 'Violet 5', hex: '#8B5CF6', hue: 260, lightness: 0.6 },
        { name: 'Lime 6', hex: '#7AC00F', hue: 82, lightness: 0.73 },
        { name: 'Magenta 7', hex: '#EC4899', hue: 330, lightness: 0.65 },
        { name: 'Blue 8', hex: '#3B82F6', hue: 217, lightness: 0.62 },
        { name: 'Orange 9', hex: '#8B5C33', hue: 25, lightness: 0.47 },
      ],
    };
  }
  cache.set(key, meta);
  return meta;
}

/** The deterministic 9-color palette for the given (local) day. */
export function getDailyPalette(date: Date = new Date()): DailyColor[] {
  return getMeta(date).colors;
}

/** Human-readable name of the day's palette theme. */
export function getDailyPaletteName(date: Date = new Date()): string {
  return getMeta(date).name;
}

/** Index of a hex within today's palette, or -1. */
export function paletteIndexOf(hex: string | null, date: Date = new Date()): number {
  if (!hex) return -1;
  const up = hex.toUpperCase();
  return getDailyPalette(date).findIndex((c) => c.hex.toUpperCase() === up);
}

/**
 * Perceptual lightness (0-1) of any hex, so overlays can pick a contrasting
 * stroke even for colors stored from previous days.
 */
export function hexLightness(hex: string): number {
  const m = hex.replace('#', '');
  if (m.length !== 6) return 0.6;
  const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = toLin(parseInt(m.slice(0, 2), 16) / 255);
  const g = toLin(parseInt(m.slice(2, 4), 16) / 255);
  const b = toLin(parseInt(m.slice(4, 6), 16) / 255);
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Math.cbrt(y);
}