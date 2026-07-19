import { COLORS, GRID_SIZE, type ColorDef } from '@/lib/game';

/**
 * Compute color count for a given session round (1-based) on the 2x3 grid (6 slots).
 * Tiers:
 *  Round 1–2:  2 colors
 *  Round 3–6:  3 colors
 *  Round 7–15: 4 colors
 *  Round 16+:  5–6 colors  (full board)
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
 * based on the session's round count (1-based). All tiles come
 * from the supplied palette (defaults to chromatic) — no black/white anchors.
 * Uses Math.random() — no seeding, no persistence.
 */
export function generateFreePlayPuzzle(
  roundCount: number = 1,
  palette: ColorDef[] = COLORS,
): {
  solution: (string | null)[];
  activeColors: { name: string; hex: string }[];
  colorCount: number;
} {
  const colorCount = Math.min(getColorCountForRound(roundCount), palette.length);

  const shuffled = [...palette].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, colorCount);

  // Shuffle positions and pick slots
  const positions = Array.from({ length: GRID_SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
