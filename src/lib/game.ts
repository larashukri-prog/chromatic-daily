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
  const countMap: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 0: 9 };
  const nameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return {
    dayOfWeek: day,
    dayName: nameMap[day],
    colorCount: countMap[day],
  };
}

export function generateSolution(roundIndex: number = 0): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  const { colorCount } = getDayInfo();
  const baseSeed = getDateSeed();
  // Each round gets a different seed so puzzles differ
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
}

export function getDayNumber(): number {
  const start = new Date(2024, 0, 1);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export { NEUTRAL, COLORS };

// Local storage helpers
const STORAGE_KEY = 'chromatic-daily';

export interface RoundData {
  roundIndex: number; // which puzzle (0, 1, 2)
  attempts: { grid: (string | null)[]; isCorrect: boolean }[];
  solution: (string | null)[];
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

  round.attempts.push({ grid: playerGrid, isCorrect });
  if (isCorrect) round.solved = true;

  const totalAttempts = rounds.reduce((sum, r) => sum + r.attempts.length, 0);
  const allSolved = rounds.filter(r => r.solved).length >= MAX_ROUNDS;
  const finished = totalAttempts >= MAX_ROUNDS || allSolved;

  // Streak logic
  let currentStreak = existing?.currentStreak ?? 0;
  let maxStreak = existing?.maxStreak ?? 0;

  if (finished && !isToday) {
    const anySolved = rounds.some(r => r.solved);
    if (anySolved) {
      if (existing && existing.lastPlayed === getYesterdayString() && existing.rounds?.some(r => r.solved)) {
        currentStreak = (existing.currentStreak ?? 0) + 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
  } else if (finished && isToday) {
    const anySolved = rounds.some(r => r.solved);
    if (anySolved && (existing?.currentStreak ?? 0) === 0) {
      if (existing && existing.lastPlayed === today) {
        // Check yesterday for streak continuation
        const prevRaw = localStorage.getItem(STORAGE_KEY + '-prev');
        currentStreak = 1;
      }
    }
  }

  if (!finished) {
    currentStreak = existing?.currentStreak ?? 0;
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
  const { dayName } = getDayInfo();
  const dayNum = getDayNumber();
  const streaks = getStreaks();
  const solvedCount = rounds.filter(r => r.solved).length;

  const lines: string[] = [`Chromatic Daily #${dayNum}`, dayName];

  rounds.forEach((round, idx) => {
    const lastAttempt = round.attempts[round.attempts.length - 1];
    if (!lastAttempt) return;
    const emojis = round.solution.map((color, i) => {
      if (color === null) return '⚪';
      return lastAttempt.grid[i] === color ? '🟢' : '⚫';
    });
    lines.push(`R${idx + 1}: ${emojis.slice(0, 3).join('')} ${emojis.slice(3, 6).join('')} ${emojis.slice(6, 9).join('')} ${round.solved ? '✅' : '❌'}`);
  });

  lines.push(`Solved: ${solvedCount}/${rounds.length}`);
  lines.push(`Streak: ${streaks.current} day${streaks.current !== 1 ? 's' : ''}`);
  return lines.join('\n');
}
