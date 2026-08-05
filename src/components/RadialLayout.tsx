import type { CSSProperties, ReactNode } from 'react';
import { GRID_SIZE, CENTER_INDEX } from '@/lib/game';

/** Tile diameter as a fraction of the square container. */
const TILE_SCALE = 0.3;
/** Orbit radius of the ring nodes as a fraction of the container. */
const RING_RADIUS = 0.35;

/**
 * Center-anchored radial (hexagonal) board geometry.
 * Index 0-5 orbit clockwise from the top; index 6 is the center anchor.
 */
export function radialSlotStyle(index: number): CSSProperties {
  const isCenter = index === CENTER_INDEX;
  const angle = (Math.PI / 3) * index; // 60deg steps, 0 = top
  const cx = isCenter ? 0.5 : 0.5 + RING_RADIUS * Math.sin(angle);
  const cy = isCenter ? 0.5 : 0.5 - RING_RADIUS * Math.cos(angle);
  return {
    position: 'absolute',
    left: `${cx * 100}%`,
    top: `${cy * 100}%`,
    width: `${TILE_SCALE * 100}%`,
    height: `${TILE_SCALE * 100}%`,
    transform: 'translate(-50%, -50%)',
  };
}

interface RadialLayoutProps {
  /** Renders the visual node for a slot index (0-6). */
  children: (index: number) => ReactNode;
  /** Max width of the square container, e.g. "220px". */
  maxWidth?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Pure radial container: no grid, no gaps — 6 circles in an even orbit
 * around a single center anchor.
 */
export function RadialLayout({ children, maxWidth = '220px', className = '', style }: RadialLayoutProps) {
  return (
    <div
      className={`relative w-full aspect-square mx-auto ${className}`}
      style={{ maxWidth, ...style }}
    >
      {Array.from({ length: GRID_SIZE }).map((_, i) => (
        <div key={i} style={radialSlotStyle(i)}>
          {children(i)}
        </div>
      ))}
    </div>
  );
}
