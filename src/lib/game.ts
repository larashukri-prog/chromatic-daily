// Chromatic Daily - Game Logic

const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Yellow', hex: '#FDE047' },
  { name: 'Teal', hex: '#6EE7B7' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Lime', hex: '#BEF264' },
  { name: 'Green', hex: '#3F6212' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Blue', hex: '#2563EB' },
];

const NEUTRAL = '#D1D5DB';
export const MAX_ATTEMPTS = 3;

export type GamePhase = 'idle' | 'observation' | 'recall' | 'result' | 'gameover';

export interface PuzzleAttempt {
  puzzleIndex: number; // which puzzle (0, 1, 2) was attempted
  grid: (string | null)[];
  isCorrect: boolean;
}

export interface StoredData {
  lastPlayed: string; // YYYY-MM-DD
  currentStreak: number;
  maxStreak: number;
  attemptsUsed: number; // 0-3
  puzzlesSolved: number; // 0-3
  attempts: PuzzleAttempt[];
  solutions: (string | null)[][]; // the 3 solutions for today
  currentPuzzleIndex: number; // which puzzle they're on (0-2)
}

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
  const day = now.getDay(); // 0=Sun
  const countMap: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 0: 9 };
  const nameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return {
    dayOfWeek: day,
    dayName: nameMap[day],
    colorCount: countMap[day],
  };
}

// Generate a single puzzle solution for a given seed + puzzle offset
function generateSingleSolution(baseSeed: number, puzzleOffset: number): (string | null)[] {
  const { colorCount } = getDayInfo();
  const seed = baseSeed + puzzleOffset * 7919; // unique seed per puzzle
  const rand = seededRandom(seed);

  const shuffled = [...COLORS].sort(() => rand() - 0.5);
  const chosen = shuffled.slice(0, colorCount);

  const positions = Array.from({ length: 9 }, (_, i) => i).sort(() => rand() - 0.5);
  const coloredPositions = positions.slice(0, colorCount);

  const solution: (string | null)[] = Array(9).fill(null);
  coloredPositions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });

  return solution;
}

// Generate all 3 daily solutions
export function generateDailySolutions(): (string | null)[][] {
  const baseSeed = getDateSeed();
  return [
    generateSingleSolution(baseSeed, 0),
    generateSingleSolution(baseSeed, 1),
    generateSingleSolution(baseSeed, 2),
  ];
}

// Get the active colors used in a specific solution
export function getActiveColorsForSolution(solution: (string | null)[]): { name: string; hex: string }[] {
  const usedHexes = new Set(solution.filter(Boolean));
  return COLORS.filter(c => usedHexes.has(c.hex));
}

export function getDayNumber(): number {
  const start = new Date(2024, 0, 1);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export { NEUTRAL, COLORS };

// Local storage helpers
const STORAGE_KEY = 'chromatic-daily';

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
    const parsed = JSON.parse(raw);
    // Migration: ensure attempts array exists
    if (!parsed.attempts) parsed.attempts = [];
    if (parsed.attemptsUsed === undefined) parsed.attemptsUsed = 0;
    if (parsed.puzzlesSolved === undefined) parsed.puzzlesSolved = 0;
    if (parsed.currentPuzzleIndex === undefined) parsed.currentPuzzleIndex = 0;
    return parsed;
  } catch { return null; }
}

export function isGameOver(): boolean {
  const data = loadData();
  if (!data || data.lastPlayed !== getTodayString()) return false;
  return data.attemptsUsed >= MAX_ATTEMPTS;
}

export function getAttemptsUsed(): number {
  const data = loadData();
  if (!data || data.lastPlayed !== getTodayString()) return 0;
  return data.attemptsUsed ?? 0;
}

export function getPuzzlesSolved(): number {
  const data = loadData();
  if (!data || data.lastPlayed !== getTodayString()) return 0;
  return data.puzzlesSolved ?? 0;
}

export function getCurrentPuzzleIndex(): number {
  const data = loadData();
  if (!data || data.lastPlayed !== getTodayString()) return 0;
  return data.currentPuzzleIndex ?? 0;
}

