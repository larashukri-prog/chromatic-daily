// Chromatic Daily - Game Logic

const COLORS = [
  { name: 'Red', hex: '#EF4444', hue: 0 },
  { name: 'Yellow', hex: '#FDE047', hue: 50 },
  { name: 'Teal', hex: '#2DD4D4', hue: 180 },
  { name: 'Orange', hex: '#FD9349', hue: 25 },
  { name: 'Purple', hex: '#8B5CF6', hue: 260 },
  { name: 'Lime', hex: '#7AC00F', hue: 82 },
  { name: 'Green', hex: '#3F6212', hue: 90 },
  { name: 'Pink', hex: '#F198C4', hue: 330 },
  { name: 'Blue', hex: '#2563EB', hue: 220 },
];

/** Hard-coded fallback palette in case the randomizer fails */
const FALLBACK_PALETTE: { name: string; hex: string; hue: number }[] = [
  { name: 'Red', hex: '#EF4444', hue: 0 },
  { name: 'Blue', hex: '#2563EB', hue: 220 },
  { name: 'Yellow', hex: '#FDE047', hue: 50 },
  { name: 'Purple', hex: '#8B5CF6', hue: 260 },
  { name: 'Teal', hex: '#2DD4D4', hue: 180 },
  { name: 'Orange', hex: '#FD9349', hue: 25 },
  { name: 'Green', hex: '#3F6212', hue: 90 },
  { name: 'Pink', hex: '#F198C4', hue: 330 },
  { name: 'Lime', hex: '#7AC00F', hue: 82 },
];

const NEUTRAL = '#D1D5DB';

const ANCHORS = [
  { name: 'Black', hex: '#000000', hue: -1 },
  { name: 'White', hex: '#FFFFFF', hue: -2 },
];

export type GamePhase = 'idle' | 'observation' | 'recall' | 'result';

export const MAX_ROUNDS = 3;

/** 3x2 grid — 3 columns x 2 rows = 6 slots total. */
export const GRID_SIZE = 6;

/** Stage identifiers for the daily 3-stage progression. */
export type StageKey = 'stage1' | 'stage2' | 'stage2b' | 'stage3';

/** Color counts per stage. Stage 2 falls back to 2b (4 elements) on failure. */
export const STAGE_COLOR_COUNTS: Record<StageKey, number> = {
  stage1: 3,
  stage2: 5,
  stage2b: 4,
  stage3: 6,
};

/** Seed offsets so every user worldwide gets the same puzzle per stage. */
const STAGE_SEED_OFFSETS: Record<StageKey, number> = {
  stage1: 1000,
  stage2: 2000,
  stage2b: 2500,
  stage3: 3000,
};

/** Stage 1-based numeric index (1 / 2 / 3) for any stage key (2b counts as 2). */
export function stageNumber(stage: StageKey): 1 | 2 | 3 {
  if (stage === 'stage1') return 1;
  if (stage === 'stage3') return 3;
  return 2;
}

/** Map a stage to the persisted roundIndex slot (0/1/2). */
export function stageToRoundIndex(stage: StageKey): number {
  return stageNumber(stage) - 1;
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
  const day = now.getDay();
  const nameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return {
    dayOfWeek: day,
    dayName: nameMap[day],
    // Retained for back-compat. The daily flow no longer scales by weekday;
    // every day runs the same 3-stage progression (3 → 5/4 → 6).
    colorCount: STAGE_COLOR_COUNTS.stage3,
  };
}

/** Fallback solution using hard-coded palette when generation fails */
function generateFallbackSolution(): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  const colorCount = STAGE_COLOR_COUNTS.stage1;
  const chosen = FALLBACK_PALETTE.slice(0, colorCount);
  const positions = Array.from({ length: colorCount }, (_, i) => i);
  const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
  positions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });
  return { solution, activeColors: chosen, colorCount };
}

/**
 * Generate a puzzle for a specific stage, deterministic per (date, stage, regenIndex).
 * Anchors (Black/White) are appended when colorCount >= 5 so the FIFA theme keeps
 * Cup/Ball on the higher-tile stages.
 */
