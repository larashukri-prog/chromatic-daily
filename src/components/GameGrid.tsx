import { motion } from 'framer-motion';
import { GamePhase, NEUTRAL } from '@/lib/game';

interface GameGridProps {
  phase: GamePhase;
  solution: (string | null)[];
  playerGrid: (string | null)[];
  result: boolean[] | null;
  selectedColor: string | null;
  verifying: boolean;
  onCircleClick: (index: number) => void;
}

export function GameGrid({ phase, solution, playerGrid, result, selectedColor, verifying, onCircleClick }: GameGridProps) {
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
          className="aspect-square rounded-full transition-colors duration-300 ease-in-out cursor-pointer disabled:cursor-default"
          style={{
            backgroundColor: getCircleColor(i),
            border: getCircleBorder(i),
            ...getGlowStyle(i),
          }}
        />
      ))}
    </div>
  );
}
