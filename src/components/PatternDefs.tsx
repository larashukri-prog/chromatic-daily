import { COLORS } from '@/lib/game';

const LIGHT_COLORS = new Set(['#FDE047', '#BEF264', '#6EE7B7']);

export function getPatternStroke(hex: string): string {
  return LIGHT_COLORS.has(hex) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
}

export const PATTERN_IDS = [
  'pat-solid',
  'pat-vstripes',
  'pat-hstripes',
  'pat-diagonal',
  'pat-crosshatch',
  'pat-dots',
  'pat-checker',
  'pat-circles',
  'pat-zigzag',
];

export function getPatternId(colorHex: string): string {
  const idx = COLORS.findIndex((c) => c.hex === colorHex);
  if (idx === -1) return '';
  return PATTERN_IDS[idx];
}

export function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {COLORS.map((color, idx) => {
          const s = getPatternStroke(color.hex);
          const id = PATTERN_IDS[idx];

          switch (idx) {
            case 0: // Solid (transparent)
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent" />
                </pattern>
              );
            case 1: // Vertical Stripes
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12">
                  <line x1="3" y1="0" x2="3" y2="12" stroke={s} strokeWidth={2} />
                  <line x1="9" y1="0" x2="9" y2="12" stroke={s} strokeWidth={2} />
                </pattern>
              );
            case 2: // Horizontal Stripes
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12">
                  <line x1="0" y1="3" x2="12" y2="3" stroke={s} strokeWidth={2} />
                  <line x1="0" y1="9" x2="12" y2="9" stroke={s} strokeWidth={2} />
                </pattern>
              );
            case 3: // Diagonal 45°
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke={s} strokeWidth={2} />
                </pattern>
              );
            case 4: // Crosshatch
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12">
                  <line x1="0" y1="6" x2="12" y2="6" stroke={s} strokeWidth={1.5} />
                  <line x1="6" y1="0" x2="6" y2="12" stroke={s} strokeWidth={1.5} />
                </pattern>
              );
            case 5: // Polka Dots
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <circle cx="4" cy="4" r="2.5" fill={s} />
                  <circle cx="11" cy="11" r="2.5" fill={s} />
                </pattern>
              );
            case 6: // Checkerboard
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect x="0" y="0" width="5" height="5" fill={s} opacity="0.5" />
                  <rect x="5" y="5" width="5" height="5" fill={s} opacity="0.5" />
                </pattern>
              );
            case 7: // Concentric Circles
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="16" height="16">
                  <circle cx="8" cy="8" r="3" fill="none" stroke={s} strokeWidth={1.5} />
                  <circle cx="8" cy="8" r="7" fill="none" stroke={s} strokeWidth={1.5} />
                </pattern>
              );
            case 8: // Zigzag
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="10">
                  <polyline points="0,8 3,2 6,8 9,2 12,8" fill="none" stroke={s} strokeWidth={2} />
                </pattern>
              );
            default:
              return null;
          }
        })}
      </defs>
    </svg>
  );
}
