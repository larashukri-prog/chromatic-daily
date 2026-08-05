import { CHROMATIC_COLORS, COLORS, GRID_SIZE, type ColorDef } from '@/lib/game';

/**
 * Compute color count for a given session round (1-based).
 * The radial board holds 7 tiles, so the effective count is clamped to
 * min(count, palette.length, GRID_SIZE) downstream. Higher tiers still
 * matter conceptually as long-session difficulty markers.
 *
 * Tiers:
 *  Round 1–2:   2 colors
 *  Round 3–5:   3 colors
 *  Round 6–9:   4 colors
 *  Round 10–14: 5 colors
 *  Round 15–20: 6 colors
 *  Round 21–27: 7 colors
 *  Round 28–34: 8 colors
 *  Round 35+:   9 colors
 */
function getColorCountForRound(roundCount: number): number {
  const r = Math.max(1, Math.floor(roundCount));
  if (r <= 2) return 2;
  if (r <= 5) return 3;
  if (r <= 9) return 4;
  if (r <= 14) return 5;
  if (r <= 20) return 6;
  if (r <= 27) return 7;
  if (r <= 34) return 8;
  return 9;
}

/**
 * Generate a Practice Mode puzzle with progressive difficulty
 * based on the session's round count (1-based).
 *
 * Mirrors the daily flow: shuffles canonical CHROMATIC_COLORS indices
 * (palette-independent) and then projects those indices onto the caller's
 * palette 1:1. This keeps Colors / Patterns / Shapes / MTA aligned when the
 * visual style is toggled mid-round. Uses Math.random() — no seeding.
 */
export function generateFreePlayPuzzle(
  roundCount: number = 1,
  palette: ColorDef[] = COLORS,
): {
  solution: (string | null)[];
  activeColors: { name: string; hex: string }[];
  colorCount: number;
} {
  const requested = getColorCountForRound(roundCount);
  const colorCount = Math.min(requested, CHROMATIC_COLORS.length, palette.length, GRID_SIZE);

  // Shuffle canonical indices — palette-independent — then project onto the
  // caller's palette so the same slot/index maps cleanly across every theme.
  const canonicalIdx = CHROMATIC_COLORS.map((_, i) => i).sort(() => Math.random() - 0.5);
  const chosenIdx = canonicalIdx.slice(0, colorCount);
  const chosen = chosenIdx.map((i) => palette[i]);

  const positions = Array.from({ length: GRID_SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return { solution, activeColors: chosen, colorCount };
}