export function generateStageSolution(
  stage: StageKey,
  regenIndex: number = 0,
): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  try {
    const colorCount = STAGE_COLOR_COUNTS[stage];
    const baseSeed = getDateSeed();
    const seed = baseSeed + STAGE_SEED_OFFSETS[stage] + regenIndex * 7919;
    const rand = seededRandom(seed);

    const shuffled = [...COLORS].sort(() => rand() - 0.5);
    let chosen: { name: string; hex: string; hue: number }[];
    if (colorCount >= 5) {
      chosen = [...shuffled.slice(0, colorCount - 2), ...ANCHORS];
    } else {
      chosen = shuffled.slice(0, colorCount);
    }

    const coloredPositions = getNonAdjacentPositions(chosen, colorCount, rand);
    const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
    coloredPositions.forEach((pos, i) => {
      solution[pos] = chosen[i].hex;
    });

    return { solution, activeColors: chosen, colorCount };
  } catch (err) {
    console.error('[Chromatic] generateStageSolution failed, using fallback:', err);
    return generateFallbackSolution();
  }
}

/** Back-compat shim. Maps the legacy round index to a stage key. */
export function generateSolution(roundIndex: number = 0) {
  const stage: StageKey =
    roundIndex >= 2 ? 'stage3' : roundIndex === 1 ? 'stage2' : 'stage1';
  return generateStageSolution(stage, 0);
}

export type DDALevel = 'standard' | 'hard';

/** Difficulty tier based on color count */
export function getDayDifficultyTier(colorCount: number): 'easy' | 'medium' | 'hard' {
  if (colorCount <= 3) return 'easy';
  if (colorCount <= 5) return 'medium';
  return 'hard';
}

/**
 * Check if two colors are "palette neighbors" (hue distance < 50).
 */
function areHueNeighbors(a: typeof COLORS[0], b: typeof COLORS[0]): boolean {
  const diff = Math.abs(a.hue - b.hue);
  return Math.min(diff, 360 - diff) < 50;
}

/**
 * Ensure placed colors on the 3x2 grid avoid hue-similar colors in
 * neighboring cells (including diagonals).
 */
