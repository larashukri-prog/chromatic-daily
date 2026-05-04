import {
  FaHeart, FaStar, FaCat, FaTree, FaMoon,
  FaFish, FaGhost, FaDroplet, FaSnowflake,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

// 1:1 hex → icon mapping for the 9 chromatic colors.
// Black and White anchors intentionally have no icon — they render as
// solid black / solid white cells to match Colors mode and reduce
// cognitive load in Shapes mode.
export const SHAPE_FOR_HEX: Record<string, IconType> = {
  '#EF4444': FaHeart,      // Red
  '#FDE047': FaStar,       // Yellow
  '#2DD4D4': FaCat,        // Teal
  '#FD9349': FaTree,       // Orange
  '#8B5CF6': FaMoon,       // Purple
  '#7AC00F': FaFish,       // Lime
  '#3F6212': FaGhost,      // Dark Green
  '#F198C4': FaDroplet,    // Pink
  '#2563EB': FaSnowflake,  // Blue
};

interface ShapeOverlayProps {
  colorHex: string | null;
  className?: string;
}

/** Solid black icon centered at ~60% of the parent button. */
export function ShapeOverlay({ colorHex, className = '' }: ShapeOverlayProps) {
  if (!colorHex) return null;
  const Icon = SHAPE_FOR_HEX[colorHex.toUpperCase()] ?? SHAPE_FOR_HEX[colorHex];
  if (!Icon) return null;
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      aria-hidden
    >
      <Icon style={{ width: '60%', height: '60%', color: '#000000' }} />
    </span>
  );
}
