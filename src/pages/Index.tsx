import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Share2, Trophy, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { DailySummary } from '@/components/DailySummary';
import { OnboardingOverlay, useOnboarding } from '@/components/OnboardingOverlay';
import { GameGrid } from '@/components/GameGrid';
import { CircularTimer } from '@/components/CircularTimer';
import { AccessibilityToggle } from '@/components/AccessibilityToggle';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PatternOverlay } from '@/components/PatternOverlay';
import {
  GamePhase, NEUTRAL, COLORS, generateSolution, generateSolutionDDA, getDayInfo, getDayNumber,
  hasFinishedToday, getStreaks, generateShareText, getCurrentRoundInfo,
  saveRoundAttempt, getResultMessage, MAX_ROUNDS, getTodayData, RoundData, DDALevel,
  getDayDifficultyTier
} from '@/lib/game';
import { generateFreePlayPuzzle } from '@/lib/freeplay';
import { posthog } from '@/lib/posthog';
import { toast } from 'sonner';

/** Dynamic timer durations in ms based on color count */
function getObservationDuration(colorCount: number, isA11y: boolean): number {
  let base: number;
  if (colorCount <= 2) base = 5000;
  else if (colorCount <= 3) base = 6000;
  else if (colorCount <= 4) base = 8000;
  else if (colorCount <= 6) base = 10000;
  else base = 15000;
  return isA11y ? base * 2 : base;
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
  const [solution, setSolution] = useState<(string | null)[]>(Array(9).fill(null));
  const [activeColors, setActiveColors] = useState<{ name: string; hex: string }[]>([]);
  const [playerGrid, setPlayerGrid] = useState<(string | null)[]>(Array(9).fill(null));
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
  const [resultMessage, setResultMessage] = useState('');
  const [savedRounds, setSavedRounds] = useState<RoundData[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [cheatDetected, setCheatDetected] = useState(false);
  const [cheatMessage, setCheatMessage] = useState('');
  const [ddaLevel, setDdaLevel] = useState<DDALevel>('standard');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speed Star state
  const [isSpeedRound, setIsSpeedRound] = useState(false);
  const [showStarPop, setShowStarPop] = useState(false);
  const observationStartTime = useRef<number>(0);

  // Free Play state
  const [mode, setMode] = useState<GameMode>('daily');
  const [freeplayRoundNum, setFreeplayRoundNum] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();
  const { enabled: a11y } = useAccessibility();

  const { dayName, colorCount: baseColorCount } = getDayInfo();
  const effectiveColorCount = activeColors.length || baseColorCount;
  const dayNum = getDayNumber();
  const [streaks, setStreaks] = useState(getStreaks());

  const getDifficultyName = (count: number): string => {
    if (count <= 2) return 'Minimalist';
    if (count <= 4) return 'Standard';
    if (count <= 6) return 'Complex';
    return 'Master';
  };
  const difficultyName = getDifficultyName(baseColorCount);

  const isFreeplay = mode === 'freeplay';

  useEffect(() => {
    if (window.location.search.includes('reset')) {
      localStorage.removeItem('chromatic_daily');
      window.history.replaceState({}, '', window.location.pathname);
      setPhase('idle');
      setAlreadyFinished(false);
      setTotalAttemptsUsed(0);
      setSavedRounds([]);
      setRoundIndex(0);
      setAttemptInRound(1);
      const { solution: sol, activeColors: ac } = generateSolution(0);
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
        setPlayerGrid(lastAttempt?.grid ?? Array(9).fill(null));
        setResult(lastRound.solution.map((c, i) => (lastAttempt?.grid[i] ?? null) === c));
        setIsCorrect(lastRound.solved);
        setRoundIndex(lastRound.roundIndex);
        setPhase('result');
      }
    } else {
      setRoundIndex(info.roundIndex);
      const currentRoundData = info.rounds.find((r) => r.roundIndex === info.roundIndex);
      setAttemptInRound((currentRoundData?.attempts.length ?? 0) + 1);
      const { solution: sol, activeColors: ac } = generateSolution(info.roundIndex);
      setSolution(sol);
      setActiveColors(ac);
    }
  }, []);

  const CHEAT_MESSAGES = [
    'Nice try, Sherlock! 🕵️‍♂️ No screenshots allowed.',
    'Your memory is better than your camera roll. Trust it! 🧠',
    'Caught in 4K! 📸 Eyes on the screen, not the buttons.',
    'Cheaters never prosper (and they miss the best colors). 🌈',
  ];

  const triggerCheatOverlay = useCallback(() => {
    setCheatDetected(true);
    setCheatMessage(CHEAT_MESSAGES[Math.floor(Math.random() * CHEAT_MESSAGES.length)]);
  }, []);

  useEffect(() => {
    if (phase !== 'observation') {
      setCheatDetected(false);
      return;
    }

    const isMobile = window.innerWidth < 768;

    const onVisibilityChange = () => {
      if (document.hidden) triggerCheatOverlay();
    };
    const onBlur = () => triggerCheatOverlay();

    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!isMobile) {
      window.addEventListener('blur', onBlur);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [phase, triggerCheatOverlay]);

  const startObservation = useCallback(() => {
    const duration = getObservationDuration(activeColors.length || baseColorCount, a11y);
    setTimerDuration(duration);
    setPhase('observation');
    setTimerProgress(100);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);
    setVerifying(false);
    setCheatDetected(false);
    setActiveSlot(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimerProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        setPhase('recall');
        setSelectedColor(null);
      }
    }, 30);
  }, [a11y, activeColors.length, baseColorCount]);

  const startGame = useCallback(() => {
    if (alreadyFinished && !isFreeplay) return;
    posthog.capture('Game Start', { round_number: roundIndex + 1, day_number: dayNum, difficulty: difficultyName, mode });
    startObservation();
  }, [alreadyFinished, isFreeplay, startObservation, roundIndex, dayNum, difficultyName, mode]);

  // --- Free Play callbacks ---
  /** Start a 3-2-1 countdown, then call `onComplete` */
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

  const startFreePlayObservation = useCallback((puzzle: { solution: (string | null)[]; activeColors: { name: string; hex: string }[]; colorCount: number }) => {
    const duration = getObservationDuration(puzzle.colorCount, a11y);
    setTimerDuration(duration);
    setPhase('observation');
    setTimerProgress(100);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimerProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        setPhase('recall');
        setSelectedColor(null);
      }
    }, 30);
  }, [a11y]);

  const startFreePlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const puzzle = generateFreePlayPuzzle();
    setMode('freeplay');
    setFreeplayRoundNum(1);
    setSolution(puzzle.solution);
    setActiveColors(puzzle.activeColors);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);
    setShowResult(false);
    setIsCorrect(false);
    setResultMessage('');
    setVerifying(false);
    setActiveSlot(null);
    setPhase('idle');
    posthog.capture('practice_mode_started', {
      difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
      color_count: puzzle.colorCount,
    });
    startCountdown(() => startFreePlayObservation(puzzle));
  }, [a11y, startCountdown, startFreePlayObservation]);

  const backToDaily = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
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
        setPlayerGrid(lastAttempt?.grid ?? Array(9).fill(null));
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
    const isFinal = phase === 'result' && (totalAttemptsUsed >= MAX_ROUNDS || alreadyFinished);
    if (showResult && isFinal) {
      const timer = setTimeout(() => {
        setShowResult(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showResult, phase, totalAttemptsUsed, alreadyFinished, isFreeplay]);

  const handleCircleClick = (index: number) => {
    if (phase !== 'recall') return;
    const newGrid = [...playerGrid];

    if (selectedColor) {
      // Tap same-color slot → clear it back to neutral
      if (newGrid[index] === selectedColor) {
        newGrid[index] = null;
        setPlayerGrid(newGrid);
        setActiveSlot(null);
        return;
      }
      // Color-then-Slot: place/overwrite immediately
      const isOverwrite = newGrid[index] !== null;
      const currentCount = newGrid.filter((c) => c !== null).length;
      if (!isOverwrite && currentCount >= effectiveColorCount) return;
      newGrid[index] = selectedColor;
      setPlayerGrid(newGrid);
      setActiveSlot(null);
      return;
    }

    // No color selected
    if (newGrid[index] !== null) {
      // Tap filled slot → clear it
      newGrid[index] = null;
      setPlayerGrid(newGrid);
      setActiveSlot(null);
    } else {
      // Tapping the already-active slot → deselect it
      setActiveSlot(activeSlot === index ? null : index);
    }
  };

  const clearGrid = () => {
    if (phase !== 'recall') return;
    setPlayerGrid(Array(9).fill(null));
    setSelectedColor(null);
    setActiveSlot(null);
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

    if (isFreeplay) {
      // Freeplay: no save, no DDA, no localStorage
      setTimeout(() => {
        setVerifying(false);
        setPhase('result');
        setResultMessage(correct ? 'Great memory! Ready for the next one?' : 'Not quite — give it another shot!');
        if (!correct) {
          setShake(true);
          setTimeout(() => setShake(false), 600);
          setTimeout(() => setShowResult(true), 800);
        } else {
          setFreeplayRoundNum((n) => n + 1);
          setShowResult(true);
        }
      }, 1500);
      return;
    }

    // Daily mode verification
    const newTotalUsed = totalAttemptsUsed + 1;
    const savedData = saveRoundAttempt(roundIndex, correct, playerGrid, solution);

    console.log('[Chromatic] Round verified:', {
      roundIndex,
      attemptInRound,
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

      posthog.capture('Round Verified', { round_number: roundIndex + 1, is_correct: correct });

      if (roundIndex === 0 && correct && attemptInRound === 1) {
        setDdaLevel('hard');
        const tier = getDayDifficultyTier(baseColorCount);
        if (tier !== 'hard') {
          toast('Level Up! Round 2 is getting harder... 🔥', { duration: 3000 });
        }
      }

      if (!correct && ddaLevel === 'hard') {
        setDdaLevel('standard');
      }

      const msg = getResultMessage(roundIndex, attemptInRound, correct, newTotalUsed);
      setResultMessage(msg);

      const done = newTotalUsed >= MAX_ROUNDS || (correct && roundIndex >= MAX_ROUNDS - 1);
      if (done || savedData.finished) {
        setAlreadyFinished(true);
      }

      if (!correct) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setTimeout(() => setShowResult(true), 800);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const canContinue = phase === 'result' && totalAttemptsUsed < MAX_ROUNDS && !alreadyFinished;

  const nextAttempt = () => {
    setShowResult(false);

    if (isCorrect) {
      const newRound = roundIndex + 1;
      setRoundIndex(newRound);
      setAttemptInRound(1);
      const { solution: sol, activeColors: ac } = generateSolutionDDA(newRound, ddaLevel);
      setSolution(sol);
      setActiveColors(ac);
    } else {
      setAttemptInRound((prev) => prev + 1);
      const { solution: sol, activeColors: ac } = generateSolutionDDA(roundIndex, ddaLevel);
      setSolution(sol);
      setActiveColors(ac);
    }

    startObservation();
  };

  // Freeplay: next level or retry
  const freeplayNext = useCallback(() => {
    setShowResult(false);
    const puzzle = generateFreePlayPuzzle();
    setFreeplayRoundNum(prev => prev + 1);
    posthog.capture('practice_mode_next_level', {
      difficulty: puzzle.colorCount <= 3 ? 'easy' : puzzle.colorCount <= 5 ? 'medium' : 'hard',
      color_count: puzzle.colorCount,
      round_number: freeplayRoundNum + 1,
    });
    setSolution(puzzle.solution);
    setActiveColors(puzzle.activeColors);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);
    setActiveSlot(null);
    setPhase('idle');
    setTimeout(() => startFreePlayObservation(puzzle), 50);
  }, [startFreePlayObservation, freeplayRoundNum]);

  const freeplayRetry = useCallback(() => {
    setShowResult(false);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);
    setActiveSlot(null);
    setPhase('idle');
    const currentColorCount = activeColors.length;
    setTimeout(() => {
      const duration = getObservationDuration(currentColorCount, a11y);
      setTimerDuration(duration);
      setPhase('observation');
      setTimerProgress(100);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setTimerProgress(remaining);
        if (elapsed >= duration) {
          clearInterval(timerRef.current!);
          setPhase('recall');
          setSelectedColor(null);
        }
      }, 30);
    }, 50);
  }, [a11y, activeColors.length]);

  const share = async () => {
    const data = getTodayData();
    const rounds = data?.rounds ?? savedRounds;
    const text = generateShareText(rounds);
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
    const text = generateShareText(rounds);
    console.log('[Chromatic] WhatsApp share text preview:\n' + text);
    const encoded = encodeURIComponent(text);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const solvedRounds = savedRounds.filter((r) => r.solved).length;

  const statusText = isFreeplay
    ? phase === 'observation'
      ? 'Memorize the pattern...'
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
          ? 'Memorize the pattern...'
          : phase === 'recall'
            ? 'Recreate from memory'
            : '';

  // Show daily summary only in daily mode when finished
  const showDailySummary = !isFreeplay && alreadyFinished && (phase === 'idle' || phase === 'result');

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-4 sm:py-8 transition-colors duration-500 ${
        isFreeplay ? 'bg-[hsl(260,30%,97%)]' : 'bg-background'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Onboarding overlay (first-time only) */}
      <OnboardingOverlay show={showOnboarding} onDismiss={dismissOnboarding} />

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
              className={`text-3xl sm:text-4xl tracking-tight mb-1 text-foreground ${phase === 'recall' || phase === 'result' ? 'hidden sm:block' : ''}`}
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
            >
              Chromatic Daily
            </h1>
            <p className="text-sm text-muted-foreground tracking-wide uppercase">
              {dayName} · #{dayNum} · Level: {difficultyName}
            </p>
          </>
        )}
      </div>

      {/* Status Bar */}
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
                  Round {freeplayRoundNum}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Round {Math.min(roundIndex + 1, MAX_ROUNDS)} of {MAX_ROUNDS}
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
                {totalAttemptsUsed}/{MAX_ROUNDS} used
              </span>
            </>
          )}
        </div>
        {statusText && (
          <div className="flex items-center justify-center gap-2 mt-1.5">
            {phase === 'observation' && (
              <CircularTimer
                progress={timerProgress}
                totalSeconds={Math.round(timerDuration / 1000)}
                size={28}
              />
            )}
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        )}
      </div>

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
        />
      ) : (
        <>
          {/* Main Card */}
          <div
            className={`w-full max-w-sm bg-card rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}
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
                    onCircleClick={handleCircleClick}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Anti-cheat overlay */}
              <AnimatePresence>
                {cheatDetected && phase === 'observation' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95 backdrop-blur-md rounded-xl"
                  >
                    <p className="text-3xl mb-3">🚫</p>
                    <p className="text-sm font-semibold text-foreground text-center px-6 leading-relaxed">
                      {cheatMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Countdown overlay for Practice Mode */}
              <AnimatePresence>
                {countdown !== null && isFreeplay && (
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
                <div className="flex justify-center gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        if (activeSlot !== null) {
                          const newGrid = [...playerGrid];
                          const isOverwrite = newGrid[activeSlot] !== null;
                          const currentCount = newGrid.filter((cl) => cl !== null).length;
                          if (isOverwrite || currentCount < effectiveColorCount) {
                            newGrid[activeSlot] = c.hex;
                            setPlayerGrid(newGrid);
                          }
                          setActiveSlot(null);
                          setSelectedColor(null);
                        } else {
                          setSelectedColor(c.hex);
                        }
                      }}
                      className="w-9 h-9 rounded-full transition-all duration-200 relative overflow-hidden"
                      style={{
                        backgroundColor: c.hex,
                        outline: selectedColor === c.hex ? '3px solid hsl(var(--primary))' : '2px solid transparent',
                        outlineOffset: '2px',
                        transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                      }}
                      title={c.name}
                    >
                      {a11y && <PatternOverlay colorHex={c.hex} size="100%" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 justify-center">
              {/* Daily idle start */}
              {phase === 'idle' && !isFreeplay && !alreadyFinished && (
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
              {phase === 'recall' && (
                <>
                  <Button onClick={clearGrid} variant="outline" className="rounded-xl flex-1 gap-2">
                    <RotateCcw className="w-4 h-4" /> Clear
                  </Button>
                  <Button
                    onClick={verify}
                    disabled={!canVerify}
                    className="rounded-xl flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
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

      {/* Accessibility Toggle (below card, above streaks) */}
      {!showDailySummary && (
        <div className="mt-5 flex justify-center">
          <AccessibilityToggle />
        </div>
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

      {/* How to Play Modal */}
      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>How to Play</DialogTitle>
            <DialogDescription className="sr-only">Instructions for Hue Day</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>A new color memory puzzle every day.</p>
            <div className="space-y-2">
              <p>
                <strong className="text-foreground">1.</strong> Press <strong className="text-foreground">Start</strong> — a pattern of colored circles
                appears for a few seconds (duration scales with difficulty).
              </p>
              <p>
                <strong className="text-foreground">2.</strong> Memorize the colors and positions.
              </p>
              <p>
                <strong className="text-foreground">3.</strong> Recreate the pattern from memory using the color picker.
              </p>
              <p>
                <strong className="text-foreground">4.</strong> Hit <strong className="text-foreground">Verify</strong> to check your answer.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-medium text-foreground mb-1">The 3-Round Rule</p>
              <p>
                You have a total of <strong className="text-foreground">{MAX_ROUNDS} attempts</strong> to play each day.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong className="text-foreground">Success:</strong> If you solve a puzzle, the remaining attempts carry over to a brand-new color
                  configuration.
                </li>
                <li>
                  <strong className="text-foreground">Persistence:</strong> If you miss, you can use your next attempt to try the same puzzle again.
                </li>
              </ul>
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-medium text-foreground mb-1">Daily Difficulty</p>
              <p>Monday starts with 2 colors (Minimalist). Each day adds more, reaching all 9 (Master) by Sunday.</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-muted-foreground text-xs">Come back tomorrow for a new puzzle!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={showResult} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
              className="text-2xl"
            >
              {isFreeplay
                ? isCorrect ? 'Nice One!' : 'Not Quite'
                : isCorrect ? 'Perfect Recall' : canContinue ? 'Not Quite' : 'Game Over'
              }
            </DialogTitle>
            <DialogDescription className="sr-only">Your game result</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCorrect ? (
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            )}

            {resultMessage && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-line px-2">{resultMessage}</p>
            )}

            <div className="font-mono text-lg leading-relaxed mb-4">
              {[0, 3, 6].map((row) => (
                <div key={row}>
                  {solution
                    .slice(row, row + 3)
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
                <div className="grid grid-cols-3 gap-2 max-w-[120px] mx-auto">
                  {solution.map((c, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-full relative overflow-hidden"
                      style={{ backgroundColor: c || NEUTRAL, width: '100%' }}
                    >
                      {a11y && <PatternOverlay colorHex={c} size="100%" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {isFreeplay ? (
                <>
                  {isCorrect ? (
                    <Button onClick={freeplayNext} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Sparkles className="w-4 h-4" /> Next Level
                    </Button>
                  ) : (
                    <Button onClick={freeplayRetry} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <RotateCcw className="w-4 h-4" /> Try Again
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canContinue && (
                    <Button onClick={nextAttempt} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
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

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

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