export function saveAttempt(
  puzzleIndex: number,
  isCorrect: boolean,
  playerGrid: (string | null)[],
  solutions: (string | null)[][]
): StoredData {
  const today = getTodayString();
  const existing = loadData();
  const isToday = existing?.lastPlayed === today;

  const prevAttempts: PuzzleAttempt[] = isToday ? (existing?.attempts ?? []) : [];
  const attempts = [...prevAttempts, { puzzleIndex, grid: playerGrid, isCorrect }];

  const attemptsUsed = isToday ? (existing?.attemptsUsed ?? 0) + 1 : 1;
  let puzzlesSolved = isToday ? (existing?.puzzlesSolved ?? 0) : 0;
  let currentPuzzleIndex = isToday ? (existing?.currentPuzzleIndex ?? 0) : 0;

  if (isCorrect) {
    puzzlesSolved += 1;
    currentPuzzleIndex = Math.min(currentPuzzleIndex + 1, MAX_ATTEMPTS - 1);
  }
  // If failed, currentPuzzleIndex stays the same (retry same puzzle)

  // Streak calculation: only finalize when game is over (all 3 attempts used)
  let currentStreak = existing?.currentStreak ?? 0;
  let maxStreak = existing?.maxStreak ?? 0;

  if (attemptsUsed >= MAX_ATTEMPTS) {
    if (puzzlesSolved > 0) {
      // At least one puzzle solved — streak continues
      if (existing && existing.lastPlayed === getYesterdayString() && (existing.puzzlesSolved ?? 0) > 0) {
        currentStreak = (existing.currentStreak ?? 0) + 1;
      } else if (!isToday) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  } else if (isToday) {
    // Keep existing streak values during the day
    currentStreak = existing?.currentStreak ?? 0;
    maxStreak = existing?.maxStreak ?? 0;
  }

  const data: StoredData = {
    lastPlayed: today,
    currentStreak,
    maxStreak,
    attemptsUsed,
    puzzlesSolved,
    attempts,
    solutions,
    currentPuzzleIndex,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function getStreaks() {
  const data = loadData();
  return {
    current: data?.currentStreak ?? 0,
    max: data?.maxStreak ?? 0,
  };
}

export function generateShareText(data: StoredData): string {
  const { dayName } = getDayInfo();
  const dayNum = getDayNumber();

  const lines: string[] = [
    `Chromatic Daily #${dayNum}`,
    dayName,
    '',
  ];

  // Group attempts by puzzle
  const puzzleResults: { puzzleIndex: number; attemptsOnPuzzle: number; solved: boolean }[] = [];
  const attemptsByPuzzle = new Map<number, PuzzleAttempt[]>();

  for (const attempt of data.attempts) {
    if (!attemptsByPuzzle.has(attempt.puzzleIndex)) {
      attemptsByPuzzle.set(attempt.puzzleIndex, []);
    }
    attemptsByPuzzle.get(attempt.puzzleIndex)!.push(attempt);
  }

  for (const [puzzleIdx, attempts] of attemptsByPuzzle) {
    const solved = attempts.some(a => a.isCorrect);
    puzzleResults.push({
      puzzleIndex: puzzleIdx,
      attemptsOnPuzzle: attempts.length,
      solved,
    });
  }

  for (const pr of puzzleResults) {
    const emoji = pr.solved ? '🟩' : '⬛';
    const detail = pr.solved
      ? `(${pr.attemptsOnPuzzle} attempt${pr.attemptsOnPuzzle !== 1 ? 's' : ''})`
      : '(Failed)';
    lines.push(`Puzzle ${pr.puzzleIndex + 1}: ${emoji} ${detail}`);
  }

  lines.push('');
  lines.push(`Score: ${data.puzzlesSolved}/${MAX_ATTEMPTS}`);
  lines.push(`Streak: ${data.currentStreak} day${data.currentStreak !== 1 ? 's' : ''}`);

  return lines.join('\n');
}
