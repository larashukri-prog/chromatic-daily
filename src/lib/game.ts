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

export interface GameState {
  phase: GamePhase;
  solution: (string | null)[]; // 9 cells, hex or null
  playerGrid: (string | null)[];
  selectedColor: string | null;
  dayOfWeek: number; // 0=Sun, 1=Mon...6=Sat
  colorCount: number;
  activeColors: { name: string; hex: string }[];
  timer: number;
  result: boolean[] | null;
  isCorrect: boolean;
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
  // Mon=3, Tue=4, Wed=5, Thu=6, Fri=7, Sat=8, Sun=9
  const countMap: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 0: 9 };
  const nameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  return {
    dayOfWeek: day,
    dayName: nameMap[day],
    colorCount: countMap[day],
  };
}

export function generateSolution(): { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number } {
  const { colorCount } = getDayInfo();
  const seed = getDateSeed();
  const rand = seededRandom(seed);

  // Shuffle colors
  const shuffled = [...COLORS].sort(() => rand() - 0.5);
  const chosen = shuffled.slice(0, colorCount);

  // Shuffle positions
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

interface StoredData {
  lastPlayed: string; // YYYY-MM-DD
  currentStreak: number;
  maxStreak: number;
  lastResult: boolean; // was last game correct?
  lastGrid: (string | null)[];
  lastSolution: (string | null)[];
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
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasPlayedToday(): boolean {
  const data = loadData();
  return data?.lastPlayed === getTodayString();
}

export function saveResult(isCorrect: boolean, playerGrid: (string | null)[], solution: (string | null)[]) {
  const today = getTodayString();
  const existing = loadData();

  let currentStreak = 1;
  let maxStreak = existing?.maxStreak ?? 0;

  if (isCorrect) {
    if (existing && (existing.lastPlayed === getYesterdayString()) && existing.lastResult) {
      currentStreak = existing.currentStreak + 1;
    }
  } else {
    currentStreak = 0;
  }

  maxStreak = Math.max(maxStreak, currentStreak);

  const data: StoredData = {
    lastPlayed: today,
    currentStreak,
    maxStreak,
    lastResult: isCorrect,
    lastGrid: playerGrid,
    lastSolution: solution,
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

export function generateShareText(playerGrid: (string | null)[], solution: (string | null)[]): string {
  const { dayName } = getDayInfo();
  const dayNum = getDayNumber();
  const streaks = getStreaks();

  const emojis = solution.map((color, i) => {
    if (color === null) return '⬜';
    return playerGrid[i] === color ? '🟩' : '⬛';
  });

  const rows = [
    emojis.slice(0, 3).join(''),
    emojis.slice(3, 6).join(''),
    emojis.slice(6, 9).join(''),
  ];

  return `Chromatic Daily #${dayNum}\n${dayName}\n${rows.join('\n')}\nStreak: ${streaks.current} day${streaks.current !== 1 ? 's' : ''}`;
}
