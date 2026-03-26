import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Share2, Trophy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import {
  GamePhase, NEUTRAL, COLORS, generateSolution, getDayInfo, getDayNumber,
  hasFinishedToday, getStreaks, generateShareText, getCurrentRoundInfo,
  saveRoundAttempt, getResultMessage, MAX_ROUNDS, getTodayData, RoundData } from
'@/lib/game';

const OBSERVATION_TIME = 5000;

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [solution, setSolution] = useState<(string | null)[]>(Array(9).fill(null));
  const [activeColors, setActiveColors] = useState<{name: string;hex: string;}[]>([]);
  const [playerGrid, setPlayerGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { dayName, colorCount } = getDayInfo();
  const dayNum = getDayNumber();
  const streaks = getStreaks();

  useEffect(() => {
    // Dev reset: add ?reset to URL to clear game data
    if (window.location.search.includes('reset')) {
      localStorage.removeItem('chromatic_daily');
      window.history.replaceState({}, '', window.location.pathname);
      // Start fresh after reset
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

  const startObservation = useCallback(() => {
    setPhase('observation');
    setTimerProgress(100);
    setPlayerGrid(Array(9).fill(null));
    setResult(null);
    setSelectedColor(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - elapsed / OBSERVATION_TIME * 100);
      setTimerProgress(remaining);
      if (elapsed >= OBSERVATION_TIME) {
        clearInterval(timerRef.current!);
        setPhase('recall');
        setSelectedColor(null);
      }
    }, 30);
  }, []);

  const startGame = useCallback(() => {
    if (alreadyFinished) return;
    startObservation();
  }, [alreadyFinished, startObservation]);

  useEffect(() => {
    return () => {if (timerRef.current) clearInterval(timerRef.current);};
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

  const filledColoredPositions = solution.filter((c, i) => c !== null && playerGrid[i] !== null).length;
  const totalColoredPositions = solution.filter((c) => c !== null).length;
  const canVerify = phase === 'recall' && filledColoredPositions === totalColoredPositions;

  const verify = () => {
    if (!canVerify) return;
    const res = solution.map((c, i) => {
      if (c === null) return playerGrid[i] === null;
      return playerGrid[i] === c;
    });
    const correct = res.every(Boolean);
    setResult(res);
    setIsCorrect(correct);
    setPhase('result');

    const newTotalUsed = totalAttemptsUsed + 1;
    setTotalAttemptsUsed(newTotalUsed);

    const savedData = saveRoundAttempt(roundIndex, correct, playerGrid, solution);
    setSavedRounds(savedData.rounds);

    const msg = getResultMessage(roundIndex, attemptInRound, correct, newTotalUsed);
    setResultMessage(msg);

    const done = newTotalUsed >= MAX_ROUNDS || correct && roundIndex >= MAX_ROUNDS - 1;
    if (done || savedData.finished) {
      setAlreadyFinished(true);
    }

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setShowResult(true), 1200);
    } else {
      setShowResult(true);
    }
  };

  const canContinue = phase === 'result' && totalAttemptsUsed < MAX_ROUNDS && !alreadyFinished;

  const nextAttempt = () => {
    setShowResult(false);

    if (isCorrect) {
      // Solved! Generate new puzzle for next round
      const newRound = roundIndex + 1;
      setRoundIndex(newRound);
      setAttemptInRound(1);
      const { solution: sol, activeColors: ac } = generateSolution(newRound);
      setSolution(sol);
      setActiveColors(ac);
    } else {
      // Failed, retry same puzzle
      setAttemptInRound((prev) => prev + 1);
    }

    startObservation();
  };

  const share = async () => {
    const data = getTodayData();
    const rounds = data?.rounds ?? savedRounds;
    const text = generateShareText(rounds);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {/* fallback */}
  };

  const getCircleColor = (index: number): string => {
    if (phase === 'observation') return solution[index] || NEUTRAL;
    if (phase === 'result' && result) {
      if (!result[index] && solution[index]) return '#FCA5A5';
      if (playerGrid[index]) return playerGrid[index]!;
      return NEUTRAL;
    }
    if (phase === 'recall') return playerGrid[index] || NEUTRAL;
    return NEUTRAL;
  };

  const getCircleBorder = (index: number): string => {
    if (phase === 'result' && result && !result[index] && solution[index]) return '3px solid #DC2626';
    if (phase === 'recall' && selectedColor && !playerGrid[index]) return '2px dashed #9CA3AF';
    return '2px solid transparent';
  };

  // Status bar info
  const solvedRounds = savedRounds.filter((r) => r.solved).length;
  const statusText = phase === 'idle' && !alreadyFinished ?
  'Ready to play' :
  alreadyFinished ?
  `Game complete · Solved ${solvedRounds}/${savedRounds.length}` :
  phase === 'observation' ?
  'Memorize the pattern...' :
  phase === 'recall' ?
  'Recreate from memory' :
  '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}>
          Chromatic Daily 
        </h1>
        <p className="text-sm text-gray-500 tracking-wide uppercase">
          {dayName} · #{dayNum} · {colorCount} color{colorCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status Bar / Turn Tracker */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Round {Math.min(roundIndex + 1, MAX_ROUNDS)} of {MAX_ROUNDS}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_ROUNDS }).map((_, i) => {
              const round = savedRounds.find((r) => r.roundIndex === i);
              let bgColor = 'bg-gray-200'; // not played
              if (round?.solved) bgColor = 'bg-emerald-400';else
              if (round && !round.solved && round.attempts.length > 0 && (alreadyFinished || i < roundIndex)) bgColor = 'bg-red-400';else
              if (i === roundIndex && phase !== 'idle') bgColor = 'bg-gray-800 animate-pulse';
              return <div key={i} className={`w-2.5 h-2.5 rounded-full ${bgColor} transition-colors`} />;
            })}
          </div>
          <span className="text-xs text-gray-400">{totalAttemptsUsed}/{MAX_ROUNDS} used</span>
        </div>
        {statusText &&
        <p className="text-xs text-gray-400 text-center mt-1.5">{statusText}</p>
        }
      </div>

      {/* Main Card */}
      <div className={`w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}>
        {/* Timer Bar */}
        {phase === 'observation' &&
        <div className="h-1 bg-gray-100">
            <div
            className="h-full bg-gray-800 transition-all duration-75 ease-linear"
            style={{ width: `${timerProgress}%` }} />
          
          </div>
        }

        {/* Grid */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[280px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) =>
            <button
              key={i}
              onClick={() => handleCircleClick(i)}
              disabled={phase !== 'recall'}
              className="aspect-square rounded-full transition-all duration-300 ease-in-out cursor-pointer disabled:cursor-default hover:scale-105 active:scale-95"
              style={{
                backgroundColor: getCircleColor(i),
                border: getCircleBorder(i),
                boxShadow: playerGrid[i] && phase === 'recall' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }} />

            )}
          </div>
        </div>

        {/* Color Picker */}
        {phase === 'recall' &&
        <div className="px-6 pb-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">
              Select a color · {filledColoredPositions}/{totalColoredPositions} placed
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {COLORS.map((c) =>
            <button
              key={c.hex}
              onClick={() => setSelectedColor(c.hex)}
              className="w-9 h-9 rounded-full transition-all duration-200"
              style={{
                backgroundColor: c.hex,
                outline: selectedColor === c.hex ? '3px solid #111' : '2px solid transparent',
                outlineOffset: '2px',
                transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)'
              }}
              title={c.name} />

            )}
            </div>
          </div>
        }

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          {phase === 'idle' && !alreadyFinished &&
          <Button onClick={startGame} className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 text-sm tracking-wide">
              Start
            </Button>
          }
          {phase === 'idle' && alreadyFinished &&
          <div className="text-center w-full">
              <p className="text-sm text-gray-500 mb-2">You've completed all rounds today</p>
              <Button onClick={() => setShowResult(true)} variant="outline" className="rounded-xl">
                View Result
              </Button>
            </div>
          }
          {phase === 'recall' &&
          <>
              <Button onClick={clearGrid} variant="outline" className="rounded-xl flex-1 gap-2">
                <RotateCcw className="w-4 h-4" /> Clear
              </Button>
              <Button onClick={verify} disabled={!canVerify} className="rounded-xl flex-1 bg-gray-900 hover:bg-gray-800 text-white gap-2">
                <CheckCircle2 className="w-4 h-4" /> Verify
              </Button>
            </>
          }
          {phase === 'result' && !showResult &&
          <Button onClick={() => setShowResult(true)} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white w-full">
              View Result
            </Button>
          }
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
      </div>

      {/* Info & Reset buttons */}
      <div className="mt-6 flex items-center gap-4">
        <button onClick={() => setShowHowTo(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('chromatic_daily');
            window.location.href = window.location.pathname + '?reset';
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Reset game">
          
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

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
              <p><strong>1.</strong> Press <strong>Start</strong> — a pattern of colored circles appears for <strong>5 seconds</strong>.</p>
              <p><strong>2.</strong> Memorize the colors and positions.</p>
              <p><strong>3.</strong> Recreate the pattern from memory using the color picker.</p>
              <p><strong>4.</strong> Hit <strong>Verify</strong> to check your answer.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-medium text-gray-800 mb-1">The 3-Round Rule</p>
              <p>You have a total of <strong>{MAX_ROUNDS} attempts</strong> to play each day.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Success:</strong> If you solve a puzzle, the remaining attempts carry over to a brand-new color configuration.</li>
                <li><strong>Persistence:</strong> If you miss, you can use your next attempt to try the same puzzle again.</li>
              </ul>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-medium text-gray-800 mb-1">Daily Difficulty</p>
              <p>Monday starts with 3 colors. Each day adds one more, reaching all 9 by Sunday.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs">Build your streak!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }} className="text-2xl">
              {isCorrect ? 'Perfect Recall' : canContinue ? 'Not Quite' : 'Game Over'}
            </DialogTitle>
            <DialogDescription className="sr-only">Your game result</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCorrect ?
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" /> :

            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            }

            {/* Contextual message */}
            {resultMessage &&
            <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line px-2">{resultMessage}</p>
            }

            {/* Emoji grid preview for current round */}
            <div className="font-mono text-lg leading-relaxed mb-4">
              {[0, 3, 6].map((row) =>
              <div key={row}>
                  {solution.slice(row, row + 3).map((c, i) => {
                  if (c === null) return '⚪';
                  return playerGrid[row + i] === c ? '🟢' : '⚫';
                }).join('')}
                </div>
              )}
            </div>

            {!isCorrect &&
            <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Correct Pattern</p>
                <div className="grid grid-cols-3 gap-2 max-w-[120px] mx-auto">
                  {solution.map((c, i) =>
                <div key={i} className="aspect-square rounded-full" style={{ backgroundColor: c || NEUTRAL, width: '100%' }} />
                )}
                </div>
              </div>
            }

            <div className="flex gap-6 justify-center mb-4">
              <div>
                <p className="text-xl font-bold">{streaks.current}</p>
                <p className="text-xs text-gray-400">Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold">{streaks.max}</p>
                <p className="text-xs text-gray-400">Best</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              {canContinue &&
              <Button onClick={nextAttempt} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2">
                  <RotateCcw className="w-4 h-4" /> {isCorrect ? 'Next Round' : 'Try Again'}
                </Button>
              }
              <Button onClick={share} variant="outline" className="rounded-xl gap-2">
                <Share2 className="w-4 h-4" />
                {copied ? 'Copied!' : 'Share Result'}
              </Button>
            </div>
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
    </div>);

};

export default Index;