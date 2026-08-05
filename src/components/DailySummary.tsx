import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ChevronLeft, ChevronRight, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NEUTRAL, RoundData, generateSolution, GRID_SIZE, getResultBadge } from '@/lib/game';
import { MixedTile } from '@/components/MixedTile';
import { radialSlotStyle } from '@/components/RadialLayout';
import type { SessionStats } from '@/components/SessionReport';

interface DailySummaryProps {
  rounds: RoundData[];
  totalAttempts: number;
  maxRounds: number;
  onShare: () => void;
  onShareWhatsApp: () => void;
  copied: boolean;
  onStartFreePlay?: () => void;
  dayName: string;
  colorCount: number;
  starsEarned: number;
  totalFocusSeconds: number;
  stats?: SessionStats;
}

function getDifficultyName(colorCount: number): string {
  if (colorCount <= 2) return 'MINIMALIST';
  if (colorCount <= 4) return 'STANDARD';
  if (colorCount <= 6) return 'COMPLEX';
  return 'MASTER';
}

interface AttemptSlide {
  attemptGrid: (string | null)[];
  solution: (string | null)[];
  isCorrect: boolean;
  roundIndex: number;
}

export function DailySummary({ rounds, totalAttempts, maxRounds, onShare, onShareWhatsApp, copied, onStartFreePlay, dayName, colorCount, starsEarned, totalFocusSeconds, stats }: DailySummaryProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Derived metrics for the bottom block.
  const consistency = stats && stats.roundsPlayed
    ? Math.round((stats.totalCorrect / stats.roundsPlayed) * 100)
    : 0;
  const sortedTimes = stats ? [...stats.correctTimes].sort((a, b) => a - b).slice(0, 3) : [];
  const reflexAvg = sortedTimes.length
    ? sortedTimes.reduce((s, n) => s + n, 0) / sortedTimes.length
    : null;
  const reflexLabel = reflexAvg !== null ? `${reflexAvg.toFixed(2)}s` : '—';
  const peakLabel = stats?.peakComplexity
    ? `${stats.peakComplexity.tiles} in ${stats.peakComplexity.seconds.toFixed(1)}s`
    : '—';
  const tilesDecoded = stats?.tilesDecoded ?? 0;

  // Flatten attempts chronologically so the carousel always shows
  // Attempt 1/2/3 regardless of which adaptive stage each lived under
  // (stages collapse onto only 3 round indices, so a round-indexed view
  // would leave the 3rd card empty on certain branches).
  const allAttempts = rounds.flatMap((r) =>
    r.attempts.map((a) => ({ attempt: a, roundSolution: r.solution })),
  );
  const slides: (AttemptSlide | null)[] = [];
  for (let i = 0; i < maxRounds; i++) {
    const entry = allAttempts[i];
    if (entry) {
      slides.push({
        attemptGrid: entry.attempt.grid,
        solution: entry.attempt.solution ?? entry.roundSolution,
        isCorrect: entry.attempt.isCorrect,
        roundIndex: i,
      });
    } else {
      slides.push(null);
    }
  }
  const totalSlides = maxRounds;

  const [swipeDir, setSwipeDir] = useState(0);
  const prev = () => { setSwipeDir(-1); setActiveSlide((s) => Math.max(0, s - 1)); };
  const next = () => { setSwipeDir(1); setActiveSlide((s) => Math.min(totalSlides - 1, s + 1)); };

  const solvedCount = rounds.filter((r) => r.solved).length;
  const resultBadge = getResultBadge(rounds);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Summary header */}

      {/* Carousel */}
      <div className="bg-card rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="relative">
          {/* Navigation arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prev}
                disabled={activeSlide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                disabled={activeSlide === totalSlides - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: swipeDir >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDir >= 0 ? -40 : 40 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) next();
                else if (info.offset.x > 50) prev();
              }}
              className="p-6 sm:p-8 cursor-grab active:cursor-grabbing"
            >
              {slides[activeSlide] ? (
                <SlideContent
                  slide={slides[activeSlide]!}
                  slideIndex={activeSlide}
                  totalSlides={totalSlides}
                />
              ) : (
                <UnplayedSlide slideIndex={activeSlide} totalSlides={totalSlides} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 pb-4">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeSlide
                    ? 'bg-primary w-5'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Rest indicator */}
        <div className="px-6 py-4 text-center border-t border-border">
          <p className="font-semibold text-foreground text-base">
            {resultBadge.label}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {resultBadge.sublabel}
          </p>
        </div>

        {/* Focus + Stars stat card */}
        {/* Share buttons */}
        <div className="px-6 pb-4 flex justify-center gap-3">
          <Button onClick={onShare} variant="outline" className="rounded-xl gap-2">
            <Link2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share Result'}
          </Button>
          <Button onClick={onShareWhatsApp} variant="outline" className="rounded-xl gap-2 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </Button>
        </div>

        {/* Free Play button */}
        {onStartFreePlay && (
          <div className="px-6 pb-6 flex justify-center">
            <Button onClick={onStartFreePlay} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <span className="text-base">✨</span> Start Practice Mode
            </Button>
          </div>
        )}

        {/* Focus + Stars stat card - moved to bottom */}
        <div className="px-6 pt-4 pb-6">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
            {stats && stats.roundsPlayed > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 pb-3 border-b border-border/60 text-left">
                <MetricRow label="Consistency" value={`${consistency}%`} />
                <MetricRow label="Reflex Avg" value={reflexLabel} />
                <MetricRow label="Peak" value={peakLabel} />
                <MetricRow label="Decoded" value={`${tilesDecoded} tiles`} />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-base">⭐️</span>
              <span className="text-xs font-semibold text-foreground">× {starsEarned}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-1">
                Speed Stars Earned
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideContent({ slide, slideIndex, totalSlides }: { slide: AttemptSlide; slideIndex: number; totalSlides: number }) {
  const [showSolution, setShowSolution] = useState(false);
  const playerGrid = slide.attemptGrid;
  const solution = slide.solution;

  const result = solution.map((c, i) => {
    if (c === null) return playerGrid[i] === null;
    return playerGrid[i] === c;
  });
  const correctTiles = result.filter(Boolean).length;
  const neuralMatch = Math.round((correctTiles / GRID_SIZE) * 100);

  return (
    <div className="text-center">
      {/* Round header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {slide.isCorrect ? (
          <Trophy className="w-4 h-4 text-yellow-500" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Attempt {slideIndex + 1} of {totalSlides}
        </h3>
      </div>
      {slide.isCorrect ? (
        <p className="text-xs mb-2 text-emerald-500">Solved · 100% Neural Match</p>
      ) : (
        <div className="mb-2 px-4 max-w-[220px] mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Neural Match
            </span>
            <span className="text-[10px] font-semibold text-foreground">{neuralMatch}%</span>
          </div>
          <Progress value={neuralMatch} className="h-1.5" />
        </div>
      )}

      {/* Radial board */}
      <div className="relative pb-8 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={showSolution ? 'solution' : 'player'}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="relative w-full aspect-square max-w-[190px]"
          >
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              if (showSolution) {
                const color = solution[i] ?? NEUTRAL;
                const up = solution[i]?.toUpperCase();
                const isWhite = up === '#FFFFFF';
                const bg: string = color;
                const lightBorder = isWhite;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="rounded-full overflow-hidden"
                    style={{
                      ...radialSlotStyle(i),
                      backgroundColor: bg,
                      border: lightBorder ? '2px solid #D1D5DB' : '2px solid transparent',
                      boxShadow: solution[i] ? '0 0 12px 3px rgba(74, 222, 128, 0.3)' : 'none',
                    }}
                  >
                    <MixedTile colorHex={solution[i]} shapeScale={0.5} />
                  </motion.div>
                );
              }

              const cellColor = (() => {
                // Show the player's actual picked color (or neutral if empty)
                if (playerGrid[i]) return playerGrid[i]!;
                return NEUTRAL;
              })();

              const hasColor = solution[i] !== null || playerGrid[i] !== null;
              const glow = hasColor
                ? result[i]
                  ? '0 0 16px 4px rgba(74, 222, 128, 0.45)'
                  : '0 0 16px 4px rgba(248, 113, 113, 0.45)'
                : 'none';
              const pUp = playerGrid[i]?.toUpperCase();
              const pIsWhite = pUp === '#FFFFFF';
              const pBg: string = cellColor;
              const pLightBorder = pIsWhite;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-full overflow-hidden"
                  style={{
                    ...radialSlotStyle(i),
                    backgroundColor: pBg,
                    boxShadow: glow,
                    border: !result[i] && solution[i]
                      ? '2px solid #DC2626'
                      : pLightBorder
                      ? '2px solid #D1D5DB'
                      : '2px solid transparent',
                  }}
                >
                  <MixedTile colorHex={playerGrid[i]} shapeScale={0.5} />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* View Solution toggle for incorrect attempts */}
      {!slide.isCorrect && (
        <button
          onClick={() => setShowSolution((s) => !s)}
          className="block w-fit mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-2"
        >
          {showSolution ? 'View Your Attempt' : 'View Solution'}
        </button>
      )}
    </div>
  );
}

function UnplayedSlide({ slideIndex, totalSlides }: { slideIndex: number; totalSlides: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="w-4 h-4 rounded-full bg-muted inline-block" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Attempt {slideIndex + 1} of {totalSlides}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Not Played</p>
      <div className="relative w-full aspect-square max-w-[190px] mx-auto mb-6">
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-full"
            style={{ ...radialSlotStyle(i), backgroundColor: NEUTRAL, border: '2px solid transparent' }}
          />
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}