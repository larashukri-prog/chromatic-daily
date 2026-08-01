import type { IconType } from 'react-icons';
import {
  FaHeart, FaStar, FaCat, FaTree, FaMoon, FaFish, FaDroplet, FaBolt, FaLeaf,
} from 'react-icons/fa6';
import { CHROMATIC_COLORS } from '@/lib/game';

/**
 * Deterministic daily "mix" engine.
 *
 * Every tile in the game is a composite of three existing asset families:
 *   1. Base color   — from CHROMATIC_COLORS
 *   2. Pattern      — from the PatternDefs library (index 0..8)
 *   3. Shape        — from the react-icons glyph set below (index 0..8)
 *
 * For a given local date, color -> pattern and color -> shape are two
 * independent seeded permutations of 0..8. Because a board never repeats a
 * color, no two tiles can share a color, a pattern, or a shape.
 */

/** Shape library, index-aligned with the permutation output. */
export const SHAPE_ICONS: IconType[] = [
  FaHeart, FaStar, FaCat, FaTree, FaMoon, FaFish, FaDroplet, FaBolt, FaLeaf,
];

/** Pattern ids (base names), index-aligned with the permutation output. */
export const MIX_PATTERN_IDS: string[] = [
  'pattern-vertical-stripes',
  'pattern-horizontal-stripes',
  'pattern-diagonal-45',
  'pattern-crosshatch',
  'pattern-polka-dots',
  'pattern-checkerboard',
  'pattern-concentric-circles',
  'pattern-zigzag',
  'pattern-solid',
];

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Fisher-Yates permutation of 0..n-1 using the supplied RNG. */
function permutation(n: number, rand: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Local-date key, e.g. 20260801. */
export function getTodayKey(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/** Relative luminance test so glyphs / pattern strokes stay legible. */
export function isDarkColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L < 0.45;
}

export interface DailyMix {
  /** SVG pattern id (already contrast-adjusted) for a base color. */
  patternIdFor: (hex: string | null) => string;
  /** Centered geometric shape for a base color. */
  iconFor: (hex: string | null) => IconType | null;
}

const cache = new Map<number, DailyMix>();

export function getDailyMix(dateKey: number = getTodayKey()): DailyMix {
  const cached = cache.get(dateKey);
  if (cached) return cached;

  const n = CHROMATIC_COLORS.length;
  const patternPerm = permutation(n, seededRandom(dateKey + 4241));
  const shapePerm = permutation(n, seededRandom(dateKey + 8677));

  const indexOf = (hex: string | null): number => {
    if (!hex) return -1;
    const up = hex.toUpperCase();
    return CHROMATIC_COLORS.findIndex((c) => c.hex.toUpperCase() === up);
  };

  const mix: DailyMix = {
    patternIdFor: (hex) => {
      const i = indexOf(hex);
      if (i === -1) return '';
      const base = MIX_PATTERN_IDS[patternPerm[i] % MIX_PATTERN_IDS.length];
      return isDarkColor(hex!) ? `${base}-light` : base;
    },
    iconFor: (hex) => {
      const i = indexOf(hex);
      if (i === -1) return null;
      return SHAPE_ICONS[shapePerm[i] % SHAPE_ICONS.length];
    },
  };

  cache.set(dateKey, mix);
  return mix;
}
