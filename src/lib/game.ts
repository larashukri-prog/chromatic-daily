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
 * All tiles are drawn from the chromatic palette only — no black/white anchors.
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
    const chosen = shuffled.slice(0, colorCount);

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

/**
 * Per-stage result copy.
 * `nextStage` describes what the game will do AFTER this attempt:
 *   - 'stage2'  → advancing to Stage 2 main
 *   - 'stage2b' → Stage 2 main was failed; dropping to 4-element Stage 2b
 *   - 'stage3'  → advancing to Stage 3
 *   - 'regen'   → same stage, regenerated puzzle (Stage 1 fail or Stage 2b fail)
 *   - 'done'    → daily complete (Stage 3 attempt, win or lose)
 */
export function getStageResultMessage(
  stage: StageKey,
  isCorrect: boolean,
  nextStage: 'stage2' | 'stage2b' | 'stage3' | 'regen' | 'done',
  theme?: string,
): string {
  const fifa = theme === 'fifa';

  if (isCorrect) {
    if (nextStage === 'stage2') {
      return fifa
        ? "Goal! 1–0. Stage 2 kicks off with 5 elements — keep your shape."
        : "Nailed it. Stage 2 brings 5 elements — let's keep the rhythm going.";
    }
    if (nextStage === 'stage3') {
      return fifa
        ? "Brace yourself — Stage 3 is the title decider: 6 elements, full pitch."
        : "Locked in. Stage 3 fills the whole grid with 6 elements. Final round.";
    }
    if (nextStage === 'done') {
      return fifa
        ? "Full Time — World-class form! You took the daily."
        : "Daily complete. Perfect close on Stage 3 — incredible recall.";
    }
    return fifa ? "Goal!" : "Got it!";
  }

  // Failed
  if (nextStage === 'regen') {
    if (stage === 'stage1') {
      return fifa
        ? "Wide of the post. Same stage, brand-new fixture — line it up again."
        : "Not quite. Same stage, a fresh 3-element puzzle is loading.";
    }
    return fifa
      ? "Off target. Stage 2 retry — another 4-element setup coming up."
      : "Close. Another Stage 2 (4-element) puzzle is loading — clear it to reach Stage 3.";
  }
  if (nextStage === 'stage2b') {
    return fifa
      ? "Tough one. Dropping to a 4-element Stage 2 — solve it to reach Stage 3."
      : "Not this time. Stage 2 drops to 4 elements — solve it to unlock Stage 3.";
  }
  if (nextStage === 'done') {
    return fifa
      ? "Final whistle. Stage 3 slipped away — see you tomorrow."
      : "That's a wrap. Stage 3 wasn't yours today — fresh challenge tomorrow.";
  }
  return "Not quite — try again.";
}

/** Back-compat alias used by older call sites. */
export function getResultMessage(_roundIndex: number, _attemptInRound: number, isCorrect: boolean, _totalAttemptsUsed: number, theme?: string): string {
  return getStageResultMessage('stage1', isCorrect, isCorrect ? 'stage2' : 'regen', theme);
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
  const { dayName } = getDayInfo();
  const dayNum = getDayNumber();

  // Build per-stage summary lines. Each stage shows the FINAL attempt the player
  // landed on (Stage 2 may have ended on the 4-element 2b sub-puzzle).
  const stageHeader = (idx: number, tileCount: number): string => {
    if (idx === 1) return `Stage 2 · ${tileCount}`;
    return `Stage ${idx} · ${tileCount}`;
  };

  const lines: string[] = [
    `Chromatic #${dayNum}`,
    `${dayName} | 3-Stage Daily`,
    '',
  ];

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const round = rounds.find(r => r.roundIndex === i);
    const lastAttempt = round?.attempts[round.attempts.length - 1];
    if (round && lastAttempt) {
      const sol = lastAttempt.solution ?? round.solution ?? [];
      const tileCount = sol.filter(s => s !== null).length;
      const statusIcon = lastAttempt.isCorrect ? '✅' : '❌';
      lines.push(`${stageHeader(i + 1, tileCount)} ${statusIcon}`);
      const cells = Array.from({ length: GRID_SIZE }, (_, j) => {
        const s = sol[j] ?? null;
        const placed = lastAttempt.grid?.[j] ?? null;
        if (s === null && placed === null) return '⚪';
        if (s !== null && placed === null) return '🔴';
        if (s === null && placed !== null) return '🔴';
        const isMatch = s!.toLowerCase() === placed!.toLowerCase();
        return isMatch ? '🟢' : '🔴';
      });
      lines.push(cells.slice(0, 3).join(''));
      lines.push(cells.slice(3, 6).join(''));
    } else {
      lines.push(`Stage ${i + 1} ⬜`);
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
