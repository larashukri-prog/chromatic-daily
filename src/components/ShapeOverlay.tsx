import {
  FaHeart, FaStar, FaCat, FaTree, FaMoon, FaFish, FaDroplet,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

// 1:1 hex → icon mapping for the six chromatic colors.
export const SHAPE_FOR_HEX: Record<string, IconType> = {
  '#EF4444': FaHeart,      // Red
  '#FD9349': FaTree,       // Orange
  '#FDE047': FaStar,       // Yellow
  '#2DD4D4': FaCat,        // Teal
  '#8B5CF6': FaMoon,       // Purple
  '#7AC00F': FaFish,       // Lime
  '#EC4899': FaDroplet,    // Pink
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
