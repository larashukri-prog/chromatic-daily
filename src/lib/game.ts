// Chromatic Daily - Game Logic

import { getDailyPalette, getDailyPaletteName } from '@/lib/palette';

export interface ColorDef {
  name: string;
  hex: string;
  hue: number;
}

/**
 * The active palette is the dynamic OKLCH daily palette (9 colors, generated
 * from the local weekday). Both visual styles share it — only the MIX overlay
 * differs.
 */
function activePalette(): ColorDef[] {
  return getDailyPalette().map((c) => ({ name: c.name, hex: c.hex, hue: c.hue }));
}

const NEUTRAL = '#D1D5DB';

export type GamePhase = 'idle' | 'observation' | 'recall' | 'result';

export const MAX_ROUNDS = 3;

/** 2x3 grid — 2 columns x 3 rows = 6 slots total. */
export const GRID_SIZE = 6;

/**
 * Stage identifiers for the adaptive 3-attempt daily.
 * Progression rules (win → step up, loss → repeat same tier with fresh puzzle):
 *   stage1 (3) → win→stage2 (5)        / loss→stage1b (3, fresh)
 *   stage1b (3) → win→stage2 (5)       / loss→stage1c (3, fresh)
 *   stage2 (5) → win→stage3 (6)        / loss→stage2r (5, fresh)
 *   stage1c / stage2r / stage3 are terminal (3rd attempt).
 */
export type StageKey =
  | 'stage1'
  | 'stage1b'
  | 'stage1c'
  | 'stage2'
  | 'stage2r'
  | 'stage3';

export const STAGE_COLOR_COUNTS: Record<StageKey, number> = {
  stage1: 3,
  stage1b: 3,
  stage1c: 3,
  stage2: 5,
  stage2r: 5,
  stage3: 6,
};

/** Seed offsets so every user worldwide gets the same puzzle per stage. */
const STAGE_SEED_OFFSETS: Record<StageKey, number> = {
  stage1: 1000,
  stage1b: 1500,
  stage1c: 1750,
  stage2: 2000,
  stage2r: 2500,
  stage3: 3000,
};

/** Attempt number (1 / 2 / 3) this stage represents. */
export function stageNumber(stage: StageKey): 1 | 2 | 3 {
  if (stage === 'stage1') return 1;
  if (stage === 'stage1b' || stage === 'stage2') return 2;
  return 3; // stage1c, stage2r, stage3
}

/** Map a stage to the persisted roundIndex slot (0/1/2). */
export function stageToRoundIndex(stage: StageKey): number {
  return stageNumber(stage) - 1;
}

/**
 * Adaptive next-stage selector. Win steps difficulty up, loss repeats the
 * current tier with a fresh puzzle. Returns null for terminal stages.
 */
export function getNextStage(stage: StageKey, wasCorrect: boolean): StageKey | null {
  switch (stage) {
    case 'stage1':
      return wasCorrect ? 'stage2' : 'stage1b';
    case 'stage1b':
      return wasCorrect ? 'stage2' : 'stage1c';
    case 'stage2':
      return wasCorrect ? 'stage3' : 'stage2r';
    case 'stage1c':
    case 'stage2r':
    case 'stage3':
      return null;
  }
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

/** Fallback solution using the provided palette when generation fails. */
function generateFallbackSolution(
  palette: ColorDef[] = CHROMATIC_COLORS,
): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  // Generate against the canonical chromatic palette, then project by index
  // onto the requested palette so every theme lines up 1:1.
  const colorCount = Math.min(STAGE_COLOR_COUNTS.stage1, CHROMATIC_COLORS.length, palette.length);
  const chosenIdx = Array.from({ length: colorCount }, (_, i) => i);
  const chosen = chosenIdx.map((i) => palette[i]);
  const positions = Array.from({ length: colorCount }, (_, i) => i);
  const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
  positions.forEach((pos, i) => {
    solution[pos] = chosen[i].hex;
  });
  return { solution, activeColors: chosen, colorCount };
}

/**
 * Generate a puzzle for a specific stage, deterministic per (date, stage, regenIndex, palette).
 * All tiles are drawn from the supplied palette — no black/white anchors.
 */
