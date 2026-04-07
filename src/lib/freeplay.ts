import { COLORS } from '@/lib/game';

/**
 * Generate a random free-play puzzle with 2-5 colors.
 * Uses Math.random() — no seeding, no persistence.
 */
export function generateFreePlayPuzzle(): {
  solution: (string | null)[];
  activeColors: { name: string; hex: string }[];
  colorCount: number;
} {
  const colorCount = Math.floor(Math.random() * 4) + 2; // 2–5

  // Shuffle and pick colors
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, colorCount);

  // Shuffle positions and pick slots
  const positions = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(9).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
