import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, ChevronLeft, ChevronRight, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NEUTRAL, RoundData, generateSolution } from '@/lib/game';

interface DailySummaryProps {
  rounds: RoundData[];
  totalAttempts: number;
  maxRounds: number;
  onShare: () => void;
  copied: boolean;
}

interface AttemptSlide {
  attemptGrid: (string | null)[];
  solution: (string | null)[];
  isCorrect: boolean;
  roundIndex: number;
}

export function DailySummary({ rounds, totalAttempts, maxRounds, onShare, copied }: DailySummaryProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Flatten all attempts across rounds into individual slides
  const slides: AttemptSlide[] = [];
  for (const round of rounds) {
    for (const attempt of round.attempts) {
      slides.push({
        attemptGrid: attempt.grid,
        solution: round.solution,
        isCorrect: attempt.isCorrect,
        roundIndex: round.roundIndex,
      });
    }
  }
  // Pad to always show maxRounds slides
  while (slides.length < maxRounds) {
    slides.push(null as any);
  }
  const totalSlides = maxRounds;

  const [swipeDir, setSwipeDir] = useState(0);
  const prev = () => { setSwipeDir(-1); setActiveSlide((s) => Math.max(0, s - 1)); };
  const next = () => { setSwipeDir(1); setActiveSlide((s) => Math.min(totalSlides - 1, s + 1)); };

  const solvedCount = rounds.filter((r) => r.solved).length;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Summary header */}
      <div className="text-center mb-4">
        <h2
          className="text-xl font-bold text-foreground mb-1"
          style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
        >
          Daily Summary
        </h2>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {solvedCount > 0
            ? `Solved ${solvedCount} puzzle${solvedCount > 1 ? 's' : ''} in ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}`
            : 'Better luck tomorrow!'}
        </p>
      </div>

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

        {/* Share button */}
        <div className="px-6 pb-6 flex justify-center">
          <Button onClick={onShare} variant="outline" className="rounded-xl gap-2">
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share Result'}
          </Button>
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
      <p className={`text-xs mb-5 ${slide.isCorrect ? 'text-emerald-500' : 'text-destructive'}`}>
        {slide.isCorrect ? 'Solved' : 'Incorrect'}
      </p>

      {/* 3x3 grid */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={showSolution ? 'solution' : 'player'}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[200px] mx-auto mb-4"
          >
            {Array.from({ length: 9 }).map((_, i) => {
              if (showSolution) {
                const color = solution[i] ?? NEUTRAL;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="aspect-square rounded-full"
                    style={{
                      backgroundColor: color,
                      border: '2px solid transparent',
                      boxShadow: solution[i] ? '0 0 12px 3px rgba(74, 222, 128, 0.3)' : 'none',
                    }}
                  />
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

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="aspect-square rounded-full"
                  style={{
                    backgroundColor: cellColor,
                    boxShadow: glow,
                    border: !result[i] && solution[i] ? '2px solid #DC2626' : '2px solid transparent',
                  }}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* View Solution toggle for incorrect attempts */}
      {!slide.isCorrect && (
        <button
          onClick={() => setShowSolution((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-1"
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
          Round {slideIndex + 1} of {totalSlides}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Not Played</p>
      <div className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[200px] mx-auto mb-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="aspect-square rounded-full"
            style={{ backgroundColor: NEUTRAL, border: '2px solid transparent' }}
          />
        ))}
      </div>
    </div>
  );
}