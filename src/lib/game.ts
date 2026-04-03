// Chromatic Daily - Game Logic

const COLORS = [
  { name: 'Red', hex: '#EF4444', hue: 0 },
  { name: 'Yellow', hex: '#FDE047', hue: 50 },
  { name: 'Teal', hex: '#2DD4BF', hue: 174 },
  { name: 'Orange', hex: '#F97316', hue: 25 },
  { name: 'Purple', hex: '#8B5CF6', hue: 260 },
  { name: 'Lime', hex: '#84CC16', hue: 82 },
  { name: 'Green', hex: '#3F6212', hue: 90 },
  { name: 'Pink', hex: '#EC4899', hue: 330 },
  { name: 'Blue', hex: '#2563EB', hue: 220 },
];

/** Hard-coded fallback palette in case the randomizer fails */
const FALLBACK_PALETTE: { name: string; hex: string; hue: number }[] = [
  { name: 'Red', hex: '#EF4444', hue: 0 },
  { name: 'Blue', hex: '#2563EB', hue: 220 },
  { name: 'Yellow', hex: '#FDE047', hue: 50 },
  { name: 'Purple', hex: '#8B5CF6', hue: 260 },
  { name: 'Teal', hex: '#2DD4BF', hue: 174 },
  { name: 'Orange', hex: '#F97316', hue: 25 },
  { name: 'Green', hex: '#3F6212', hue: 90 },
  { name: 'Pink', hex: '#EC4899', hue: 330 },
  { name: 'Lime', hex: '#84CC16', hue: 82 },
];

const NEUTRAL = '#D1D5DB';

export type GamePhase = 'idle' | 'observation' | 'recall' | 'result';

export const MAX_ROUNDS = 3;

// Seeded random based on date for consistent daily puzzle
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getDateSeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export function getDayInfo() {
  const now = new Date();
  const day = now.getDay();
  const countMap: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 0: 9 };
  const nameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return {
    dayOfWeek: day,
    dayName: nameMap[day],
    colorCount: countMap[day],
  };
}

/** Fallback solution using hard-coded palette when generation fails */
function generateFallbackSolution(): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  const { colorCount } = getDayInfo();
  const chosen = FALLBACK_PALETTE.slice(0, colorCount);
  const positions = Array.from({ length: colorCount }, (_, i) => i);
  const solution: (string | null)[] = Array(9).fill(null);
  positions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });
  return { solution, activeColors: chosen, colorCount };
}

export function generateSolution(roundIndex: number = 0): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  try {
    const { colorCount } = getDayInfo();
    const baseSeed = getDateSeed();
    const seed = baseSeed + roundIndex * 7919;
    const rand = seededRandom(seed);

    const shuffled = [...COLORS].sort(() => rand() - 0.5);
    const chosen = shuffled.slice(0, colorCount);

    const positions = Array.from({ length: 9 }, (_, i) => i).sort(() => rand() - 0.5);
    const coloredPositions = positions.slice(0, colorCount);

    const solution: (string | null)[] = Array(9).fill(null);
    coloredPositions.forEach((pos, i) => {
      solution[pos] = chosen[i].hex;
    });

    return { solution, activeColors: chosen, colorCount };
  } catch (err) {
    console.error('[Chromatic] generateSolution failed, using fallback palette:', err);
    return generateFallbackSolution();
  }
}

export type DDALevel = 'standard' | 'hard';

/** Difficulty tier based on color count */
export function getDayDifficultyTier(colorCount: number): 'easy' | 'medium' | 'hard' {
  if (colorCount <= 3) return 'easy';   // Mon (2), Tue (3)
  if (colorCount <= 5) return 'medium'; // Wed (4), Thu (5)
  return 'hard';                        // Fri (6), Sat (7), Sun (9)
}

/**
 * Check if two colors are "palette neighbors" (hue distance < 50).
 */
function areHueNeighbors(a: typeof COLORS[0], b: typeof COLORS[0]): boolean {
  const diff = Math.abs(a.hue - b.hue);
  return Math.min(diff, 360 - diff) < 50;
}

/**
 * For hard days: ensure placed colors on the grid are not adjacent to
 * their palette neighbors. Re-shuffle positions so that neighboring
 * cells (in the 3x3 grid) don't hold hue-similar colors.
 */
