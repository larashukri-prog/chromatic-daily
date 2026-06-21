import { COLORS, GRID_SIZE } from '@/lib/game';

const ANCHORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

/**
 * Compute color count for a given session round (1-based) on the 3x2 grid (6 slots).
 * Tiers:
 *  Round 1–2:  2 colors    (no anchors)
 *  Round 3–6:  3 colors    (no anchors)
 *  Round 7–15: 4 colors    (no anchors)
 *  Round 16+:  5–6 colors  (anchors, full board)
 */
function getColorCountForRound(roundCount: number): number {
  const r = Math.max(1, Math.floor(roundCount));
  if (r <= 2) return 2;
  if (r <= 6) return 3;
  if (r <= 15) return 4;
  return 5 + Math.floor(Math.random() * 2); // 5 or 6
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
  const positions = Array.from({ length: GRID_SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
