import { motion, useReducedMotion } from 'framer-motion';
import { GamePhase, NEUTRAL, GRID_SIZE } from '@/lib/game';
import { useVisualTheme } from '@/hooks/useAccessibility';
import { PatternOverlay } from '@/components/PatternOverlay';
import { ShapeOverlay } from '@/components/ShapeOverlay';
import { MtaOverlay } from '@/components/MtaOverlay';

export type TileFxType = 'fill' | 'clear' | 'shake' | 'ripple';
export type TileFxMap = Record<number, TileFxType>;

interface GameGridProps {
  phase: GamePhase;
  solution: (string | null)[];
  playerGrid: (string | null)[];
  result: boolean[] | null;
  selectedColor: string | null;
  verifying: boolean;
  activeSlot?: number | null;
  /** Per-tile micro-interaction effects, keyed by tile index. */
  tileFx?: TileFxMap;
  /** Face-down 3D flip of the board (fires on "I'm ready"). */
  flipping?: boolean;
  onCircleClick: (index: number) => void;
}

export function GameGrid({ phase, solution, playerGrid, result, selectedColor, verifying, activeSlot, tileFx, flipping, onCircleClick }: GameGridProps) {
  const { theme } = useVisualTheme();
  const reduceMotion = useReducedMotion();
  const a11y = theme === 'patterns';
  const shapes = theme === 'shapes';
  const mta = theme === 'mta';

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

  // In shapes mode, the slot background is always white when the slot has a value;
  // empty slots stay neutral so the player can still see what's filled in.
  const getDisplayBackground = (index: number): string => {
    const c = getCircleColor(index);
    if (mta) {
      if (c === NEUTRAL) return NEUTRAL;
      if (phase === 'result' && result && !result[index] && solution[index]) return '#FCA5A5';
      // MTA tiles use the brand color as the full slot background so the bullet bleeds to the edge.
      return c;
    }
    if (!shapes) return c;
    if (c === NEUTRAL) return NEUTRAL;
    if (phase === 'result' && result && !result[index] && solution[index]) return '#FCA5A5';
    // Anchors render as their true fill so Black stays black and White stays white.
    const up = c.toUpperCase();
    if (up === '#000000' || up === '#FFFFFF') return up;
    return '#FFFFFF';
  };

  const getPatternColor = (index: number): string | null => {
    if (phase === 'observation') return solution[index];
    if (phase === 'result' && result) {
      if (!result[index] && solution[index]) return null; // error state, no pattern
      return playerGrid[index];
    }
    if (phase === 'recall') return playerGrid[index];
    return null;
  };

  const getCircleBorder = (index: number): string => {
    const color = getCircleColor(index).toUpperCase();
    const displayWhite = shapes && color !== NEUTRAL && !(phase === 'result' && result && !result[index] && solution[index]);
    const mtaLightFill = mta && color !== NEUTRAL && !(phase === 'result' && result && !result[index] && solution[index]);
    if (color === '#FFFFFF' || color === '#FFF' || displayWhite || mtaLightFill) {
      if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
      return '2px solid #D1D5DB';
    }
    if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
    if (phase === 'result' && result && !result[index] && solution[index]) return '3px solid #DC2626';
    if (phase === 'recall' && selectedColor && !playerGrid[index]) return '2px dashed #9CA3AF';
    return '2px solid transparent';
  };

  const getGlowStyle = (index: number): React.CSSProperties => {
    if (!verifying || !result) return {};
    const isCorrect = result[index];
    const hasColor = solution[index] !== null || playerGrid[index] !== null;
    if (!hasColor) return {};
    return {
      boxShadow: isCorrect
        ? '0 0 20px 6px rgba(74, 222, 128, 0.5)'
        : '0 0 20px 6px rgba(248, 113, 113, 0.5)',
    };
  };

  /** Empty slots read as physical receptacles: inset shadow + dashed ring. */
  const getReceptacleStyle = (index: number): React.CSSProperties => {
    const isEmpty = !playerGrid[index] && (phase === 'recall' || phase === 'idle');
    if (!isEmpty) return {};
    return { boxShadow: 'inset 0 3px 8px rgba(15, 23, 42, 0.12), inset 0 -1px 2px rgba(255,255,255,0.6)' };
  };

  const getTileAnimation = (i: number) => {
    if (reduceMotion) return { rotateY: 0, scale: 1, x: 0, opacity: 1 };
    if (flipping) {
      return { rotateY: 180, transition: { duration: 0.4, delay: i * 0.04, ease: 'easeInOut' as const } };
    }
    const fx = tileFx?.[i];
    if (fx === 'fill') {
      return { rotateY: 0, opacity: 1, x: 0, scale: [0.9, 1.05, 1], transition: { duration: 0.28, ease: 'easeOut' as const } };
    }
    if (fx === 'clear') {
      return { rotateY: 0, scale: 1, opacity: [1, 0.25, 1], x: [0, -5, 5, -3, 0], transition: { duration: 0.26, ease: 'easeInOut' as const } };
    }
    if (fx === 'shake') {
      return { rotateY: 0, scale: 1, opacity: 1, x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.2, ease: 'easeInOut' as const } };
    }
    if (fx === 'ripple') {
      return { rotateY: 0, opacity: 1, x: 0, scale: [1, 1.14, 1], transition: { duration: 0.36, delay: i * 0.07, ease: 'easeOut' as const } };
    }
    if (verifying && result) {
      return { rotateY: 0, x: 0, opacity: 1, scale: [1, 1.08, 1], transition: { duration: 0.4, delay: i * 0.05 } };
    }
    return { rotateY: 0, scale: 1, x: 0, opacity: 1 };
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 max-w-[200px] mx-auto" style={{ perspective: 800 }}>
      {Array.from({ length: GRID_SIZE }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => onCircleClick(i)}
          disabled={phase !== 'recall'}
          animate={getTileAnimation(i)}
          whileHover={phase === 'recall' && !reduceMotion ? { scale: 1.05 } : {}}
          whileTap={phase === 'recall' && !reduceMotion ? { scale: 0.92 } : {}}
          className="aspect-square rounded-full transition-colors duration-300 ease-in-out cursor-pointer disabled:cursor-default relative overflow-hidden"
          style={{
          backgroundColor: getDisplayBackground(i),
            border: getCircleBorder(i),
            transformStyle: 'preserve-3d',
            ...getReceptacleStyle(i),
            ...getGlowStyle(i),
          }}
        >
          {a11y && <PatternOverlay colorHex={getPatternColor(i)} size="100%" />}
          {shapes && <ShapeOverlay colorHex={getPatternColor(i)} />}
          {mta && <MtaOverlay colorHex={getPatternColor(i)} />}
        </motion.button>
      ))}
    </div>
  );
}
