import {
  FaHeart, FaStar, FaCat, FaTree, FaMoon, FaFish, FaDroplet, FaBolt, FaLeaf,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

// 1:1 hex → icon mapping for the nine MTA palette colors.
export const SHAPE_FOR_HEX: Record<string, IconType> = {
  '#D82233': FaHeart,      // 1 — red
  '#009952': FaTree,       // 5 — green
  '#0062CF': FaCat,        // A — blue
  '#EB6800': FaStar,       // F — orange
  '#F6BC26': FaFish,       // Q — yellow
  '#7C858C': FaMoon,       // L — grey
  '#8E5C33': FaLeaf,       // Z — brown
  '#799534': FaDroplet,    // G — olive
  '#9A38A1': FaBolt,       // 7 — purple
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