function getNonAdjacentPositions(
  chosen: typeof COLORS,
  colorCount: number,
  rand: () => number
): number[] {
  // 3x3 adjacency (including diagonals)
  const adjacent: Record<number, number[]> = {
    0: [1, 3, 4], 1: [0, 2, 3, 4, 5], 2: [1, 4, 5],
    3: [0, 1, 4, 6, 7], 4: [0, 1, 2, 3, 5, 6, 7, 8], 5: [1, 2, 4, 7, 8],
    6: [3, 4, 7], 7: [3, 4, 5, 6, 8], 8: [4, 5, 7],
  };

  // Try up to 200 random arrangements and pick the best one
  let bestPositions: number[] = [];
  let bestConflicts = Infinity;

  for (let attempt = 0; attempt < 200; attempt++) {
    const allPos = Array.from({ length: 9 }, (_, i) => i).sort(() => rand() - 0.5);
    const positions = allPos.slice(0, colorCount);

    // Count neighbor conflicts
    let conflicts = 0;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (adjacent[positions[i]].includes(positions[j]) && areHueNeighbors(chosen[i], chosen[j])) {
          conflicts++;
        }
      }
    }

    if (conflicts < bestConflicts) {
      bestConflicts = conflicts;
      bestPositions = positions;
      if (conflicts === 0) break;
    }
  }

  return bestPositions;
}

/**
 * Dynamic Difficulty Adjustment generator with Cognitive Cap.
 *
 * Easy days (Mon/Tue): Add +1 color for Rounds 2 & 3.
 * Medium days (Wed/Thu): Add +1 color for Rounds 2 & 3, avoid center.
 * Hard days (Fri/Sat/Sun): Keep same colors, enforce spatial separation
 *   (no hue-similar colors in adjacent cells).
 */
export function generateSolutionDDA(
  roundIndex: number,
  ddaLevel: DDALevel
): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  try {
    if (ddaLevel === 'standard' || roundIndex === 0) {
      return generateSolution(roundIndex);
    }

    const { colorCount: baseCount } = getDayInfo();
    const tier = getDayDifficultyTier(baseCount);
    const baseSeed = getDateSeed();
    const primaryRand = seededRandom(baseSeed + roundIndex * 7919);
    const ddaSeed = baseSeed + roundIndex * 13337 + 42;
    const ddaRand = seededRandom(ddaSeed);

    if (tier === 'hard') {
      const colorCount = baseCount;
      const shuffled = [...COLORS].sort(() => primaryRand() - 0.5);
      const chosen = shuffled.slice(0, colorCount);
      const coloredPositions = getNonAdjacentPositions(chosen, colorCount, ddaRand);

      const solution: (string | null)[] = Array(9).fill(null);
      coloredPositions.forEach((pos, i) => {
        solution[pos] = chosen[i].hex;
      });
      return { solution, activeColors: chosen, colorCount };
    }

    const colorCount = Math.min(baseCount + 1, 9);
    const shuffled = [...COLORS].sort(() => primaryRand() - 0.5);
    const chosen = shuffled.slice(0, colorCount);

    let coloredPositions: number[];
    if (tier === 'medium' && roundIndex === 1) {
      const nonCenter = [0, 1, 2, 3, 5, 6, 7, 8].sort(() => ddaRand() - 0.5);
      coloredPositions = nonCenter.slice(0, colorCount);
    } else {
      const allPositions = Array.from({ length: 9 }, (_, i) => i).sort(() => ddaRand() - 0.5);
      coloredPositions = allPositions.slice(0, colorCount);
    }

    const solution: (string | null)[] = Array(9).fill(null);
    coloredPositions.forEach((pos, i) => {
      solution[pos] = chosen[i].hex;
    });

    return { solution, activeColors: chosen, colorCount };
  } catch (err) {
    console.error('[Chromatic] generateSolutionDDA failed, using fallback:', err);
    return generateFallbackSolution();
  }
}

