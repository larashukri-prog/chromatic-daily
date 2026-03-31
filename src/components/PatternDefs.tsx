import { COLORS } from '@/lib/game';

const LIGHT_COLORS = new Set(['#FDE047', '#BEF264', '#6EE7B7']);

export function getPatternStroke(hex: string): string {
  return LIGHT_COLORS.has(hex) ? 'rgba(26,26,26,0.75)' : 'rgba(255,255,255,0.9)';
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
            // 0 — Red: Solid (no visible pattern)
            case 0:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent" />
                </pattern>
              );

            // 1 — Yellow: Bold vertical stripes
            case 1:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="10" height="10">
                  <line x1="2.5" y1="0" x2="2.5" y2="10" stroke={s} strokeWidth={3.5} />
                  <line x1="7.5" y1="0" x2="7.5" y2="10" stroke={s} strokeWidth={3.5} />
                </pattern>
              );

            // 2 — Teal: Bold horizontal stripes
            case 2:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="10" height="10">
                  <line x1="0" y1="2.5" x2="10" y2="2.5" stroke={s} strokeWidth={3.5} />
                  <line x1="0" y1="7.5" x2="10" y2="7.5" stroke={s} strokeWidth={3.5} />
                </pattern>
              );

            // 3 — Orange: Bold diagonal stripes
            case 3:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke={s} strokeWidth={3} />
                </pattern>
              );

            // 4 — Purple: Thick grid lines
            case 4:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="12">
                  <line x1="0" y1="0.5" x2="12" y2="0.5" stroke={s} strokeWidth={2} />
                  <line x1="0" y1="6" x2="12" y2="6" stroke={s} strokeWidth={2} />
                  <line x1="0" y1="11.5" x2="12" y2="11.5" stroke={s} strokeWidth={2} />
                  <line x1="0.5" y1="0" x2="0.5" y2="12" stroke={s} strokeWidth={2} />
                  <line x1="6" y1="0" x2="6" y2="12" stroke={s} strokeWidth={2} />
                  <line x1="11.5" y1="0" x2="11.5" y2="12" stroke={s} strokeWidth={2} />
                </pattern>
              );

            // 5 — Lime: Big bold dots
            case 5:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <circle cx="4" cy="4" r="3.5" fill={s} />
                  <circle cx="11" cy="11" r="3.5" fill={s} />
                </pattern>
              );

            // 6 — Green: Big checkerboard
            case 6:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="14" height="14">
                  <rect x="0" y="0" width="7" height="7" fill={s} opacity="0.65" />
                  <rect x="7" y="7" width="7" height="7" fill={s} opacity="0.65" />
                </pattern>
              );

            // 7 — Pink: Large concentric circles
            case 7:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="20" height="20">
                  <circle cx="10" cy="10" r="4" fill="none" stroke={s} strokeWidth={2.5} />
                  <circle cx="10" cy="10" r="8.5" fill="none" stroke={s} strokeWidth={2.5} />
                </pattern>
              );

            // 8 — Blue: Dense bold zigzag waves
            case 8:
              return (
                <pattern key={id} id={id} patternUnits="userSpaceOnUse" width="12" height="14">
                  <polyline
                    points="0,4 3,0 6,4 9,0 12,4"
                    fill="none"
                    stroke={s}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="0,11 3,7 6,11 9,7 12,11"
                    fill="none"
                    stroke={s}
                    strokeWidth={3}
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
