import { motion } from 'framer-motion';
import { GamePhase, NEUTRAL } from '@/lib/game';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PatternOverlay } from '@/components/PatternOverlay';

interface GameGridProps {
  phase: GamePhase;
  solution: (string | null)[];
  playerGrid: (string | null)[];
  result: boolean[] | null;
  selectedColor: string | null;
  verifying: boolean;
  activeSlot?: number | null;
  onCircleClick: (index: number) => void;
}

export function GameGrid({ phase, solution, playerGrid, result, selectedColor, verifying, activeSlot, onCircleClick }: GameGridProps) {
  const { enabled: a11y } = useAccessibility();

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

  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-5 max-w-[280px] mx-auto">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => onCircleClick(i)}
          disabled={phase !== 'recall'}
          animate={
            verifying && result
              ? {
                  scale: [1, 1.08, 1],
                  transition: { duration: 0.4, delay: i * 0.05 },
                }
              : {}
          }
          whileHover={phase === 'recall' ? { scale: 1.05 } : {}}
          whileTap={phase === 'recall' ? { scale: 0.95 } : {}}
          className="aspect-square rounded-full transition-colors duration-300 ease-in-out cursor-pointer disabled:cursor-default relative overflow-hidden"
          style={{
            backgroundColor: getCircleColor(i),
            border: getCircleBorder(i),
            ...getGlowStyle(i),
          }}
        >
          {a11y && <PatternOverlay colorHex={getPatternColor(i)} size="100%" />}
        </motion.button>
      ))}
    </div>
  );
}