export function getDayNumber(): number {
  const start = new Date(2024, 0, 1);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export { NEUTRAL, COLORS };

// Local storage helpers
const STORAGE_KEY = 'chromatic-daily';

export interface RoundAttempt {
  grid: (string | null)[];
  isCorrect: boolean;
  solution: (string | null)[];
}

export interface RoundData {
  roundIndex: number; // which puzzle (0, 1, 2)
  attempts: RoundAttempt[];
  solution: (string | null)[]; // kept for back-compat; latest solution for this round
  solved: boolean;
}

interface StoredData {
  lastPlayed: string; // YYYY-MM-DD
  currentStreak: number;
  maxStreak: number;
  rounds: RoundData[];
  finished: boolean; // all 3 rounds used
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadData(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Migration: old format without rounds
    if (!data.rounds) {
      return {
        lastPlayed: data.lastPlayed ?? '',
        currentStreak: data.currentStreak ?? 0,
        maxStreak: data.maxStreak ?? 0,
        rounds: [],
        finished: true,
      };
    }
    return data;
  } catch { return null; }
}

function saveData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTodayData(): StoredData | null {
  const data = loadData();
  if (!data || data.lastPlayed !== getTodayString()) return null;
  return data;
}

export function hasFinishedToday(): boolean {
  const data = getTodayData();
  return data?.finished ?? false;
}

/** Get current round index (0-based) and total attempts used */
export function getCurrentRoundInfo(): { roundIndex: number; totalAttemptsUsed: number; finished: boolean; rounds: RoundData[] } {
  const data = getTodayData();
  if (!data) return { roundIndex: 0, totalAttemptsUsed: 0, finished: false, rounds: [] };

  const totalUsed = data.rounds.reduce((sum, r) => sum + r.attempts.length, 0);
  // Current round = number of solved rounds (each solve advances to next puzzle)
  const solvedCount = data.rounds.filter(r => r.solved).length;
  const currentRound = Math.min(solvedCount, MAX_ROUNDS - 1);
  const finished = data.finished || totalUsed >= MAX_ROUNDS;

  return { roundIndex: currentRound, totalAttemptsUsed: totalUsed, finished, rounds: data.rounds };
}

export function saveRoundAttempt(
  roundIndex: number,
  isCorrect: boolean,
  playerGrid: (string | null)[],
  solution: (string | null)[]
): StoredData {
  const today = getTodayString();
  const existing = loadData();
  const isToday = existing?.lastPlayed === today;

  let rounds: RoundData[] = isToday ? [...(existing?.rounds ?? [])] : [];

  // Find or create the round entry
  let round = rounds.find(r => r.roundIndex === roundIndex);
  if (!round) {
    round = { roundIndex, attempts: [], solution, solved: false };
    rounds.push(round);
  }

  round.attempts.push({ grid: playerGrid, isCorrect, solution });
  round.solution = solution; // update to latest solution for this round
  if (isCorrect) round.solved = true;

  const totalAttempts = rounds.reduce((sum, r) => sum + r.attempts.length, 0);
  const allSolved = rounds.filter(r => r.solved).length >= MAX_ROUNDS;
  const finished = totalAttempts >= MAX_ROUNDS || allSolved;

  // Streak logic — only update when finishing for the first time today
  let currentStreak = existing?.currentStreak ?? 0;
  let maxStreak = existing?.maxStreak ?? 0;

  if (finished) {
    const alreadyFinishedToday = isToday && existing?.finished;
    if (!alreadyFinishedToday) {
      // First time finishing today — calculate streak
      const anySolved = rounds.some(r => r.solved);
      if (anySolved) {
        const prevPlayed = existing?.lastPlayed;
        const playedYesterday = prevPlayed === getYesterdayString();
        const hadSolveYesterday = existing?.rounds?.some(r => r.solved);
        if (playedYesterday && hadSolveYesterday) {
          currentStreak = (existing?.currentStreak ?? 0) + 1;
        } else if (isToday) {
          // First attempt today but no yesterday data — keep existing or start at 1
          currentStreak = Math.max(existing?.currentStreak ?? 0, 1);
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 0;
      }
    }
    // If already finished today, keep existing streak values
  }

  maxStreak = Math.max(maxStreak, currentStreak);

  const data: StoredData = {
    lastPlayed: today,
    currentStreak,
    maxStreak,
    rounds,
    finished,
  };

  saveData(data);
  return data;
}

export function getStreaks() {
  const data = loadData();
  return {
    current: data?.currentStreak ?? 0,
    max: data?.maxStreak ?? 0,
  };
}

export function getResultMessage(roundIndex: number, attemptInRound: number, isCorrect: boolean, totalAttemptsUsed: number): string {
  const remaining = MAX_ROUNDS - totalAttemptsUsed;

  if (isCorrect) {
    if (roundIndex === 0 && attemptInRound === 1) {
      return remaining > 0
        ? `Perfect score! You've got ${remaining} round${remaining > 1 ? 's' : ''} left. Here is a completely new challenge for Round ${roundIndex + 2}.`
        : "Perfect score on every round! Incredible memory!";
    }
    if (roundIndex === 1 && attemptInRound <= 2) {
      return remaining > 0
        ? `Spot on! You nailed the configuration on your second try.\n\nYou have one final round remaining. Since you solved that one, I've generated a brand-new color puzzle for your third and last attempt. Ready to finish strong?`
        : "Got it! That's all 3 rounds done. Game complete!";
    }
    if (totalAttemptsUsed >= MAX_ROUNDS) {
      return "Nice work! You cleared the puzzle on your final attempt. Game complete!";
    }
    return remaining > 0
      ? `Got it! That's ${roundIndex + 1} round${roundIndex + 1 > 1 ? 's' : ''} down. Let's move to your next round with a fresh configuration.`
      : "Game complete! Great memory work today!";
  }

  // Failed
  if (remaining > 0) {
    return `Not quite—but you have ${remaining} attempt${remaining > 1 ? 's' : ''} remaining for this specific puzzle. Look closely at the hints!`;
  }
  return "That's all 3 attempts used. Better luck tomorrow!";
}

export function generateShareText(rounds: RoundData[]): string {
  const { dayName, colorCount } = getDayInfo();
  const dayNum = getDayNumber();
  const anySolved = rounds.some(r => r.solved);

  const getDifficultyName = (count: number): string => {
    if (count <= 2) return 'Minimalist';
    if (count <= 4) return 'Standard';
    if (count <= 6) return 'Complex';
    return 'Master';
  };

  const lines: string[] = [
    `Chromatic #${dayNum}`,
    `${dayName} | Level: ${getDifficultyName(colorCount)}`,
    '',
  ];

  // Flatten all attempts across rounds, capped at MAX_ROUNDS
  type FlatAttempt = { grid: (string | null)[]; isCorrect: boolean; solution: (string | null)[] };
  const allAttempts: FlatAttempt[] = [];
  for (const round of rounds) {
    for (const attempt of round.attempts) {
      if (allAttempts.length < MAX_ROUNDS) {
        allAttempts.push({ ...attempt, solution: round.solution });
      }
    }
  }

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const a = allAttempts[i];
    if (a) {
      const statusIcon = a.isCorrect ? '✅' : '❌';
      lines.push(`Attempt ${i + 1} ${statusIcon}`);
      // Direct 1:1 mapping: index 0 = top-left circle = first emoji
      const grid = Array.from({ length: 9 }, (_, j) => {
        const sol = a.solution[j];
        const placed = a.grid[j];
        // Both empty — no color in this slot
        if (sol === null && placed === null) return '⚪';
        // Player placed nothing but solution expected a color — missed
        if (sol !== null && placed === null) return '🔴';
        // Player placed a color where solution is empty — wrong placement
        if (sol === null && placed !== null) return '🔴';
        // Both have colors — compare (case-insensitive for hex safety)
        const isMatch = sol!.toLowerCase() === placed!.toLowerCase();
        return isMatch ? '🟢' : '🔴';
      });
      lines.push(grid.slice(0, 3).join(''));
      lines.push(grid.slice(3, 6).join(''));
      lines.push(grid.slice(6, 9).join(''));
    } else {
      lines.push(`Attempt ${i + 1} ⬜`);
      lines.push('⚪⚪⚪');
      lines.push('⚪⚪⚪');
      lines.push('⚪⚪⚪');
    }
    lines.push('');
  }

  const totalAttempts = Math.min(allAttempts.length, MAX_ROUNDS);
  if (anySolved) {
    lines.push(`Solved in ${totalAttempts}/${MAX_ROUNDS} attempts`);
  } else {
    lines.push('Better luck tomorrow!');
  }

  lines.push('Play Chromatic: https://chromatic-daily.lovable.app');
  return lines.join('\n');
}
