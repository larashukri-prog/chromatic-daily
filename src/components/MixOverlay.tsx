import { useId } from 'react';
import { getDailyPalette, hexLightness } from '@/lib/palette';

/**
 * MIX visual style — a distinct repeating SVG pattern per daily-palette slot.
 * Patterns are keyed by palette index (not hex) so they stay stable while the
 * OKLCH colors change every day.
 */

export const MIX_PATTERN_NAMES = [
  'Polka Dots',
  'Diagonal Stripes',
  'Square Grid',
  'Concentric Waves',
  'Vertical Pinstripes',
  'Diamond Lattice',
  'Checkerboard Mesh',
  'Horizontal Dashes',
  'Starburst',
] as const;

const OPACITY = 0.5;

/** The repeating cell for pattern indices that tile. */
function PatternCell({ index, stroke }: { index: number; stroke: string }) {
  const s = {
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (index) {
    case 0: // Polka Dots — 16x16 cell
      return (
        <>
          <circle cx="8" cy="8" r="3" fill={stroke} stroke="none" />
          <circle cx="0" cy="0" r="3" fill={stroke} stroke="none" />
          <circle cx="16" cy="0" r="3" fill={stroke} stroke="none" />
          <circle cx="0" cy="16" r="3" fill={stroke} stroke="none" />
          <circle cx="16" cy="16" r="3" fill={stroke} stroke="none" />
        </>
      );
    case 1: // Diagonal Stripes (45°) — 14x14 cell
      return (
        <>
          <line x1="-4" y1="10" x2="10" y2="-4" strokeWidth="3" {...s} />
          <line x1="3" y1="17" x2="17" y2="3" strokeWidth="3" {...s} />
        </>
      );
    case 2: // Square Grid / Crosshatch — 16x16 cell
      return (
        <>
          <line x1="0" y1="0" x2="16" y2="0" strokeWidth="2.2" {...s} />
          <line x1="0" y1="0" x2="0" y2="16" strokeWidth="2.2" {...s} />
        </>
      );
    case 4: // Vertical Pinstripes — 12x12 cell
      return <line x1="3" y1="-1" x2="3" y2="13" strokeWidth="2.6" {...s} />;
    case 5: // Diamond Lattice — 18x18 cell
      return (
        <>
          <polygon points="9,1 17,9 9,17 1,9" strokeWidth="2.2" {...s} />
          <polygon points="0,-8 8,0 0,8 -8,0" strokeWidth="2.2" {...s} />
          <polygon points="18,-8 26,0 18,8 10,0" strokeWidth="2.2" {...s} />
          <polygon points="0,10 8,18 0,26 -8,18" strokeWidth="2.2" {...s} />
          <polygon points="18,10 26,18 18,26 10,18" strokeWidth="2.2" {...s} />
        </>
      );
    case 6: // Checkerboard Mesh — 16x16 cell
      return (
        <>
          <rect x="0" y="0" width="8" height="8" fill={stroke} stroke="none" />
          <rect x="8" y="8" width="8" height="8" fill={stroke} stroke="none" />
        </>
      );
    case 7: // Horizontal Dashes — 16x12 cell
      return (
        <>
          <line x1="1" y1="3" x2="9" y2="3" strokeWidth="2.6" {...s} />
          <line x1="9" y1="9" x2="17" y2="9" strokeWidth="2.6" {...s} />
          <line x1="-7" y1="9" x2="1" y2="9" strokeWidth="2.6" {...s} />
        </>
      );
    default:
      return null;
  }
}

const CELL: Record<number, { w: number; h: number }> = {
  0: { w: 16, h: 16 },
  1: { w: 14, h: 14 },
  2: { w: 16, h: 16 },
  4: { w: 12, h: 12 },
  5: { w: 18, h: 18 },
  6: { w: 16, h: 16 },
  7: { w: 16, h: 12 },
};

/** Patterns drawn relative to the tile centre rather than tiled. */
function RadialPattern({ index, stroke }: { index: number; stroke: string }) {
  const s = {
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
  };
  if (index === 3) {
    // Concentric Waves / Ripples
    return (
      <g {...s} strokeWidth="2.6">
        {[8, 18, 28, 38, 48, 58, 68].map((r) => (
          <circle key={r} cx="48" cy="48" r={r} />
        ))}
      </g>
    );
  }
  // Starburst / Radial Lines
  return (
    <g {...s} strokeWidth="2.6">
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI * 2) / 16;
        return (
          <line
            key={i}
            x1={48 + Math.cos(a) * 6}
            y1={48 + Math.sin(a) * 6}
            x2={48 + Math.cos(a) * 78}
            y2={48 + Math.sin(a) * 78}
          />
        );
      })}
    </g>
  );
}

interface MixOverlayProps {
  colorHex: string | null;
  className?: string;
}

export function MixOverlay({ colorHex, className = '' }: MixOverlayProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!colorHex) return null;
  const up = colorHex.toUpperCase();
  const palette = getDailyPalette();
  let index = palette.findIndex((c) => c.hex.toUpperCase() === up);
  if (index === -1) {
    // Colors stored from previous days: derive a stable pattern from the hex.
    const n = parseInt(up.replace('#', '').slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    index = n % MIX_PATTERN_NAMES.length;
  }
  const stroke = hexLightness(up) >= 0.6 ? 'rgba(15,23,42,1)' : 'rgba(255,255,255,1)';
  const radial = index === 3 || index === 8;
  const cell = CELL[index];
  const pid = `mixp-${uid}-${index}`;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 96 96"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g opacity={OPACITY}>
        {radial || !cell ? (
          <RadialPattern index={index} stroke={stroke} />
        ) : (
          <>
            <defs>
              <pattern
                id={pid}
                patternUnits="userSpaceOnUse"
                width={cell.w}
                height={cell.h}
              >
                <PatternCell index={index} stroke={stroke} />
              </pattern>
            </defs>
            <rect x="0" y="0" width="96" height="96" fill={`url(#${pid})`} />
          </>
        )}
      </g>
    </svg>
  );
}
