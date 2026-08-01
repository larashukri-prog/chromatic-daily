import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, animate } from 'framer-motion';
import { Link2, ChevronLeft, ChevronRight, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NEUTRAL, RoundData, generateSolution, GRID_SIZE, getResultBadge } from '@/lib/game';
import { useAccessibility, useVisualTheme, type VisualTheme } from '@/hooks/useAccessibility';
import { PatternOverlay } from '@/components/PatternOverlay';
import { ShapeOverlay } from '@/components/ShapeOverlay';
import { MtaOverlay } from '@/components/MtaOverlay';
import { MtaPaletteProvider } from '@/components/MtaPaletteContext';
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

/* ---------- Shared motion variants ---------- */

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.7 };

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SPRING, staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Diagonal (top-left -> bottom-right) reveal delay for a 2-column grid. */
function tileDelay(i: number) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return (col + row) * 0.07;
}

/** Animated count-up used by the Neural Match readout. */
function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    const controls = animate(0, target, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, enabled]);
  return value;
}

interface AttemptSlide {
  attemptGrid: (string | null)[];
  solution: (string | null)[];
  isCorrect: boolean;
  roundIndex: number;
  visualTheme?: VisualTheme;
}

export function DailySummary({ rounds, totalAttempts, maxRounds, onShare, onShareWhatsApp, copied, onStartFreePlay, dayName, colorCount, starsEarned, totalFocusSeconds, stats }: DailySummaryProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const { theme: visualTheme } = useVisualTheme();
  const mta = visualTheme === 'mta';

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
        visualTheme: entry.attempt.visualTheme as VisualTheme | undefined,
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
  const reduce = useReducedMotion();

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Summary header */}

      {/* Carousel */}
      <motion.div
        variants={cardVariants}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="bg-card rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        <motion.div variants={sectionVariants} className="relative">
          {/* Navigation arrows */}
          {totalSlides > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.9 }}
                transition={SPRING}
                onClick={prev}
                disabled={activeSlide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.9 }}
                transition={SPRING}
                onClick={next}
                disabled={activeSlide === totalSlides - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: swipeDir >= 0 ? 48 : -48, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: swipeDir >= 0 ? -48 : 48, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
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
        </motion.div>

        {/* Dot indicators */}
        {totalSlides > 1 && (
          <motion.div variants={sectionVariants} className="flex justify-center gap-2 pb-4">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveSlide(i)}
                animate={{
                  width: i === activeSlide ? 20 : 8,
                  boxShadow: i === activeSlide
                    ? '0 0 8px 1px hsl(var(--primary) / 0.5)'
                    : '0 0 0 0 hsl(var(--primary) / 0)',
                }}
                transition={SPRING}
                whileTap={{ scale: 0.85 }}
                className={`h-2 rounded-full ${
                  i === activeSlide
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </motion.div>
        )}

        {/* Rest indicator */}
        <motion.div variants={sectionVariants} className="px-6 py-4 text-center border-t border-border">
          <motion.p
            initial={reduce ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.35 }}
            className="font-semibold text-foreground text-base"
          >
            {resultBadge.label}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">
            {resultBadge.sublabel}
          </p>
        </motion.div>

        {/* Focus + Stars stat card */}
        {/* Share buttons */}
        <motion.div variants={sectionVariants} className="px-6 pb-4 flex justify-center gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={SPRING}>
          <Button onClick={onShare} variant="outline" className="rounded-xl gap-2">
            <Link2 className="w-4 h-4" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? 'copied' : 'share'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {copied ? 'Copied!' : 'Share Result'}
              </motion.span>
            </AnimatePresence>
          </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={SPRING}>
          <Button onClick={onShareWhatsApp} variant="outline" className="rounded-xl gap-2 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </Button>
          </motion.div>
        </motion.div>

        {/* Free Play button */}
        {onStartFreePlay && (
          <motion.div variants={sectionVariants} className="px-6 pb-6 flex justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={SPRING}>
            <Button onClick={onStartFreePlay} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <span className="text-base">✨</span> Start Practice Mode
            </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Focus + Stars stat card - moved to bottom */}
        <motion.div variants={sectionVariants} className="px-6 pt-4 pb-6">
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
              <motion.span
                className="text-base inline-block"
                initial={reduce ? false : { rotate: 0 }}
                animate={{ rotate: [0, -12, 10, -6, 0], scale: [1, 1.18, 1] }}
                transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
              >
                ⭐️
              </motion.span>
              <span className="text-xs font-semibold text-foreground">× {starsEarned}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-1">
                Speed Stars Earned
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SlideContent({ slide, slideIndex, totalSlides }: { slide: AttemptSlide; slideIndex: number; totalSlides: number }) {
  const { enabled: a11y } = useAccessibility();
  const { theme: globalTheme } = useVisualTheme();
  const effectiveTheme = slide.visualTheme ?? globalTheme;
  const shapesMode = effectiveTheme === 'shapes';
  const mtaMode = effectiveTheme === 'mta';
  const patternsMode = effectiveTheme === 'patterns';
  const showPatterns = a11y || patternsMode;
  const [showSolution, setShowSolution] = useState(false);
  const playerGrid = slide.attemptGrid;
  const solution = slide.solution;

  // Active hexes for this attempt (so MTA subway bullet mapping matches the puzzle
  // that was actually played, not the current/global stage palette).
  const slideActiveHexes = Array.from(
    new Set(
      [...solution, ...playerGrid].filter(
        (h): h is string => typeof h === 'string',
      ).map((h) => h.toUpperCase()),
    ),
  );

  const result = solution.map((c, i) => {
    if (c === null) return playerGrid[i] === null;
    return playerGrid[i] === c;
  });
  const correctTiles = result.filter(Boolean).length;
  const neuralMatch = Math.round((correctTiles / GRID_SIZE) * 100);
  const reduce = useReducedMotion();
  const animatedMatch = useCountUp(neuralMatch, !reduce);

  return (
    <MtaPaletteProvider activeHexes={slideActiveHexes}>
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
        <p className="text-xs mb-5 text-emerald-500">Solved · 100% Neural Match</p>
      ) : (
        <div className="mb-5 px-4 max-w-[220px] mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Neural Match
            </span>
            <span className="text-[10px] font-semibold text-foreground tabular-nums">{animatedMatch}%</span>
          </div>
          <Progress value={animatedMatch} className="h-1.5" />
        </div>
      )}

      {/* 2x3 grid */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={showSolution ? 'solution' : 'player'}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="grid grid-cols-2 gap-4 sm:gap-5 max-w-[160px] mx-auto mb-4"
          >
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              if (showSolution) {
                const color = solution[i] ?? NEUTRAL;
                const up = solution[i]?.toUpperCase();
                const isBlack = up === '#000000';
                const isWhite = up === '#FFFFFF';
                let bg: string = color;
                if (solution[i]) {
                  if (shapesMode) bg = '#FFFFFF';
                  else if (mtaMode) bg = '#FFFFFF';
                }
                const lightBorder =
                  (shapesMode && solution[i]) ||
                  (mtaMode && !!solution[i]);
                return (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                    animate={{
                      scale: [0.6, 1.04, 1],
                      opacity: 1,
                      boxShadow: solution[i]
                        ? ['0 0 0 0 rgba(74, 222, 128, 0)', '0 0 0 0 rgba(74, 222, 128, 0)', '0 0 12px 3px rgba(74, 222, 128, 0.3)']
                        : 'none',
                    }}
                    transition={{
                      duration: 0.5,
                      times: [0, 0.6, 1],
                      ease: [0.22, 1, 0.36, 1],
                      delay: tileDelay(i),
                    }}
                    className="aspect-square rounded-full relative overflow-hidden"
                    style={{
                      backgroundColor: bg,
                      border: lightBorder ? '2px solid #D1D5DB' : '2px solid transparent',
                    }}
                  >
                    {showPatterns && <PatternOverlay colorHex={solution[i]} size="100%" />}
                    {shapesMode && <ShapeOverlay colorHex={solution[i]} />}
                    {mtaMode && solution[i] && <MtaOverlay colorHex={solution[i]} />}
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
              const pIsBlack = pUp === '#000000';
              const pIsWhite = pUp === '#FFFFFF';
              let pBg: string = cellColor;
              if (playerGrid[i]) {
                if (shapesMode) pBg = '#FFFFFF';
                else if (mtaMode) pBg = '#FFFFFF';
              }
              const pLightBorder =
                (shapesMode && playerGrid[i]) ||
                (mtaMode && !!playerGrid[i]);

              return (
                <motion.div
                  key={i}
                  initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                  animate={{
                    scale: [0.6, 1.04, 1],
                    opacity: 1,
                    boxShadow: ['0 0 0 0 rgba(0,0,0,0)', '0 0 0 0 rgba(0,0,0,0)', glow],
                    x: hasColor && !result[i] && !reduce ? [0, -3, 3, -2, 2, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    times: [0, 0.6, 1],
                    ease: [0.22, 1, 0.36, 1],
                    delay: tileDelay(i),
                    x: { duration: 0.24, delay: tileDelay(i) + 0.45, ease: 'easeInOut' },
                  }}
                  className="aspect-square rounded-full relative overflow-hidden"
                  style={{
                    backgroundColor: pBg,
                    border: !result[i] && solution[i]
                      ? '2px solid #DC2626'
                      : pLightBorder
                      ? '2px solid #D1D5DB'
                      : '2px solid transparent',
                  }}
                >
                  {showPatterns && <PatternOverlay colorHex={playerGrid[i]} size="100%" />}
                  {shapesMode && <ShapeOverlay colorHex={playerGrid[i]} />}
                  {mtaMode && playerGrid[i] && <MtaOverlay colorHex={playerGrid[i]} />}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* View Solution toggle for incorrect attempts */}
      {!slide.isCorrect && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={SPRING}
          onClick={() => setShowSolution((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-1 inline-block"
        >
          {showSolution ? 'View Your Attempt' : 'View Solution'}
        </motion.button>
      )}
    </div>
    </MtaPaletteProvider>
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
      <div className="grid grid-cols-2 gap-4 sm:gap-5 max-w-[160px] mx-auto mb-4">
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.04, 1], opacity: 1 }}
            transition={{ duration: 0.5, times: [0, 0.6, 1], ease: [0.22, 1, 0.36, 1], delay: tileDelay(i) }}
            className="aspect-square rounded-full"
            style={{ backgroundColor: NEUTRAL, border: '2px solid transparent' }}
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