function getNonAdjacentPositions(
  chosen: typeof COLORS,
  colorCount: number,
  rand: () => number
): number[] {
  // 3x2 adjacency (3 cols × 2 rows, including diagonals)
  // layout indices:  0 1 2
  //                  3 4 5
  const adjacent: Record<number, number[]> = {
    0: [1, 3, 4],
    1: [0, 2, 3, 4, 5],
    2: [1, 4, 5],
    3: [0, 1, 4],
    4: [0, 1, 2, 3, 5],
    5: [1, 2, 4],
  };

  // Try up to 200 random arrangements and pick the best one
  let bestPositions: number[] = [];
  let bestConflicts = Infinity;

  for (let attempt = 0; attempt < 200; attempt++) {
    const allPos = Array.from({ length: GRID_SIZE }, (_, i) => i).sort(() => rand() - 0.5);
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
 * Back-compat shim — daily flow now uses generateStageSolution. Kept so older
 * call sites (and the Practice DDA pathway) continue to work.
 */
export function generateSolutionDDA(
  roundIndex: number,
  _ddaLevel: DDALevel
): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  return generateSolution(roundIndex);
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
  visualTheme?: 'colors' | 'patterns' | 'shapes' | 'fifa';
  recallMs?: number;
  /** Stage 2 sub-puzzle the attempt was played on. */
  substage?: 'main' | '2b';
  /** Regeneration index used for this attempt (0 = first puzzle for the stage). */
  regenIndex?: number;
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
  // Daily ends the moment Stage 3 records an attempt (win OR lose).
  const stage3Round = data.rounds.find(r => r.roundIndex === 2);
  const stage3Attempted = !!stage3Round && stage3Round.attempts.length > 0;
  // Current round = next unsolved stage; if everything solved, point to last.
  const solvedCount = data.rounds.filter(r => r.solved).length;
  const currentRound = Math.min(solvedCount, MAX_ROUNDS - 1);
  const finished = data.finished || stage3Attempted;

  return { roundIndex: currentRound, totalAttemptsUsed: totalUsed, finished, rounds: data.rounds };
}

export function saveRoundAttempt(
  roundIndex: number,
  isCorrect: boolean,
  playerGrid: (string | null)[],
  solution: (string | null)[],
  visualTheme?: 'colors' | 'patterns' | 'shapes' | 'fifa',
  recallMs?: number,
  substage?: 'main' | '2b',
  regenIndex?: number,
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

  round.attempts.push({ grid: playerGrid, isCorrect, solution, visualTheme, recallMs, substage, regenIndex });
  round.solution = solution; // update to latest solution for this round
  if (isCorrect) round.solved = true;

  // Daily is over the moment Stage 3 records an attempt (win or loss).
  const stage3 = rounds.find(r => r.roundIndex === 2);
  const finished = !!stage3 && stage3.attempts.length > 0;

  // Streak logic — only update when finishing for the first time today
  let currentStreak = existing?.currentStreak ?? 0;
  let maxStreak = existing?.maxStreak ?? 0;

  if (finished) {
    const alreadyFinishedToday = isToday && existing?.finished;
    if (!alreadyFinishedToday) {
      // Streak only advances when the player WINS Stage 3.
      const wonDaily = !!stage3?.solved;
      if (wonDaily) {
        const prevPlayed = existing?.lastPlayed;
        const playedYesterday = prevPlayed === getYesterdayString();
        const hadSolveYesterday = existing?.rounds?.find(r => r.roundIndex === 2)?.solved ?? false;
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

export function getResultMessage(roundIndex: number, attemptInRound: number, isCorrect: boolean, totalAttemptsUsed: number, theme?: string): string {
  const remaining = MAX_ROUNDS - totalAttemptsUsed;
  const fifa = theme === 'fifa';

  if (isCorrect) {
    if (fifa) {
      if (totalAttemptsUsed >= MAX_ROUNDS && attemptInRound >= 2) {
        return "Stoppage-Time Winner! ⚽ Final whistle — World-class form!";
      }
      if (roundIndex === 0 && attemptInRound === 1) {
        return remaining > 0
          ? `Goal! Top corner. You've got ${remaining} round${remaining > 1 ? 's' : ''} left — fresh fixture for Round ${roundIndex + 2}.`
          : "Goal! Perfect run — World-class form!";
      }
      if (totalAttemptsUsed >= MAX_ROUNDS) {
        return "On Fire! That's the final whistle — match complete.";
      }
      return remaining > 0
        ? `On Fire! ${roundIndex + 1} round${roundIndex + 1 > 1 ? 's' : ''} down. Next kickoff coming up.`
        : "Match complete — On Fire today!";
    }
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

export function generateShareText(
  rounds: RoundData[],
  starsEarned: number = 0,
  totalFocusSeconds: number = 0,
  metrics?: {
    consistency: number;
    reflexAvg: number | null;
    peak: { tiles: number; seconds: number } | null;
    tilesDecoded: number;
    visualStyles?: string;
  },
): string {
  const { dayName, colorCount } = getDayInfo();
  const dayNum = getDayNumber();

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
        allAttempts.push({ ...attempt, solution: attempt.solution ?? round.solution });
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

  if (metrics?.visualStyles) {
    lines.push(`🎨 Visual Style: ${metrics.visualStyles}`);
  }
  lines.push(`⭐️ Speed Stars: ${starsEarned}`);

  if (metrics) {
    const peak = metrics.peak ? `${metrics.peak.tiles} in ${metrics.peak.seconds.toFixed(1)}s` : '—';
    lines.push(`⏱️ Peak: ${peak}`);
  }

  lines.push('');
  lines.push('Play Chromatic: https://chromatic-daily.lovable.app');
  return lines.join('\n');
}
