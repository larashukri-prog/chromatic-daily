import { COLORS } from '@/lib/game';

const ANCHORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

/**
 * Generate a random free-play puzzle with 3-5 colors,
 * always including 2 anchors (Black & White).
 * Uses Math.random() — no seeding, no persistence.
 */
export function generateFreePlayPuzzle(): {
  solution: (string | null)[];
  activeColors: { name: string; hex: string }[];
  colorCount: number;
} {
  const colorCount = Math.floor(Math.random() * 3) + 3; // 3–5 (incl. 2 anchors)

  // Pick chromatic colors and append the 2 anchors
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  const chromaticCount = Math.max(1, colorCount - 2);
  const chosen = [...shuffled.slice(0, chromaticCount), ...ANCHORS];

  // Shuffle positions and pick slots
  const positions = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(9).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
