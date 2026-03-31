import { COLORS } from '@/lib/game';

const LIGHT_COLORS = new Set(['#FDE047', '#BEF264', '#6EE7B7']);

export function getPatternStroke(hex: string): string {
  return LIGHT_COLORS.has(hex) ? 'rgba(26,26,26,0.7)' : 'rgba(255,255,255,0.88)';
}

export const PATTERN_IDS = [
  'pattern-solid',
  'pattern-vertical-stripes',
  'pattern-horizontal-stripes',
  'pattern-diagonal-45',
  'pattern-crosshatch',
  'pattern-polka-dots',
  'pattern-checkerboard',
  'pattern-concentric-circles',
  'pattern-zigzag',
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

            case 1: // Vertical Stripes (bold)
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <line x1="3" y1="0" x2="3" y2="14" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
                  <line x1="10" y1="0" x2="10" y2="14" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
                </pattern>
              );

            case 2: // Horizontal Stripes (bold)
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <line x1="0" y1="3" x2="14" y2="3" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
                  <line x1="0" y1="10" x2="14" y2="10" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
                </pattern>
              );

            case 3: // Diagonal 45° (bold)
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="12" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
                </pattern>
              );

            case 4: // Thick Grid Lines
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <line x1="0" y1="0" x2="14" y2="0" stroke={s} strokeWidth={2.2} />
                  <line x1="0" y1="7" x2="14" y2="7" stroke={s} strokeWidth={2.2} />
                  <line x1="0" y1="14" x2="14" y2="14" stroke={s} strokeWidth={2.2} />
                  <line x1="0" y1="0" x2="0" y2="14" stroke={s} strokeWidth={2.2} />
                  <line x1="7" y1="0" x2="7" y2="14" stroke={s} strokeWidth={2.2} />
                  <line x1="14" y1="0" x2="14" y2="14" stroke={s} strokeWidth={2.2} />
                </pattern>
              );

            case 5: // Thick Dots
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="16" height="16">
                  <circle cx="4" cy="4" r="3.2" fill={s} />
                  <circle cx="12" cy="12" r="3.2" fill={s} />
                </pattern>
              );

            case 6: // Checkerboard
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12">
                  <rect x="0" y="0" width="6" height="6" fill={s} opacity="0.62" />
                  <rect x="6" y="6" width="6" height="6" fill={s} opacity="0.62" />
                </pattern>
              );

            case 7: // Concentric Circles
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="18" height="18">
                  <circle cx="9" cy="9" r="3.2" fill="none" stroke={s} strokeWidth={2} />
                  <circle cx="9" cy="9" r="7" fill="none" stroke={s} strokeWidth={2} />
                </pattern>
              );

            case 8: // Horizontal wave / zig-zag
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="12">
                  <polyline
                    points="0,4 3.5,0 7,4 10.5,0 14,4"
                    fill="none"
                    stroke={s}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="0,11 3.5,7 7,11 10.5,7 14,11"
                    fill="none"
                    stroke={s}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
