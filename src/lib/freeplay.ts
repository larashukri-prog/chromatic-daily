import { COLORS } from '@/lib/game';

const ANCHORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

/**
 * Compute color count for a given session round (1-based).
 * Tiers:
 *  Round 1–2:  2–3 colors  (no anchors)
 *  Round 3–6:  4 colors    (no anchors)
 *  Round 7–20: 5 colors    (anchors)
 *  Round 21–30: 6 colors   (anchors)
 *  Round 31–40: 7 colors   (anchors)
 *  Round 41+:  8–9 colors  (anchors, full Master Grid)
 */
function getColorCountForRound(roundCount: number): number {
  const r = Math.max(1, Math.floor(roundCount));
  if (r <= 2) return 2 + Math.floor(Math.random() * 2);          // 2 or 3
  if (r <= 6) return 4;
  if (r <= 20) return 5;
  if (r <= 30) return 6;
  if (r <= 40) return 7;
  return 8 + Math.floor(Math.random() * 2);                       // 8 or 9
}

/**
 * Generate a Practice Mode puzzle with progressive difficulty
 * based on the session's round count (1-based). Black & White
 * anchors are only introduced when colorCount > 4.
 * Uses Math.random() — no seeding, no persistence.
 */
export function generateFreePlayPuzzle(roundCount: number = 1): {
  solution: (string | null)[];
  activeColors: { name: string; hex: string }[];
  colorCount: number;
} {
  const colorCount = getColorCountForRound(roundCount);
  const useAnchors = colorCount > 4;

  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  let chosen: { name: string; hex: string }[];
  if (useAnchors) {
    const chromaticCount = Math.max(0, colorCount - 2);
    chosen = [...shuffled.slice(0, chromaticCount), ...ANCHORS];
  } else {
    chosen = shuffled.slice(0, colorCount);
  }

  // Shuffle positions and pick slots
  const positions = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(9).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
