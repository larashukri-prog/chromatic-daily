import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, Share2, Trophy, RotateCcw, CheckCircle2, ArrowLeft, Sparkles, Star, Eye, BarChart3 } from 'lucide-react';
import { DailySummary } from '@/components/DailySummary';
import { OnboardingOverlay, useOnboarding } from '@/components/OnboardingOverlay';
import { GameGrid } from '@/components/GameGrid';
import { SessionReport, type SessionStats } from '@/components/SessionReport';
import confetti from 'canvas-confetti';

import { MixedTile } from '@/components/MixedTile';
import {
  GamePhase, NEUTRAL, COLORS, CHROMATIC_COLORS, generateSolution, generateSolutionDDA, getDayInfo, getDayNumber,
  hasFinishedToday, getStreaks, generateShareText, getCurrentRoundInfo,
  saveRoundAttempt, getResultMessage, getStageResultMessage, MAX_ROUNDS, getTodayData, RoundData, DDALevel,
  getDayDifficultyTier, GRID_SIZE, STAGE_COLOR_COUNTS, generateStageSolution,
  getNextStage,
  type StageKey,
} from '@/lib/game';
import { generateFreePlayPuzzle } from '@/lib/freeplay';
import { posthog } from '@/lib/posthog';
import { trackVirtualPageview, trackEngagement } from '@/lib/analytics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/** Dynamic timer durations in ms based on color count */
function getObservationDuration(colorCount: number): number {
  let base: number;
  if (colorCount <= 2) base = 5000;
  else if (colorCount <= 3) base = 6000;
  else if (colorCount <= 4) base = 8000;
  else if (colorCount <= 6) base = 10000;
  else base = 15000;
  return base;
}

type GameMode = 'daily' | 'freeplay';

