import { getDailyPalette, hexLightness } from '@/lib/palette';

/**
 * MIX visual style — a distinct geometric glyph per daily-palette slot.
 * Glyphs are keyed by palette index (not hex) so they stay stable while the
 * OKLCH colors change every day.
 */

export const MIX_SHAPE_NAMES = [
  'Circle',
  'Square',
  'Triangle',
  'Diamond',
  'Cross',
  'Diagonal Hatch',
  'Rings',
  'Star',
  'Chevron',
] as const;

const SW = 6; // stroke width in the 96x96 viewBox

function Glyph({ index, stroke }: { index: number; stroke: string }) {
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: SW,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (index) {
    case 0:
      return <circle cx="48" cy="48" r="20" {...common} />;
    case 1:
      return <rect x="28" y="28" width="40" height="40" rx="3" {...common} />;
    case 2:
      return <polygon points="48,26 70,68 26,68" {...common} />;
    case 3:
      return <polygon points="48,22 74,48 48,74 22,48" {...common} />;
    case 4:
      return (
        <g {...common}>
          <line x1="48" y1="24" x2="48" y2="72" />
          <line x1="24" y1="48" x2="72" y2="48" />
        </g>
      );
    case 5:
      return (
        <g {...common}>
          <line x1="20" y1="52" x2="44" y2="28" />
          <line x1="32" y1="64" x2="64" y2="32" />
          <line x1="52" y1="68" x2="76" y2="44" />
        </g>
      );
    case 6:
      return (
        <g {...common}>
          <circle cx="48" cy="48" r="11" />
          <circle cx="48" cy="48" r="24" />
        </g>
      );
    case 7:
      return (
        <polygon
          points="48,22 56,42 77,42 60,55 66,75 48,63 30,75 36,55 19,42 40,42"
          {...common}
        />
      );
    case 8:
      return (
        <g {...common}>
          <polyline points="28,40 48,58 68,40" />
          <polyline points="28,62 48,80 68,62" transform="translate(0,-12)" />
        </g>
      );
    default:
      return null;
  }
}

interface MixOverlayProps {
  colorHex: string | null;
  className?: string;
}

export function MixOverlay({ colorHex, className = '' }: MixOverlayProps) {
  if (!colorHex) return null;
  const up = colorHex.toUpperCase();
  const palette = getDailyPalette();
  let index = palette.findIndex((c) => c.hex.toUpperCase() === up);
  if (index === -1) {
    // Colors stored from previous days: derive a stable glyph from the hex.
    const n = parseInt(up.replace('#', '').slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    index = n % MIX_SHAPE_NAMES.length;
  }
  const stroke = hexLightness(up) >= 0.6 ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.95)';

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 96 96"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <Glyph index={index} stroke={stroke} />
    </svg>
  );
}