export function generateStageSolution(
  stage: StageKey,
  regenIndex: number = 0,
  palette: ColorDef[] = CHROMATIC_COLORS,
): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  try {
    // Always generate against the canonical CHROMATIC palette so positions
    // and chosen slot indices are identical across every visual theme.
    // Then translate each chosen index onto the active theme's palette.
    const colorCount = Math.min(
      STAGE_COLOR_COUNTS[stage],
      CHROMATIC_COLORS.length,
      palette.length,
    );
    const baseSeed = getDateSeed();
    const seed = baseSeed + STAGE_SEED_OFFSETS[stage] + regenIndex * 7919;
    const rand = seededRandom(seed);

    // Shuffle canonical indices, not palette entries, so the RNG stream is
    // palette-independent.
    const canonicalIdx = CHROMATIC_COLORS.map((_, i) => i).sort(() => rand() - 0.5);
    const chosenIdx = canonicalIdx.slice(0, colorCount);
    const chosenCanonical = chosenIdx.map((i) => CHROMATIC_COLORS[i]);

    // Adjacency uses canonical hues so placements are also theme-independent.
    const coloredPositions = getNonAdjacentPositions(chosenCanonical, colorCount, rand);

    // Project chosen indices onto the active theme's palette (1:1 by index).
    const chosen = chosenIdx.map((i) => palette[i]);
    const solution: (string | null)[] = Array(GRID_SIZE).fill(null);
    coloredPositions.forEach((pos, i) => {
      solution[pos] = chosen[i].hex;
    });

    return { solution, activeColors: chosen, colorCount };
  } catch (err) {
    console.error('[Chromatic] generateStageSolution failed, using fallback:', err);
    return generateFallbackSolution(palette);
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
function areHueNeighbors(a: ColorDef, b: ColorDef): boolean {
  const diff = Math.abs(a.hue - b.hue);
  return Math.min(diff, 360 - diff) < 50;
}

/**
 * Ensure placed colors on the 2x3 grid avoid hue-similar colors in
 * neighboring cells (including diagonals).
 */
function getNonAdjacentPositions(
  chosen: ColorDef[],
  colorCount: number,
  rand: () => number
): number[] {
  // 2x3 adjacency (2 cols × 3 rows, including diagonals)
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

export function getColorsForTheme(theme: string): ColorDef[] {
  return theme === 'mta' ? MTA_COLORS : CHROMATIC_COLORS;
}

export { NEUTRAL, COLORS, CHROMATIC_COLORS, MTA_COLORS };

// Local storage helpers
const STORAGE_KEY = 'chromatic-daily';

export interface RoundAttempt {
  grid: (string | null)[];
  isCorrect: boolean;
  solution: (string | null)[];
  visualTheme?: 'colors' | 'patterns' | 'shapes' | 'mta';
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
  // Daily ends after 3 total attempts (adaptive paths may never reach roundIndex 2).
  const reachedMax = totalUsed >= MAX_ROUNDS;
  // Current round = next unsolved stage; if everything solved, point to last.
  const solvedCount = data.rounds.filter(r => r.solved).length;
  const currentRound = Math.min(solvedCount, MAX_ROUNDS - 1);
  const finished = data.finished || reachedMax;

  return { roundIndex: currentRound, totalAttemptsUsed: totalUsed, finished, rounds: data.rounds };
}

export function saveRoundAttempt(
  roundIndex: number,
  isCorrect: boolean,
  playerGrid: (string | null)[],
  solution: (string | null)[],
  visualTheme?: 'colors' | 'patterns' | 'shapes' | 'mta',
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

  // Daily is over after MAX_ROUNDS total attempts (adaptive paths may stay on roundIndex 0/1).
  const totalAttempts = rounds.reduce((sum, r) => sum + r.attempts.length, 0);
  const finished = totalAttempts >= MAX_ROUNDS;
  const stage3 = rounds.find(r => r.roundIndex === 2);

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
 * Per-stage result copy. Messaging is driven by the NEXT stage's tile count
 * (or 'done' when the daily ends), so adaptive failure paths read naturally.
 */
export function getStageResultMessage(
  _stage: StageKey,
  isCorrect: boolean,
  nextStage: StageKey | 'done',
  theme?: string,
): string {
  const mta = theme === 'mta';

  if (nextStage === 'done') {
    if (isCorrect) {
      return mta
        ? 'Last stop — you rode the line clean. Nailed the daily.'
        : 'Daily complete. Perfect close — incredible recall.';
    }
    return mta
      ? 'End of the line. Fresh route tomorrow — service resumes at midnight.'
      : "That's a wrap — fresh challenge tomorrow.";
  }

  const nextCount = STAGE_COLOR_COUNTS[nextStage];

  if (isCorrect) {
    if (nextCount === 5) {
      return mta
        ? 'Right on time. Next stop: 5 elements — mind the gap.'
        : "Nailed it. Next attempt brings 5 elements — keep the rhythm.";
    }
    if (nextCount === 6) {
      return mta
        ? 'Express run — final attempt: 6 elements, all lines lit.'
        : 'Locked in. Final attempt fills the grid with 6 elements.';
    }
    return mta ? 'Right on time.' : 'Got it!';
  }

  // Wrong — repeat the same tier with a fresh puzzle.
  if (nextCount === 3) {
    return mta
      ? 'Missed the train. Same 3 elements, new route — try again.'
      : 'Not quite. Same 3 elements, a fresh pattern — give it another go.';
  }
  if (nextCount === 5) {
    return mta
      ? 'Off track. Another 5-element route rolling in.'
      : 'Close. Another 5-element pattern is next.';
  }
  return 'Not quite — try again.';
}

/** Back-compat alias used by older call sites. */
export function getResultMessage(_roundIndex: number, _attemptInRound: number, isCorrect: boolean, _totalAttemptsUsed: number, theme?: string): string {
  return getStageResultMessage('stage1', isCorrect, 'stage2', theme);
}

export function getResultBadge(rounds: RoundData[]): { label: string; sublabel: string } {
  const attempts = rounds.flatMap((r) => r.attempts);
  const wins = attempts.filter((a) => a.isCorrect).length;
  if (wins >= MAX_ROUNDS) {
    return { label: 'Flawless ✨', sublabel: 'Absolute clarity. See you tomorrow.' };
  }
  if (wins <= 0) {
    return { label: 'Overloaded 😵\u200d💫', sublabel: 'Sequence broken. Fresh start at midnight.' };
  }
  const lastCorrect = attempts[attempts.length - 1]?.isCorrect ?? false;
  if (!lastCorrect) {
    return { label: 'So Close! 🤏', sublabel: 'Almost there — come back sharper tomorrow.' };
  }
  return { label: 'Resilient 💪', sublabel: 'Way to fight back. Try for flawless tomorrow.' };
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
  const stageHeader = (idx: number, _tileCount: number): string => `Attempt ${idx}`;

  const lines: string[] = [
    `Chromatic #${dayNum}`,
    dayName,
    getResultBadge(rounds).label,
    '',
  ];

  // Flatten attempts chronologically across rounds. Adaptive paths can store
  // multiple attempts under the same roundIndex (e.g. stage1b + stage2 both
  // map to roundIndex 1), so indexing by roundIndex would lose attempts and
  // render empty placeholders. Rounds are pushed in play order, and attempts
  // within a round are appended in order, so flatMap yields A1, A2, A3.
  const allAttempts = rounds.flatMap(r =>
    r.attempts.map(a => ({ attempt: a, roundSolution: r.solution })),
  );

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const entry = allAttempts[i];
    if (entry) {
      const { attempt, roundSolution } = entry;
      const sol = attempt.solution ?? roundSolution ?? [];
      const tileCount = sol.filter(s => s !== null).length;
      const statusIcon = attempt.isCorrect ? '✅' : '❌';
      lines.push(`${stageHeader(i + 1, tileCount)} ${statusIcon}`);
      const cells = Array.from({ length: GRID_SIZE }, (_, j) => {
        const s = sol[j] ?? null;
        const placed = attempt.grid?.[j] ?? null;
        if (s === null && placed === null) return '⚪';
        if (s !== null && placed === null) return '🔴';
        if (s === null && placed !== null) return '🔴';
        const isMatch = s!.toLowerCase() === placed!.toLowerCase();
        return isMatch ? '🟢' : '🔴';
      });
      lines.push(cells.slice(0, 2).join(''));
      lines.push(cells.slice(2, 4).join(''));
      lines.push(cells.slice(4, 6).join(''));
    } else {
      lines.push(`Attempt ${i + 1} ⬜`);
      lines.push('⚪⚪');
      lines.push('⚪⚪');
      lines.push('⚪⚪');
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
