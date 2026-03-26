import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Share2, Trophy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import {
  GamePhase, NEUTRAL, generateSolution, getDayInfo, getDayNumber,
  hasPlayedToday, saveResult, loadData, getStreaks, generateShareText
} from '@/lib/game';

const OBSERVATION_TIME = 5000;

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [solution, setSolution] = useState<(string | null)[]>(Array(9).fill(null));
  const [activeColors, setActiveColors] = useState<{ name: string; hex: string }[]>([]);
  const [playerGrid, setPlayerGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [timerProgress, setTimerProgress] = useState(100);
  const [result, setResult] = useState<boolean[] | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [shake, setShake] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { dayName, colorCount } = getDayInfo();
  const dayNum = getDayNumber();
  const streaks = getStreaks();

  useEffect(() => {
    const { solution: sol, activeColors: ac } = generateSolution();
    setSolution(sol);
    setActiveColors(ac);

    if (hasPlayedToday()) {
      setAlreadyPlayed(true);
      const data = loadData();
      if (data) {
        setPlayerGrid(data.lastGrid);
        setResult(data.lastSolution.map((c, i) => data.lastGrid[i] === c));
        setIsCorrect(data.lastResult);
        setPhase('result');
      }
    }
  }, []);

  const startGame = useCallback(() => {
    if (alreadyPlayed) return;
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
  }, [alreadyPlayed]);

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

  const canVerify = phase === 'recall' && solution.every((c, i) => c === null || playerGrid[i] !== null);

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
    saveResult(correct, playerGrid, solution);
    setAlreadyPlayed(true);

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setShowResult(true), 1200);
    } else {
      setShowResult(true);
    }
  };

  const share = async () => {
    const text = generateShareText(playerGrid, solution);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getCircleColor = (index: number): string => {
    if (phase === 'observation') return solution[index] || NEUTRAL;
    if (phase === 'result' && result) {
      if (!result[index] && solution[index]) return '#FCA5A5'; // highlight wrong
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}>
          Chromatic Daily
        </h1>
        <p className="text-sm text-gray-500 tracking-wide uppercase">
          {dayName} · #{dayNum} · {colorCount} color{colorCount !== 1 ? 's' : ''}
        </p>
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

        {/* Color Picker */}
        {phase === 'recall' && (
          <div className="px-6 pb-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 text-center">Select a color</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {activeColors.map((c) => (
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
          {phase === 'idle' && !alreadyPlayed && (
            <Button onClick={startGame} className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 text-sm tracking-wide">
              Start
            </Button>
          )}
          {phase === 'idle' && alreadyPlayed && (
            <div className="text-center w-full">
              <p className="text-sm text-gray-500 mb-2">You've already played today</p>
              <Button onClick={() => setShowResult(true)} variant="outline" className="rounded-xl">
                View Result
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
          {phase === 'result' && !showResult && (
            <Button onClick={() => setShowResult(true)} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white w-full">
              View Result
            </Button>
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
              <p><strong>1.</strong> Press <strong>Start</strong> — a pattern of colored circles appears for <strong>5 seconds</strong>.</p>
              <p><strong>2.</strong> Memorize the colors and positions.</p>
              <p><strong>3.</strong> Recreate the pattern from memory using the color picker.</p>
              <p><strong>4.</strong> Hit <strong>Verify</strong> to check your answer.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-medium text-gray-800 mb-1">Daily Difficulty</p>
              <p>Monday starts with 3 colors. Each day adds one more, reaching all 9 by Sunday.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs">One attempt per day. Build your streak!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }} className="text-2xl">
              {isCorrect ? 'Perfect Recall' : 'Not Quite'}
            </DialogTitle>
            <DialogDescription className="sr-only">Your game result</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCorrect ? (
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            )}

            {/* Emoji grid preview */}
            <div className="font-mono text-lg leading-relaxed mb-4">
              {[0, 3, 6].map((row) => (
                <div key={row}>
                  {solution.slice(row, row + 3).map((c, i) => {
                    if (c === null) return '⬜';
                    return playerGrid[row + i] === c ? '🟩' : '⬛';
                  }).join('')}
                </div>
              ))}
            </div>

            {!isCorrect && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Correct Pattern</p>
                <div className="grid grid-cols-3 gap-2 max-w-[120px] mx-auto">
                  {solution.map((c, i) => (
                    <div key={i} className="aspect-square rounded-full" style={{ backgroundColor: c || NEUTRAL, width: '100%' }} />
                  ))}
                </div>
              </div>
            )}

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
