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

export function DailySummary({ rounds, totalAttempts, maxRounds, onShare, copied }: DailySummaryProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Build slides for all attempts (up to maxRounds)
  const slides = rounds.length > 0 ? rounds : [];
  const totalSlides = slides.length || 1;

  const prev = () => setActiveSlide((s) => Math.max(0, s - 1));
  const next = () => setActiveSlide((s) => Math.min(totalSlides - 1, s + 1));

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
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >
              {slides[activeSlide] && (
                <SlideContent
                  round={slides[activeSlide]}
                  slideIndex={activeSlide}
                  totalSlides={totalSlides}
                />
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

function SlideContent({ round, slideIndex, totalSlides }: { round: RoundData; slideIndex: number; totalSlides: number }) {
  const lastAttempt = round.attempts[round.attempts.length - 1];
  const playerGrid = lastAttempt?.grid ?? Array(9).fill(null);

  // Compute result per cell
  const result = round.solution.map((c, i) => {
    if (c === null) return playerGrid[i] === null;
    return playerGrid[i] === c;
  });

  return (
    <div className="text-center">
      {/* Round header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {round.solved ? (
          <Trophy className="w-4 h-4 text-yellow-500" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Round {slideIndex + 1} of {totalSlides}
        </h3>
      </div>
      <p className={`text-xs mb-5 ${round.solved ? 'text-emerald-500' : 'text-destructive'}`}>
        {round.solved ? 'Solved' : 'Incorrect'}
      </p>

      {/* 3x3 grid with verification glow */}
      <div className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[200px] mx-auto mb-4">
        {Array.from({ length: 9 }).map((_, i) => {
          const cellColor = (() => {
            if (!result[i] && round.solution[i]) return '#FCA5A5';
            if (playerGrid[i]) return playerGrid[i]!;
            return NEUTRAL;
          })();

          const hasColor = round.solution[i] !== null || playerGrid[i] !== null;
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
                border: !result[i] && round.solution[i] ? '2px solid #DC2626' : '2px solid transparent',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}