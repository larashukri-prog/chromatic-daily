import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Share2, Trophy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import {
  GamePhase, NEUTRAL, COLORS, generateDailySolutions, getDayInfo, getDayNumber,
  isGameOver, saveAttempt, loadData, getStreaks, generateShareText,
  getAttemptsUsed, getPuzzlesSolved, getCurrentPuzzleIndex, MAX_ATTEMPTS,
} from '@/lib/game';

const OBSERVATION_TIME = 5000;

const AttemptTracker = ({ used, total }: { used: number; total: number }) => (
  <div className="flex items-center gap-2 justify-center mb-1">
    <span className="text-xs text-gray-400 uppercase tracking-widest mr-1">Attempts</span>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`w-2.5 h-2.5 rounded-full transition-colors ${
          i < used ? 'bg-gray-800' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
);

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [solutions, setSolutions] = useState<(string | null)[][]>([]);
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState(0);
  const [playerGrid, setPlayerGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
  const [result, setResult] = useState<boolean[] | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { dayName, colorCount } = getDayInfo();
  const dayNum = getDayNumber();
  const streaks = getStreaks();

  const currentSolution = solutions[currentPuzzleIdx] ?? Array(9).fill(null);

  useEffect(() => {
    const dailySolutions = generateDailySolutions();
    setSolutions(dailySolutions);

    const used = getAttemptsUsed();
    const solved = getPuzzlesSolved();
    const puzzleIdx = getCurrentPuzzleIndex();
    setAttemptsUsed(used);
    setPuzzlesSolved(solved);
    setCurrentPuzzleIdx(puzzleIdx);

    if (isGameOver()) {
      setGameFinished(true);
      setPhase('gameover');
    }
  }, []);

  const startObservation = useCallback(() => {
    setPhase('observation');
    setTimerProgress(100);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / OBSERVATION_TIME) * 100);
      setTimerProgress(remaining);
      if (elapsed >= OBSERVATION_TIME) {
        clearInterval(timerRef.current!);
        setPhase('recall');
        setSelectedColor(null);
      }
    }, 30);
  }, []);

  const startGame = useCallback(() => {
    if (gameFinished) return;
    startObservation();
  }, [gameFinished, startObservation]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleCircleClick = (index: number) => {
    if (phase !== 'recall') return;
    if (!selectedColor) return;
    const newGrid = [...playerGrid];
    newGrid[index] = selectedColor;
    setPlayerGrid(newGrid);
  };

  const clearGrid = () => {
    if (phase !== 'recall') return;
    setPlayerGrid(Array(9).fill(null));
    setSelectedColor(null);
  };

  const filledColoredPositions = currentSolution.filter((c, i) => c !== null && playerGrid[i] !== null).length;
  const totalColoredPositions = currentSolution.filter(c => c !== null).length;
  const canVerify = phase === 'recall' && filledColoredPositions === totalColoredPositions;

  const verify = () => {
    if (!canVerify) return;
    const res = currentSolution.map((c, i) => {
      if (c === null) return playerGrid[i] === null;
      return playerGrid[i] === c;
    });
    const correct = res.every(Boolean);
    setResult(res);
    setIsCorrect(correct);
    setPhase('result');

    const savedData = saveAttempt(currentPuzzleIdx, correct, playerGrid, solutions);
    const newAttemptsUsed = savedData.attemptsUsed;
    setAttemptsUsed(newAttemptsUsed);
    setPuzzlesSolved(savedData.puzzlesSolved);

    if (correct) {
      setCurrentPuzzleIdx(savedData.currentPuzzleIndex);
    }

    const done = newAttemptsUsed >= MAX_ATTEMPTS;

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => {
        if (done) {
          setGameFinished(true);
          setPhase('gameover');
          setShowGameOver(true);
        } else {
          setShowResult(true);
        }
      }, 1200);
    } else {
      if (done) {
        setGameFinished(true);
        setPhase('gameover');
        setShowGameOver(true);
      } else {
        setShowResult(true);
      }
    }
  };

  const nextAttempt = () => {
    setShowResult(false);
    startObservation();
  };

  const share = async () => {
    const data = loadData();
    if (!data) return;
    const text = generateShareText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getCircleColor = (index: number): string => {
    if (phase === 'observation') return currentSolution[index] || NEUTRAL;
    if (phase === 'result' && result) {
      if (!result[index] && currentSolution[index]) return '#FCA5A5';
      if (playerGrid[index]) return playerGrid[index]!;
      return NEUTRAL;
    }
    if (phase === 'recall') return playerGrid[index] || NEUTRAL;
    return NEUTRAL;
  };

  const getCircleBorder = (index: number): string => {
    if (phase === 'result' && result && !result[index] && currentSolution[index]) return '3px solid #DC2626';
    if (phase === 'recall' && selectedColor && !playerGrid[index]) return '2px dashed #9CA3AF';
    return '2px solid transparent';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}>
          Chromatic Daily
        </h1>
        <p className="text-sm text-gray-500 tracking-wide uppercase mb-3">
          {dayName} · #{dayNum} · {colorCount} color{colorCount !== 1 ? 's' : ''}
        </p>
        <AttemptTracker used={attemptsUsed} total={MAX_ATTEMPTS} />
        {!gameFinished && phase !== 'idle' && (
          <p className="text-xs text-gray-400 mt-1">
            Puzzle {currentPuzzleIdx + 1} · Attempt {attemptsUsed + 1} of {MAX_ATTEMPTS}
          </p>
        )}
      </div>

      {/* Main Card */}
      <div className={`w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}>
        {/* Timer Bar */}
        {phase === 'observation' && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gray-800 transition-all duration-75 ease-linear"
              style={{ width: `${timerProgress}%` }}
            />
          </div>
        )}

        {/* Grid */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[280px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleCircleClick(i)}
                disabled={phase !== 'recall'}
                className="aspect-square rounded-full transition-all duration-300 ease-in-out cursor-pointer disabled:cursor-default hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: getCircleColor(i),
                  border: getCircleBorder(i),
                  boxShadow: playerGrid[i] && phase === 'recall' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Color Picker - All 9 colors */}
        {phase === 'recall' && (
          <div className="px-6 pb-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">
              Select a color · {filledColoredPositions}/{totalColoredPositions} placed
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className="w-9 h-9 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: c.hex,
                    outline: selectedColor === c.hex ? '3px solid #111' : '2px solid transparent',
                    outlineOffset: '2px',
                    transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          {phase === 'idle' && !gameFinished && (
            <Button onClick={startGame} className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 text-sm tracking-wide">
              Start Puzzle {currentPuzzleIdx + 1}
            </Button>
          )}
          {(phase === 'idle' || phase === 'gameover') && gameFinished && (
            <div className="text-center w-full">
              <p className="text-sm text-gray-500 mb-2">All attempts used today</p>
              <Button onClick={() => setShowGameOver(true)} variant="outline" className="rounded-xl">
                View Results
              </Button>
            </div>
          )}
          {phase === 'recall' && (
            <>
              <Button onClick={clearGrid} variant="outline" className="rounded-xl flex-1 gap-2">
                <RotateCcw className="w-4 h-4" /> Clear
              </Button>
              <Button onClick={verify} disabled={!canVerify} className="rounded-xl flex-1 bg-gray-900 hover:bg-gray-800 text-white gap-2">
                <CheckCircle2 className="w-4 h-4" /> Verify
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Streak Display */}
      <div className="mt-6 flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-800">{streaks.current}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Streak</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{streaks.max}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Best</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{puzzlesSolved}/{MAX_ATTEMPTS}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Today</p>
        </div>
      </div>

      {/* Info button */}
      <button onClick={() => setShowHowTo(true)} className="mt-6 text-gray-400 hover:text-gray-600 transition-colors">
        <Info className="w-5 h-5" />
      </button>

      {/* How to Play Modal */}
      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>How to Play</DialogTitle>
            <DialogDescription className="sr-only">Instructions for Chromatic Daily</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>A new color memory puzzle every day.</p>
            <div className="space-y-2">
              <p><strong>1.</strong> Press <strong>Start</strong> — a pattern appears for <strong>5 seconds</strong>.</p>
              <p><strong>2.</strong> Memorize the colors and positions.</p>
              <p><strong>3.</strong> Recreate the pattern from the <strong>full 9-color palette</strong>.</p>
              <p><strong>4.</strong> Hit <strong>Verify</strong> to use one attempt.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-medium text-gray-800 mb-1">Three-Strike System</p>
              <p>You get {MAX_ATTEMPTS} attempts per day. Solve a puzzle to unlock the next one. Fail and you retry the same puzzle with your next attempt.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-medium text-gray-800 mb-1">Daily Difficulty</p>
              <p>Monday starts with 3 colors. Each day adds one more, reaching all 9 by Sunday.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs">Build your streak by solving at least one puzzle each day!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Per-Attempt Result Modal (mid-game) */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }} className="text-2xl">
              {isCorrect ? 'Solved!' : 'Not Quite'}
            </DialogTitle>
            <DialogDescription className="sr-only">Attempt result</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCorrect ? (
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            )}

            <p className="text-sm text-gray-500 mb-4">
              {isCorrect
                ? `Puzzle ${currentPuzzleIdx} solved! Next puzzle unlocked.`
                : `You'll retry Puzzle ${currentPuzzleIdx + 1} on your next attempt.`}
            </p>

            {!isCorrect && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Correct Pattern</p>
                <div className="grid grid-cols-3 gap-2 max-w-[120px] mx-auto">
                  {currentSolution.map((c, i) => (
                    <div key={i} className="aspect-square rounded-full" style={{ backgroundColor: c || NEUTRAL, width: '100%' }} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-4">
              Attempts: {attemptsUsed}/{MAX_ATTEMPTS} · Puzzles Solved: {puzzlesSolved}
            </p>

            <Button onClick={nextAttempt} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2">
              {isCorrect ? `Start Puzzle ${currentPuzzleIdx + 1}` : 'Try Again'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Modal (all attempts used) */}
      <Dialog open={showGameOver} onOpenChange={setShowGameOver}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }} className="text-2xl">
              Today's Results
            </DialogTitle>
            <DialogDescription className="sr-only">Final game results</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {puzzlesSolved > 0 ? (
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            )}

            <p className="text-3xl font-bold mb-1">{puzzlesSolved}/{MAX_ATTEMPTS}</p>
            <p className="text-sm text-gray-500 mb-4">Puzzles Solved</p>

            {/* Attempt breakdown */}
            <div className="space-y-1 mb-4 text-sm">
              {(loadData()?.attempts ?? []).map((attempt, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <span className="text-gray-400">Attempt {i + 1}:</span>
                  <span>Puzzle {attempt.puzzleIndex + 1}</span>
                  <span>{attempt.isCorrect ? '🟩' : '⬛'}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-6 justify-center mb-4">
              <div>
                <p className="text-xl font-bold">{loadData()?.currentStreak ?? 0}</p>
                <p className="text-xs text-gray-400">Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold">{loadData()?.maxStreak ?? 0}</p>
                <p className="text-xs text-gray-400">Best</p>
              </div>
            </div>

            <Button onClick={share} variant="outline" className="rounded-xl gap-2">
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share Result'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

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

export default Index;
