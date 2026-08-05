import { motion, useReducedMotion } from 'framer-motion';
import { GamePhase, NEUTRAL, GRID_SIZE } from '@/lib/game';
import { MixedTile } from '@/components/MixedTile';
import { radialSlotStyle } from '@/components/RadialLayout';

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
  const reduceMotion = useReducedMotion();

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

  /** The base color fills the whole slot; pattern + shape layer on top. */
  const getDisplayBackground = (index: number): string => getCircleColor(index);

  const getMixColor = (index: number): string | null => {
    if (phase === 'observation') return solution[index];
    if (phase === 'result' && result) {
      if (!result[index] && solution[index]) return null; // error state, no overlay
      return playerGrid[index];
    }
    if (phase === 'recall') return playerGrid[index];
    return null;
  };

  const getCircleBorder = (index: number): string => {
    const color = getCircleColor(index).toUpperCase();
    if (color === '#FFFFFF' || color === '#FFF') {
      if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
      return '2px solid #D1D5DB';
    }
    if (phase === 'recall' && activeSlot === index) return '3px solid #000000';
    if (phase === 'result' && result && !result[index] && solution[index]) return '3px solid #DC2626';
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
    <div
      className="relative w-full aspect-square mx-auto max-w-[280px]"
      style={{ perspective: 800 }}
    >
      {Array.from({ length: GRID_SIZE }).map((_, i) => (
        <div key={i} style={radialSlotStyle(i)}>
          <motion.button
            onClick={() => onCircleClick(i)}
            disabled={phase !== 'recall'}
            animate={getTileAnimation(i)}
            whileHover={phase === 'recall' && !reduceMotion ? { scale: 1.05 } : {}}
            whileTap={phase === 'recall' && !reduceMotion ? { scale: 0.92 } : {}}
            className="absolute inset-0 w-full h-full rounded-full transition-colors duration-300 ease-in-out cursor-pointer disabled:cursor-default overflow-hidden"
            style={{
              backgroundColor: getDisplayBackground(i),
              border: getCircleBorder(i),
              transformStyle: 'preserve-3d',
              ...getReceptacleStyle(i),
              ...getGlowStyle(i),
            }}
          >
            <MixedTile colorHex={getMixColor(i)} />
          </motion.button>
        </div>
      ))}
    </div>
  );
}