/** Play a short success chime using Web Audio API */
function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880; // A5
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not available — fail silently
  }
}

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [solution, setSolution] = useState<(string | null)[]>(Array(GRID_SIZE).fill(null));
  const [activeColors, setActiveColors] = useState<{ name: string; hex: string }[]>([]);
  const [playerGrid, setPlayerGrid] = useState<(string | null)[]>(Array(GRID_SIZE).fill(null));
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
  const [timerDuration, setTimerDuration] = useState(5000);
  const [result, setResult] = useState<boolean[] | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [shake, setShake] = useState(false);
  const [alreadyFinished, setAlreadyFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalAttemptsUsed, setTotalAttemptsUsed] = useState(0);
  const [attemptInRound, setAttemptInRound] = useState(1);
  // Stage-progression state. roundIndex (0/1/2) maps to stage 1/2/3.
  // `substage` is only meaningful when roundIndex === 1 (Stage 2 main → 2b drop).
  const [substage, setSubstage] = useState<'main' | '2b'>('main');
  const [regenIndex, setRegenIndex] = useState(0);
  const [resultMessage, setResultMessage] = useState('');
  const [savedRounds, setSavedRounds] = useState<RoundData[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [ddaLevel, setDdaLevel] = useState<DDALevel>('standard');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedPlaying = useRef(false);

  // --- Game juice state ---
  const [tileFx, setTileFx] = useState<Record<number, 'fill' | 'clear' | 'shake' | 'ripple'>>({});
  const [flipping, setFlipping] = useState(false);
  const [stagedCheck, setStagedCheck] = useState(false);
  const [swatchPop, setSwatchPop] = useState<string | null>(null);
  const fxTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Speed Star state
  const [isSpeedRound, setIsSpeedRound] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [showStarPop, setShowStarPop] = useState(false);
  const observationStartTime = useRef<number>(0);

  // Focus stat (invisible timer — total seconds spent observing in daily mode)
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);

  // Free Play state
  const [mode, setMode] = useState<GameMode>('daily');
  const [freeplayRoundNum, setFreeplayRoundNum] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Practice Mode Session Stats ---
  const initialStats: SessionStats = {
    roundsPlayed: 0,
    totalCorrect: 0,
    currentStreak: 0,
    longestStreak: 0,
    correctTimes: [],
    tilesDecoded: 0,
    peakComplexity: null,
  };
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);
  const [dailyStats, setDailyStats] = useState<SessionStats>(initialStats);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const recallStartTime = useRef<number>(0);
  const milestoneAudio = useRef<HTMLAudioElement | null>(null);
  const pendingMilestone = useRef(false);
  const mtaCelebrationKey = useRef<string | null>(null);

  useEffect(() => {
    try {
      const a = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_d1718ab41b.mp3');
      a.preload = 'auto';
      a.volume = 0.5;
      milestoneAudio.current = a;
    } catch { /* noop */ }
  }, []);

  const triggerMilestone = useCallback(() => {
    try {
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      // Mobile-safe: build a dedicated full-screen, high-z canvas so bursts
      // are visible above dialogs/overlays and not clipped by parent stacks.
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '2147483647';
      document.body.appendChild(canvas);
      const myConfetti = (confetti as any).create(canvas, {
        resize: true,
        useWorker: true,
      });
      const burst = (origin: { x: number; y: number }, angle: number) =>
        myConfetti({
          particleCount: 80,
          angle,
          spread: 75,
          startVelocity: 55,
          scalar: 1.05,
          origin,
          colors,
          disableForReducedMotion: false,
        });
      burst({ x: 0.05, y: 0.8 }, 60);
      burst({ x: 0.95, y: 0.8 }, 120);
      burst({ x: 0.5, y: 0.4 }, 90);
      // Clean up the canvas after the animation completes.
      setTimeout(() => {
        try { canvas.remove(); } catch { /* noop */ }
      }, 4000);
    } catch { /* noop */ }
    try {
      if (milestoneAudio.current) {
        milestoneAudio.current.currentTime = 0;
        milestoneAudio.current.play().catch(() => {});
      }
    } catch { /* noop */ }
  }, []);

  const fireMtaCelebration = useCallback(() => {
    try {
      const colors = ['#D82233', '#F6BC26'];
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '2147483647';
      document.body.appendChild(canvas);
      const myConfetti = (confetti as any).create(canvas, { resize: true, useWorker: true });
      const burst = (origin: { x: number; y: number }, angle: number) =>
        myConfetti({
          particleCount: 90,
          angle,
          spread: 80,
          startVelocity: 60,
          scalar: 1.1,
          origin,
          colors,
          disableForReducedMotion: false,
        });
      burst({ x: 0.05, y: 0.8 }, 60);
      burst({ x: 0.95, y: 0.8 }, 120);
      burst({ x: 0.5, y: 0.4 }, 90);
      setTimeout(() => { try { canvas.remove(); } catch { /* noop */ } }, 4000);
    } catch { /* noop */ }
  }, []);

  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const { dayName, colorCount: baseColorCount } = getDayInfo();
  const effectiveColorCount = activeColors.length || baseColorCount;

  // Active stage drives the puzzle; updated whenever we advance attempts.
  const [currentStageKey, setCurrentStageKey] = useState<StageKey>('stage1');
  const stageNum: 1 | 2 | 3 = (roundIndex + 1) as 1 | 2 | 3;
  const dayNum = getDayNumber();
  const [streaks, setStreaks] = useState(getStreaks());

  const getDifficultyName = (count: number): string => {
    if (count <= 2) return 'Minimalist';
    if (count <= 4) return 'Standard';
    if (count <= 6) return 'Complex';
    return 'Master';
  };
  const difficultyName = getDifficultyName(baseColorCount);

  const DAY_SALUTATIONS: Record<string, string> = {
    Monday: 'Fresh focus.',
    Tuesday: 'Stay sharp.',
    Wednesday: 'Midweek flow.',
    Thursday: 'Deep attention.',
    Friday: 'Finish strong.',
    Saturday: 'Unwind & play.',
    Sunday: 'Weekly reset.',
  };
  const daySalutation = DAY_SALUTATIONS[dayName] ?? '';

  const isFreeplay = mode === 'freeplay';

  // Picker shows the active palette's colors at every stage — pool > grid forces recall over elimination.
  const pickerColors = CHROMATIC_COLORS;

  useEffect(() => {
    if (mode === 'freeplay') return;
    if (window.location.search.includes('reset')) {
      localStorage.removeItem('chromatic_daily');
      window.history.replaceState({}, '', window.location.pathname);
      setPhase('idle');
      setAlreadyFinished(false);
      setTotalAttemptsUsed(0);
      setStarsEarned(0);
      setTotalFocusSeconds(0);
      setSavedRounds([]);
      setDailyStats(initialStats);
      setRoundIndex(0);
      setAttemptInRound(1);
      setSubstage('main');
      setRegenIndex(0);
      setCurrentStageKey('stage1');
      const { solution: sol, activeColors: ac } = generateStageSolution('stage1', 0);
      setSolution(sol);
      setActiveColors(ac);
      return;
    }
    const info = getCurrentRoundInfo();
    setTotalAttemptsUsed(info.totalAttemptsUsed);
    setSavedRounds(info.rounds);

    if (info.finished) {
      setAlreadyFinished(true);
      const lastRound = info.rounds[info.rounds.length - 1];
      if (lastRound) {
        const lastAttempt = lastRound.attempts[lastRound.attempts.length - 1];
        setSolution(lastRound.solution);
        setPlayerGrid(lastAttempt?.grid ?? Array(GRID_SIZE).fill(null));
        setResult(lastRound.solution.map((c, i) => (lastAttempt?.grid[i] ?? null) === c));
        setIsCorrect(lastRound.solved);
        setRoundIndex(lastRound.roundIndex);
        setPhase('result');
      }
    } else {
      // Walk persisted rounds in order, applying adaptive next-stage rules.
      let stage: StageKey = 'stage1';
      for (let i = 0; i < 2; i++) {
        const r = info.rounds.find((rr) => rr.roundIndex === i);
        const last = r?.attempts[r.attempts.length - 1];
        if (!last) break;
        const next = getNextStage(stage, last.isCorrect);
        if (!next) break;
        stage = next;
      }
      const computedRoundIdx = stage === 'stage1' ? 0
        : (stage === 'stage1b' || stage === 'stage2') ? 1 : 2;
      setRoundIndex(computedRoundIdx);
      setSubstage('main');
      setRegenIndex(0);
      setAttemptInRound(1);
      setCurrentStageKey(stage);
      const { solution: sol, activeColors: ac } = generateStageSolution(stage, 0);
      setSolution(sol);
      setActiveColors(ac);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const startObservation = useCallback(() => {
    const duration = getObservationDuration(activeColors.length || baseColorCount);
    setTimerDuration(duration);
    setPhase('observation');
    setTimerProgress(100);
    setPlayerGrid(Array(GRID_SIZE).fill(null));
    setResult(null);
    setSelectedColor(null);
    setVerifying(false);
    setActiveSlot(null);
    setIsSpeedRound(false);
    observationStartTime.current = Date.now();

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimerProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        // Timer expired — do NOT auto-transition; user must click "I am ready"
      }
    }, 30);
  }, [activeColors.length, baseColorCount]);

  /** Handle user clicking "I am ready" during observation */
  const handleReady = useCallback(() => {
    if (phase !== 'observation') return;
    if (timerRef.current) clearInterval(timerRef.current);
    hasStartedPlaying.current = true;
    trackEngagement('ready_clicked', { mode, round_number: roundIndex + 1 });

    const duration = getObservationDuration(activeColors.length || baseColorCount);
    const elapsed = Date.now() - observationStartTime.current;

    // Accumulate focus seconds (daily mode only)
    if (!isFreeplay) {
      setTotalFocusSeconds((prev) => prev + elapsed / 1000);
    }

    if (elapsed < duration) {
      // Earned a Speed Star!
      setIsSpeedRound(true);
      setShowStarPop(true);
      setTimeout(() => setShowStarPop(false), 400);
      playSuccessChime();
      if (navigator.vibrate) navigator.vibrate(50);
    }

    // Flip the board face-down before revealing the empty receptacles.
    setFlipping(true);
    setSelectedColor(null);
    setTimeout(() => {
      setFlipping(false);
      setPhase('recall');
      recallStartTime.current = Date.now();
    }, 420);
  }, [phase, activeColors.length, baseColorCount, isFreeplay, mode, roundIndex]);

  // --- Countdown helper (shared by daily & freeplay) ---
  const startCountdown = useCallback((onComplete: () => void) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(3);
    let tick = 3;
    countdownRef.current = setInterval(() => {
      tick -= 1;
      if (tick <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        onComplete();
      } else {
        setCountdown(tick);
      }
    }, 1000);
  }, []);

  const startGame = useCallback(() => {
    if (alreadyFinished && !isFreeplay) return;
    posthog.capture('game_started', {
      round_number: roundIndex + 1,
      day_number: dayNum,
      difficulty: difficultyName,
      mode,
    });
    trackVirtualPageview('/play', 'Chromatic Daily — Play');

    const hasPlayed = localStorage.getItem('chromatic-has-played');
    localStorage.setItem('chromatic-has-played', 'true');

    if (!hasPlayed) {
      startCountdown(() => startObservation());
    } else {
      startObservation();
    }
  }, [alreadyFinished, isFreeplay, startObservation, startCountdown, roundIndex, dayNum, difficultyName, mode]);

  // --- Free Play callbacks ---

  const startFreePlayObservation = useCallback((puzzle: { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number }) => {
    const duration = getObservationDuration(puzzle.colorCount);
    setTimerDuration(duration);
    setPhase('observation');
    setTimerProgress(100);
    setIsSpeedRound(false);
    observationStartTime.current = Date.now();

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimerProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        // Do NOT auto-transition — user must click "I am ready"
      }
    }, 30);
  }, []);

  const startFreePlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const puzzle = generateFreePlayPuzzle(1);
    setMode('freeplay');
    setFreeplayRoundNum(1);
    setSessionStats(initialStats);
    pendingMilestone.current = false;
    setShowSessionReport(false);
    setSolution(puzzle.solution);
    setActiveColors(puzzle.activeColors);
    setPlayerGrid(Array(GRID_SIZE).fill(null));
    setResult(null);
    setSelectedColor(null);
    setShowResult(false);
    setIsCorrect(false);
    setResultMessage('');
    setVerifying(false);
    setActiveSlot(null);
    setPhase('idle');
    posthog.capture('practice_started', {
      difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
      color_count: puzzle.colorCount,
    });
    trackVirtualPageview('/practice', 'Chromatic Daily — Practice');
    startCountdown(() => startFreePlayObservation(puzzle));
  }, [startCountdown, startFreePlayObservation]);

  const backToDaily = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
    trackEngagement('main_menu_clicked');
    trackVirtualPageview('/', 'Chromatic Daily');
    setMode('daily');
    setFreeplayRoundNum(0);
    setShowResult(false);

    // Reload daily finished state
    const info = getCurrentRoundInfo();
    setTotalAttemptsUsed(info.totalAttemptsUsed);
    setSavedRounds(info.rounds);
    setStreaks(getStreaks());

    if (info.finished) {
      setAlreadyFinished(true);
      const lastRound = info.rounds[info.rounds.length - 1];
      if (lastRound) {
        const lastAttempt = lastRound.attempts[lastRound.attempts.length - 1];
        setSolution(lastRound.solution);
        setPlayerGrid(lastAttempt?.grid ?? Array(GRID_SIZE).fill(null));
        setResult(lastRound.solution.map((c, i) => (lastAttempt?.grid[i] ?? null) === c));
        setIsCorrect(lastRound.solved);
        setRoundIndex(lastRound.roundIndex);
        setPhase('result');
      }
    } else {
      setPhase('idle');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Auto-transition final result to daily summary after 2 seconds (daily only)
  useEffect(() => {
    if (isFreeplay) return; // No auto-dismiss in freeplay
    // Final = the Stage 3 attempt (win or loss) is on screen.
    const isFinal =
      phase === 'result' &&
      (alreadyFinished ||
        totalAttemptsUsed >= MAX_ROUNDS ||
        getNextStage(currentStageKey, isCorrect) === null);
    if (showResult && isFinal) {
      const timer = setTimeout(() => {
        setShowResult(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showResult, phase, roundIndex, alreadyFinished, isFreeplay, currentStageKey, isCorrect, totalAttemptsUsed]);

  /** Fire a short-lived per-tile effect (bounce / wobble / shake / ripple). */
  const playTileFx = useCallback(
    (indices: number[], type: 'fill' | 'clear' | 'shake' | 'ripple', duration = 400) => {
      if (indices.length === 0) return;
      setTileFx((prev) => {
        const next = { ...prev };
        indices.forEach((i) => { next[i] = type; });
        return next;
      });
      const t = setTimeout(() => {
        setTileFx((prev) => {
          const next = { ...prev };
          indices.forEach((i) => { if (next[i] === type) delete next[i]; });
          return next;
        });
      }, duration);
      fxTimers.current.push(t);
    },
    [],
  );

  useEffect(() => () => { fxTimers.current.forEach(clearTimeout); }, []);

  const handleCircleClick = (index: number) => {
    if (phase !== 'recall') return;
    const newGrid = [...playerGrid];

    if (selectedColor) {
      // Tap same-color slot → clear it back to neutral
      if (newGrid[index] === selectedColor) {
        newGrid[index] = null;
        setPlayerGrid(newGrid);
        setActiveSlot(null);
        playTileFx([index], 'clear', 300);
        return;
      }
      // Color-then-Slot: place/overwrite immediately
      const isOverwrite = newGrid[index] !== null;
      const currentCount = newGrid.filter((c) => c !== null).length;
      if (!isOverwrite && currentCount >= effectiveColorCount) return;
      newGrid[index] = selectedColor;
      setPlayerGrid(newGrid);
      setActiveSlot(null);
      playTileFx([index], 'fill', 320);
      setSwatchPop(selectedColor);
      fxTimers.current.push(setTimeout(() => setSwatchPop(null), 260));
      return;
    }

    // No color selected
    if (newGrid[index] !== null) {
      // Tap filled slot → clear it
      newGrid[index] = null;
      setPlayerGrid(newGrid);
      setActiveSlot(null);
      playTileFx([index], 'clear', 300);
    } else {
      // Tapping the already-active slot → deselect it
      setActiveSlot(activeSlot === index ? null : index);
    }
  };

  const clearGrid = () => {
    if (phase !== 'recall') return;
    setPlayerGrid(Array(GRID_SIZE).fill(null));
    setSelectedColor(null);
    setActiveSlot(null);
    setStagedCheck(false);
  };

  const selectedCount = playerGrid.filter((c) => c !== null).length;
  const canVerify = phase === 'recall' && selectedCount === effectiveColorCount;

  const verify = () => {
    if (!canVerify) return;
    const res = solution.map((c, i) => {
      if (c === null) return playerGrid[i] === null;
      return playerGrid[i] === c;
    });
    const correct = res.every(Boolean);
    setResult(res);
    setIsCorrect(correct);
    setVerifying(true);
    setStagedCheck(false);

    // Success: ripple sweeps top-left → bottom-right across correct tiles.
    // Failure: only the incorrect tiles head-shake, then settle back.
    const wrongIdx = res.map((ok, i) => ({ ok, i })).filter((x) => !x.ok).map((x) => x.i);
    if (correct) {
      const filled = playerGrid.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
      playTileFx(filled, 'ripple', 900);
    } else {
      fxTimers.current.push(setTimeout(() => playTileFx(wrongIdx, 'shake', 240), 600));
      fxTimers.current.push(setTimeout(() => playTileFx(wrongIdx, 'clear', 320), 880));
    }

    const recallSeconds = recallStartTime.current ? (Date.now() - recallStartTime.current) / 1000 : 0;
    const correctTilesThisRound = solution.reduce((n, c, i) => n + (c !== null && res[i] ? 1 : 0), 0);
    const updateStats = (prev: SessionStats): SessionStats => {
      const newRoundsPlayed = prev.roundsPlayed + 1;
      const newCurrentStreak = correct ? prev.currentStreak + 1 : 0;
      const newCorrectTimes = correct ? [...prev.correctTimes, recallSeconds] : prev.correctTimes;
      const newTilesDecoded = correct ? prev.tilesDecoded + correctTilesThisRound : prev.tilesDecoded;
      let newPeak = prev.peakComplexity;
      if (correct) {
        const tiles = effectiveColorCount;
        if (
          !newPeak ||
          tiles > newPeak.tiles ||
          (tiles === newPeak.tiles && recallSeconds < newPeak.seconds)
        ) {
          newPeak = { tiles, seconds: recallSeconds };
        }
      }
      return {
        roundsPlayed: newRoundsPlayed,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(prev.longestStreak, newCurrentStreak),
        correctTimes: newCorrectTimes,
        tilesDecoded: newTilesDecoded,
        peakComplexity: newPeak,
      };
    };

    if (isFreeplay) {
      let milestoneHit = false;
      setSessionStats((prev) => {
        const next = updateStats(prev);
        const crossedMilestone =
          next.roundsPlayed > 0 && next.roundsPlayed % 10 === 0;
        if (crossedMilestone && !correct) {
          pendingMilestone.current = true;
        }
        if (correct && (crossedMilestone || pendingMilestone.current)) {
          milestoneHit = true;
          pendingMilestone.current = false;
        }
        return next;
      });

      // Freeplay: no save, no DDA, no localStorage
      setTimeout(() => {
        setVerifying(false);
        setPhase('result');
        setResultMessage(
          correct
            ? 'Great memory! Ready for the next one?'
            : 'Not quite — give it another shot!'
        );
        // Fire milestone after the verify animation settles so the celebration
        // is visible at the same time the result modal appears (mobile-friendly).
        if (milestoneHit) triggerMilestone();
        if (!correct) {
          setTimeout(() => setShowResult(true), 800);
        } else {
          setFreeplayRoundNum((n) => n + 1);
          setShowResult(true);
        }
      }, 1500);
      return;
    }

    // Daily mode — accumulate the same metrics for the daily summary.
    setDailyStats(updateStats);

    // Daily mode verification — stage-aware persistence.
    const newTotalUsed = totalAttemptsUsed + 1;
    const substageForSave: 'main' | '2b' | undefined =
      roundIndex === 1 ? substage : undefined;
    const savedData = saveRoundAttempt(
      roundIndex,
      correct,
      playerGrid,
      solution,
      'mixed',
      Math.round(recallSeconds * 1000),
      substageForSave,
      regenIndex,
    );

    console.log('[Chromatic] Round verified:', {
      stage: currentStageKey,
      roundIndex,
      substage: substageForSave,
      regenIndex,
      isCorrect: correct,
      totalAttemptsUsed: newTotalUsed,
      effectiveColorCount,
      activeColorsCount: activeColors.length,
      ddaLevel,
      resultsArray: savedData.rounds.map(r => ({
        round: r.roundIndex,
        solved: r.solved,
        attempts: r.attempts.map(a => a.isCorrect ? '✅' : '❌'),
      })),
    });

    setTimeout(() => {
      setVerifying(false);
      setPhase('result');

      setTotalAttemptsUsed(newTotalUsed);
      setSavedRounds(savedData.rounds);
      setStreaks({ current: savedData.currentStreak, max: savedData.maxStreak });

      posthog.capture('round_verified', {
        round_number: roundIndex + 1,
        stage: currentStageKey,
        is_correct: correct,
        speed_bonus: isSpeedRound,
        recall_seconds: recallSeconds,
      });

      posthog.capture('daily_streak_updated', {
        current_streak: savedData.currentStreak,
        max_streak: savedData.maxStreak,
      });

      if (correct && isSpeedRound) {
        setStarsEarned(prev => prev + 1);
      }

      // Adaptive next stage: win steps up difficulty, loss repeats the tier.
      const nextStageKey = getNextStage(currentStageKey, correct);
      const nextStageArg: StageKey | 'done' = nextStageKey ?? 'done';
      const msg = getStageResultMessage(currentStageKey, correct, nextStageArg);
      setResultMessage(msg);

      // Fire confetti when the daily is won on the final attempt.
      const isDailyDone = nextStageKey === null;
      if (correct && isDailyDone) {
        const key = `final:win`;
        if (mtaCelebrationKey.current !== key) {
          mtaCelebrationKey.current = key;
          triggerMilestone();
        }
      }

      // Daily ends when: stage is terminal, OR we've used all 3 attempts (adaptive paths).
      const done = nextStageKey === null || newTotalUsed >= MAX_ROUNDS;
      if (done || savedData.finished) {
        setAlreadyFinished(true);
      }

      if (!correct) {
        setTimeout(() => setShowResult(true), 800);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  // Board is armed (ambient pulse) once every tile is placed, awaiting Verify.
  useEffect(() => {
    setStagedCheck(canVerify && !verifying);
  }, [canVerify, verifying]);

  const canContinue =
    phase === 'result' &&
    !alreadyFinished &&
    totalAttemptsUsed < MAX_ROUNDS &&
    getNextStage(currentStageKey, isCorrect) !== null;

  const nextAttempt = () => {
    setShowResult(false);

    // Adaptive advance using the last attempt's outcome.
    const nextStage = getNextStage(currentStageKey, isCorrect);
    if (!nextStage) return; // terminal — daily is done
    const nextRoundIdx = nextStage === 'stage1' ? 0
      : (nextStage === 'stage1b' || nextStage === 'stage2') ? 1 : 2;

    setCurrentStageKey(nextStage);
    setRoundIndex(nextRoundIdx);
    setSubstage('main');
    setRegenIndex(0);
    setAttemptInRound(1);
    const { solution: sol, activeColors: ac } = generateStageSolution(nextStage, 0);
    setSolution(sol);
    setActiveColors(ac);

    startObservation();
  };

  // Freeplay: next level or retry
  const freeplayNext = useCallback(() => {
    setShowResult(false);
    const nextRound = freeplayRoundNum + 1;
    const puzzle = generateFreePlayPuzzle(nextRound);
    setFreeplayRoundNum(nextRound);
    posthog.capture('practice_next_level', {
      difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
      color_count: puzzle.colorCount,
      round_number: freeplayRoundNum + 1,
    });
    setSolution(puzzle.solution);
    setActiveColors(puzzle.activeColors);
    setPlayerGrid(Array(GRID_SIZE).fill(null));
    setResult(null);
    setSelectedColor(null);
    setActiveSlot(null);
    setPhase('idle');
    setTimeout(() => startFreePlayObservation(puzzle), 50);
  }, [startFreePlayObservation, freeplayRoundNum]);

  const freeplayRetry = useCallback(() => {
    setShowResult(false);
    setPlayerGrid(Array(GRID_SIZE).fill(null));
    setResult(null);
    setSelectedColor(null);
    setActiveSlot(null);
    setPhase('idle');
    const currentColorCount = activeColors.length;
    setTimeout(() => {
      const duration = getObservationDuration(currentColorCount);
      setTimerDuration(duration);
      setPhase('observation');
      setTimerProgress(100);
      setIsSpeedRound(false);
      observationStartTime.current = Date.now();

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setTimerProgress(remaining);
        if (elapsed >= duration) {
          clearInterval(timerRef.current!);
          // Do NOT auto-transition — user must click "I am ready"
        }
      }, 30);
    }, 50);
  }, [activeColors.length]);

  const buildShareMetrics = () => {
    const data = getTodayData();
    const roundsForStyles = data?.rounds ?? savedRounds;
    const visualStyles = 'Mixed';
    // Derive metrics from persisted rounds so the share text is correct
    // even after a reload / when viewing /summary in a fresh session.
    let roundsPlayed = 0;
    let totalCorrect = 0;
    let tilesDecoded = 0;
    let peak: { tiles: number; seconds: number } | null = null;
    const persistedTimes: number[] = [];
    for (const round of roundsForStyles) {
      for (const attempt of round.attempts) {
        roundsPlayed += 1;
        if (!attempt.isCorrect) continue;
        totalCorrect += 1;
        const sol = attempt.solution ?? round.solution ?? [];
        let matched = 0;
        let tiles = 0;
        for (let i = 0; i < GRID_SIZE; i++) {
          const s = sol[i];
          if (s !== null && s !== undefined) tiles += 1;
          const p = attempt.grid?.[i];
          if (s && p && s.toLowerCase() === p.toLowerCase()) matched += 1;
        }
        tilesDecoded += matched;
        const secs = typeof attempt.recallMs === 'number' ? attempt.recallMs / 1000 : 0;
        if (typeof attempt.recallMs === 'number') persistedTimes.push(secs);
        if (
          !peak ||
          tiles > peak.tiles ||
          (tiles === peak.tiles && secs > 0 && (peak.seconds === 0 || secs < peak.seconds))
        ) {
          peak = { tiles, seconds: secs };
        }
      }
    }
    // If persisted peak lacks recall time (legacy data), borrow seconds from
    // in-session dailyStats when tile counts match.
    if (peak && peak.seconds === 0 && dailyStats.peakComplexity && dailyStats.peakComplexity.tiles === peak.tiles) {
      peak = { tiles: peak.tiles, seconds: dailyStats.peakComplexity.seconds };
    }
    // Fall back to in-session stats if persisted derivation produced nothing
    // (e.g. very first attempt before save completes).
    if (roundsPlayed === 0 && dailyStats.roundsPlayed > 0) {
      roundsPlayed = dailyStats.roundsPlayed;
      totalCorrect = dailyStats.totalCorrect;
      tilesDecoded = dailyStats.tilesDecoded;
      peak = dailyStats.peakComplexity;
    }
    const timesSource = persistedTimes.length ? persistedTimes : dailyStats.correctTimes;
    const sorted = [...timesSource].sort((a, b) => a - b).slice(0, 3);
    const reflexAvg = sorted.length ? sorted.reduce((s, n) => s + n, 0) / sorted.length : null;
    const consistency = roundsPlayed
      ? Math.round((totalCorrect / roundsPlayed) * 100)
      : 0;
    return {
      consistency,
      reflexAvg,
      peak,
      tilesDecoded,
      visualStyles,
    };
  };

  const share = async () => {
    const data = getTodayData();
    const rounds = data?.rounds ?? savedRounds;
    const text = generateShareText(rounds, starsEarned, totalFocusSeconds, buildShareMetrics());
    console.log('[Chromatic] Share text preview:\n' + text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const shareWhatsApp = () => {
    const data = getTodayData();
    const rounds = data?.rounds ?? savedRounds;
    const text = generateShareText(rounds, starsEarned, totalFocusSeconds, buildShareMetrics());
    console.log('[Chromatic] WhatsApp share text preview:\n' + text);
    const encoded = encodeURIComponent(text);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const solvedRounds = savedRounds.filter((r) => r.solved).length;

  const statusText = isFreeplay
    ? phase === 'observation'
      ? 'Ready to match these? Tap when you are'
      : phase === 'recall'
        ? 'Recreate from memory'
        : phase === 'result'
          ? isCorrect ? 'Nice one!' : 'Not quite...'
          : 'Ready to play'
    : phase === 'idle' && !alreadyFinished
      ? 'Ready to play'
      : alreadyFinished
        ? `Game complete · Solved ${solvedRounds}/${savedRounds.length} . See you tomorrow!`
        : phase === 'observation'
          ? 'Ready to match these? Tap when you are'
          : phase === 'recall'
            ? 'Recreate from memory'
            : '';

  // Show daily summary only in daily mode when finished
  const showDailySummary = !isFreeplay && alreadyFinished && (phase === 'idle' || phase === 'result');

  useEffect(() => {
   if (showDailySummary && posthog.__loaded) {
      posthog.capture('game_completed', {
        day: dayName,
        difficulty: difficultyName,
        result: solvedRounds > 0 ? 'won' : 'lost',
        stars_earned: starsEarned,
      });
      hasStartedPlaying.current = false;
    }
    if (showDailySummary) {
      trackVirtualPageview('/summary', 'Chromatic Daily — Summary');
    }
  }, [showDailySummary]);

  useEffect(() => {
    const handleVisibilityChange = (e: Event) => {
      const isLeaving = e.type === 'pagehide' || document.visibilityState === 'hidden';
      if (
        isLeaving &&
        hasStartedPlaying.current &&
        !alreadyFinished &&
        posthog.__loaded
      ) {
        posthog.capture('game_abandoned', {
          current_round: roundIndex + 1,
          attempts_remaining: MAX_ROUNDS - totalAttemptsUsed,
        }, { transport: 'sendBeacon' });
        hasStartedPlaying.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('pagehide', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [alreadyFinished, roundIndex, totalAttemptsUsed]);

  // --- Session Report handlers (Practice Mode) ---
  const openSessionReport = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);

    const consistency = sessionStats.roundsPlayed
      ? Math.round((sessionStats.totalCorrect / sessionStats.roundsPlayed) * 100)
      : 0;
    const sortedTimes = [...sessionStats.correctTimes].sort((a, b) => a - b).slice(0, 3);
    const reflexAvg = sortedTimes.length
      ? sortedTimes.reduce((s, n) => s + n, 0) / sortedTimes.length
      : 0;

    if (posthog.__loaded) {
      posthog.capture('practice_results_viewed', {
        rounds_played: sessionStats.roundsPlayed,
        reflex_avg_seconds: reflexAvg,
        consistency,
        tiles_decoded: sessionStats.tilesDecoded,
        peak_complexity_tiles: sessionStats.peakComplexity?.tiles ?? 0,
        peak_complexity_seconds: sessionStats.peakComplexity?.seconds ?? 0,
        longest_streak: sessionStats.longestStreak,
      });
    }

    setShowSessionReport(true);
    trackVirtualPageview('/practice/results', 'Chromatic Daily — Practice Results');
  }, [sessionStats]);

  const resumePractice = useCallback(() => {
    setShowSessionReport(false);
    if (phase === 'observation') {
      // Restart observation timer for current puzzle
      const duration = getObservationDuration(activeColors.length);
      setTimerDuration(duration);
      setTimerProgress(100);
      observationStartTime.current = Date.now();
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setTimerProgress(remaining);
        if (elapsed >= duration) clearInterval(timerRef.current!);
      }, 30);
    }
  }, [phase, activeColors.length]);

  const shareSession = useCallback(() => {
    if (posthog.__loaded) {
      const sortedTimes = [...sessionStats.correctTimes].sort((a, b) => a - b).slice(0, 3);
      const reflexAvg = sortedTimes.length
        ? sortedTimes.reduce((s, n) => s + n, 0) / sortedTimes.length
        : 0;
      posthog.capture('practice_card_shared', {
        rounds_played: sessionStats.roundsPlayed,
        reflex_avg_seconds: reflexAvg,
        tiles_decoded: sessionStats.tilesDecoded,
        longest_streak: sessionStats.longestStreak,
      });
    }
  }, [sessionStats]);

  const restartSession = useCallback(() => {
    trackEngagement('practice_restart_clicked');
    setSessionStats(initialStats);
    pendingMilestone.current = false;
    setShowSessionReport(false);
    startFreePlay();
  }, [startFreePlay]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-4 sm:py-8 transition-colors duration-500 ${
        isFreeplay ? 'bg-[hsl(260,30%,97%)]' : 'bg-background'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Onboarding overlay (first-time only) */}
      <OnboardingOverlay show={showOnboarding} onDismiss={dismissOnboarding} />

      {/* Practice Mode: Results button (top-right) */}
      {isFreeplay && sessionStats.roundsPlayed >= 1 && !showSessionReport && (
        <button
          onClick={openSessionReport}
          className="fixed top-4 right-4 z-40 inline-flex items-center gap-1.5 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-sm transition-colors bg-primary text-destructive-foreground text-base"
          aria-label="View session results"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Results
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        {isFreeplay ? (
          <>
            <h1
              className={`text-3xl sm:text-4xl tracking-tight mb-1 text-foreground ${phase === 'recall' || phase === 'result' ? 'hidden sm:block' : ''}`}
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
            >
              Practice Mode
            </h1>
            <button
              onClick={backToDaily}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Daily Challenge
            </button>
          </>
        ) : (
          <>
            <h1
              className={`text-3xl sm:text-4xl tracking-tight mb-1 text-foreground ${!showDailySummary && (phase === 'recall' || phase === 'result') ? 'hidden sm:block' : ''}`}
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
            >
              {showDailySummary ? 'Daily Summary' : 'Chromatic Daily'}
            </h1>
            <p className={`text-sm text-muted-foreground tracking-wide uppercase ${showDailySummary ? 'hidden sm:block' : ''}`}>
              {dayName} · #{dayNum} · {daySalutation}
            </p>
          </>
        )}
      </div>

      {/* Status Bar */}
      {!showDailySummary && (
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between bg-card rounded-xl border border-border px-4 py-2.5 shadow-sm">
          {isFreeplay ? (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Practice Mode
                </span>
              </div>
              {freeplayRoundNum > 0 && (
                <span className="text-xs text-muted-foreground">
                  Round {Math.max(1, sessionStats.roundsPlayed + (phase === 'observation' || phase === 'recall' ? 1 : 0))}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Stage {stageNum} of {MAX_ROUNDS}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_ROUNDS }).map((_, i) => {
                  const round = savedRounds.find((r) => r.roundIndex === i);
                  let bgColor = 'bg-muted';
                  if (round?.solved) bgColor = 'bg-emerald-400';
                  else if (round && !round.solved && round.attempts.length > 0 && (alreadyFinished || i < roundIndex))
                    bgColor = 'bg-destructive';
                  else if (i === roundIndex && phase !== 'idle') bgColor = 'bg-primary animate-pulse';
                  return <div key={i} className={`w-2.5 h-2.5 rounded-full ${bgColor} transition-colors`} />;
                })}
              </div>
              <span className="text-xs text-muted-foreground">
                {effectiveColorCount} tiles
              </span>
            </>
          )}
        </div>
        {statusText && (
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        )}
      </div>
      )}

      {/* Daily Summary (replaces game when finished, daily only) */}
      {showDailySummary ? (
        <DailySummary
          rounds={savedRounds}
          totalAttempts={totalAttemptsUsed}
          maxRounds={MAX_ROUNDS}
          onShare={share}
          onShareWhatsApp={shareWhatsApp}
          copied={copied}
          onStartFreePlay={startFreePlay}
          dayName={dayName}
          colorCount={baseColorCount}
          starsEarned={starsEarned}
          totalFocusSeconds={totalFocusSeconds}
          stats={dailyStats}
        />
      ) : (
        <>
          {/* Main Card */}
          <div
            className={cn(
              'w-full max-w-sm bg-card rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden transition-transform',
              shake && 'animate-shake',
              stagedCheck && 'animate-board-pulse',
            )}
          >

            {/* Grid with animated transitions */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={verifying ? 'verifying' : phase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8"
                >
                  <GameGrid
                    phase={phase}
                    solution={solution}
                    playerGrid={playerGrid}
                    result={result}
                    selectedColor={selectedColor}
                    verifying={verifying}
                    activeSlot={activeSlot}
                    tileFx={tileFx}
                    flipping={flipping}
                    onCircleClick={handleCircleClick}
                  />
                </motion.div>
              </AnimatePresence>


              {/* Countdown overlay (works for both daily new users and freeplay) */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 backdrop-blur-sm rounded-xl"
                  >
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="text-8xl font-bold text-muted-foreground select-none"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      {countdown}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Star Pop animation */}
              <AnimatePresence>
                {showStarPop && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-6xl">⭐️</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color Picker */}
            {phase === 'recall' && (
              <div className="px-6 pb-4 border-t border-border pt-4">
                <motion.p
                  key={selectedCount}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center"
                >
                  {selectedCount}/{effectiveColorCount} colors placed
                </motion.p>
                <div className="flex justify-center gap-2 flex-wrap max-w-[320px] mx-auto">
                  {pickerColors.map((c) => {
                    const upHex = c.hex.toUpperCase();
                    const isWhite = upHex === '#FFFFFF';
                    const isBlack = upHex === '#000000';
                    const bg = c.hex;
                    const showAsWhite = isWhite;
                    return (
                    <motion.button
                      key={c.hex}
                      onClick={() => {
                        if (activeSlot !== null) {
                          const newGrid = [...playerGrid];
                          const isOverwrite = newGrid[activeSlot] !== null;
                          const currentCount = newGrid.filter((cl) => cl !== null).length;
                          if (isOverwrite || currentCount < effectiveColorCount) {
                            newGrid[activeSlot] = c.hex;
                            setPlayerGrid(newGrid);
                            playTileFx([activeSlot], 'fill', 320);
                            setSwatchPop(c.hex);
                            fxTimers.current.push(setTimeout(() => setSwatchPop(null), 260));
                            trackEngagement('color_placed', { mode });
                          }
                          setActiveSlot(null);
                          setSelectedColor(null);
                        } else {
                          setSelectedColor(c.hex);
                          trackEngagement('color_selected', { mode });
                        }
                      }}
                      whileTap={{ scale: 0.92 }}
                      animate={
                        swatchPop === c.hex
                          ? { scale: [1, 1.25, 1] }
                          : { scale: selectedColor === c.hex ? 1.05 : 1 }
                      }
                      transition={
                        swatchPop === c.hex
                          ? { duration: 0.24, ease: 'easeOut' }
                          : { type: 'spring', stiffness: 500, damping: 18 }
                      }
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-200 relative overflow-hidden",
                        "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                        !showAsWhite && !isBlack && "border border-muted-foreground/50"
                      )}
                      style={{
                        backgroundColor: bg,
                        border: showAsWhite ? '2px solid #D1D5DB' : undefined,
                        boxShadow: selectedColor === c.hex
                          ? `0 0 0 3px hsl(var(--card)), 0 0 0 5px ${showAsWhite ? 'rgba(15,23,42,0.55)' : c.hex}, 0 0 14px 4px ${showAsWhite ? 'rgba(15,23,42,0.28)' : `${c.hex}80`}`
                          : undefined,
                      }}
                      title={c.name}
                    >
                      <MixedTile colorHex={c.hex} shapeScale={0.5} />
                    </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 justify-center">
              {/* Daily idle start */}
              {phase === 'idle' && !isFreeplay && !alreadyFinished && countdown === null && (
                <Button
                  onClick={startGame}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-sm tracking-wide"
                >
                  Start
                </Button>
              )}
              {/* Freeplay idle start */}
              {phase === 'idle' && isFreeplay && countdown === null && (
                <Button
                  onClick={startFreePlay}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-sm tracking-wide"
                >
                  Start
                </Button>
              )}
              {/* "I am ready" button during observation */}
              {phase === 'observation' && (
                <Button
                  onClick={handleReady}
                  className="w-full rounded-xl h-12 text-sm tracking-wide text-white bg-black hover:bg-black/90"
                >
                  I'm ready
                </Button>
              )}
              {phase === 'recall' && (
                <>
                  <Button onClick={clearGrid} variant="outline" className="rounded-xl flex-1 gap-2">
                    <RotateCcw className="w-4 h-4" /> Clear
                  </Button>
                  <Button
                    onClick={verify}
                    disabled={!canVerify}
                    className="rounded-xl flex-1 gap-2 text-white bg-black hover:bg-black/90"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify
                  </Button>
                </>
              )}
              {/* Daily result: view result button */}
              {phase === 'result' && !isFreeplay && !showResult && !alreadyFinished && (
                <Button
                  onClick={() => setShowResult(true)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                >
                  View Result
                </Button>
              )}
            </div>
          </div>
        </>
      )}



      {/* Info & Reset buttons */}
      <div className="mt-6 flex items-center gap-4">
        <button onClick={() => setShowHowTo(true)} className="text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-5 h-5" />
        </button>
        {!isFreeplay && (
          <button
            onClick={() => {
              localStorage.removeItem('chromatic_daily');
              window.location.href = window.location.pathname + '?reset';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Reset game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* SEO: semantic content rendered in initial DOM for crawlers; visually hidden from users */}
      <section className="sr-only" aria-hidden="true">
        <h1>Chromatic Daily | Daily Color Memory & Brain Game</h1>
        <h2>How it Works: Stimulating Neuroplasticity Through Color</h2>
        <p>
          Chromatic Daily is a minimalist browser game built to train visual recall and
          neuroplasticity. Every 24 hours, test your focus against a new 3-stage progressive
          color grid. No app downloads required.
        </p>
        <h3>Cognitive Benefits of Daily Memory Games</h3>
        <p>
          Regular practice with brain games and memory games has been linked to stronger working
          memory, sharper visual attention, and improved processing speed. Chromatic Daily focuses
          specifically on color memory: a low-friction, high-signal way to engage neuroplasticity
          every day. Three stages, a clean interface, and no pressure — just a daily color puzzle
          designed to keep cognition active.
        </p>
      </section>

      {/* How to Play Modal */}
      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>How to Play</DialogTitle>
            <DialogDescription className="sr-only">Instructions for Hue Day</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center mt-0.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Analyze the Colors</p>
                  <p className="text-xs text-muted-foreground">Take your time studying the color shades shown to you.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Start the Challenge</p>
                  <p className="text-xs text-muted-foreground">Tap the 'I'm Ready' button once you've memorized the colors. The target colors will disappear once pressed.</p>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-semibold text-foreground mb-2 text-base">Performance Metrics</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground mb-1">⭐️ Speed Star (Reflexes)</p>
                  <p>Awarded for "Snapshot" memory. If you memorize the pattern and hit 'Ready' in record time, you earn a star. It proves you can capture a complex visual field in a single blink.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">🎯 Consistency</p>
                  <p>Your reliability under pressure. The percentage of rounds successfully completed. Aim for 100% to reach the Mastered State.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">⚡ Reflex Average</p>
                  <p>Your true "Flow State" speed. This calculates the average of your 3 fastest correct rounds to measure your sustainable pace.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">👑 Peak Complexity</p>
                  <p>Your mental "heavy lifting." Tracks the highest number of tiles decoded in a stage — peaks at 6 on Stage 3's full 2x3 grid.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">🧩 Decoded Tiles</p>
                  <p>Your total mental volume. A cumulative count of every correct tile placed, tracking your sustained endurance and "Brain Mileage."</p>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-semibold text-foreground mb-2 text-base">The Journey</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground mb-1">3-Stage Daily</p>
                  <p>Each day runs a 3-stage progression: Stage 1 (3 elements) → Stage 2 (5 elements) → Stage 3 (6 elements).&nbsp;</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
</p>
                  <p>
</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Practice Mode</p>
                  <p>
                    Unlocked any time. Same 2x3 grid, unlimited rounds — sharpen your eye and master the mix.
                  </p>
                </div>
                <div className="pt-2" />
              </div>
            </div>
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={showResult} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center sm:text-center items-center">
            <DialogTitle
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
              className="text-2xl text-center"
            >
              {isFreeplay
                ? isCorrect ? 'Nice One!' : 'Not Quite'
                : isCorrect ? 'Perfect Recall' : canContinue ? 'Not Quite' : 'Game Over'
              }
            </DialogTitle>
            <DialogDescription className="sr-only">Your game result</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCorrect && (
              <div className="flex flex-col items-center mb-4">
                {isSpeedRound && <span className="text-2xl mb-1">⭐️</span>}
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
            )}

            {!isCorrect && result && (
              <div className="mb-4 px-4 max-w-[240px] mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Neural Match
                  </span>
                  <span className="text-[10px] font-semibold text-foreground">
                    {Math.round((result.filter(Boolean).length / GRID_SIZE) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round((result.filter(Boolean).length / GRID_SIZE) * 100)} className="h-1.5" />
              </div>
            )}

            {resultMessage && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-line px-2">{resultMessage}</p>
            )}

            <div className="font-mono text-lg leading-relaxed mb-4">
              {[0, 2, 4].map((row) => (
                <div key={row}>
                  {solution
                    .slice(row, row + 2)
                    .map((c, i) => {
                      if (c === null) return '⚪';
                      return playerGrid[row + i] === c ? '🟢' : '⚫';
                    })
                    .join('')}
                </div>
              ))}
            </div>

            {!isCorrect && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Correct Pattern</p>
                <div className="grid grid-cols-2 gap-2 max-w-[90px] mx-auto">
                  {solution.map((c, i) => {
                    const up = c?.toUpperCase();
                    const isWhite = up === '#FFFFFF';
                    const bg: string = c || NEUTRAL;
                    const lightBorder = isWhite;
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-full relative overflow-hidden"
                        style={{
                          backgroundColor: bg,
                          width: '100%',
                          border: lightBorder ? '2px solid rgb(209, 213, 219)' : undefined,
                        }}
                      >
                        <MixedTile colorHex={c} shapeScale={0.5} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {isFreeplay ? (
                <>
                  {isCorrect ? (
                    <Button onClick={freeplayNext} className={cn('rounded-xl gap-2 text-white bg-black hover:bg-black/90')}>
                      <Sparkles className="w-4 h-4" /> Next Level
                    </Button>
                  ) : (
                    <Button onClick={freeplayRetry} className={cn('rounded-xl gap-2 text-white bg-black hover:bg-black/90')}>
                      <RotateCcw className="w-4 h-4" /> Try Again
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canContinue && (
                    <Button onClick={nextAttempt} className={cn('rounded-xl gap-2 text-white bg-black hover:bg-black/90')}>
                      <RotateCcw className="w-4 h-4" /> {isCorrect ? 'Next Round' : 'Try Again'}
                    </Button>
                  )}
                  {!canContinue && alreadyFinished && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Nice try! See you tomorrow for a new challenge.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Practice Mode Session Report Overlay */}
      <AnimatePresence>
        {showSessionReport && isFreeplay && (
          <SessionReport
            stats={sessionStats}
            onResume={resumePractice}
            onShare={shareSession}
            onRestart={restartSession}
            onMainMenu={backToDaily}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>

      {/* Disclaimer: clarifies independence from unrelated iOS app */}
      <footer className="mt-8 px-6 pb-4 max-w-md mx-auto text-center">
        <p className="text-[10px] leading-relaxed text-muted-foreground/60">
          Chromatic Daily is an independent, browser-based color memory puzzle. We are a standalone web application and are not affiliated with, associated with, or related to the 'Chromatic: The Color Game' iOS mobile application or its RGB slider mechanics.
        </p>
      </footer>
    </div>
  );
};

// Wrap in ErrorBoundary
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
const IndexWithErrorBoundary = () => (
  <GameErrorBoundary>
    <Index />
  </GameErrorBoundary>
);

export default IndexWithErrorBoundary;
