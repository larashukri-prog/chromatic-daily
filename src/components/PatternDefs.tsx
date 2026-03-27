// SVG pattern definitions for accessibility mode
// 9 unique patterns mapped to the 9 possible colors

import { COLORS } from '@/lib/game';

// Light colors get dark strokes, dark colors get white strokes
const LIGHT_COLORS = ['#FDE047', '#BEF264', '#6EE7B7'];

export function getPatternStroke(hex: string): string {
  return LIGHT_COLORS.includes(hex) ? '#1a1a1a' : '#ffffff';
}

// Each color index maps to a unique pattern ID
export const PATTERN_IDS = [
  'pat-solid',        // 0 - Red
  'pat-vstripes',     // 1 - Yellow
  'pat-hstripes',     // 2 - Teal
  'pat-diagonal',     // 3 - Orange
  'pat-crosshatch',   // 4 - Purple
  'pat-dots',         // 5 - Lime
  'pat-checker',      // 6 - Green
  'pat-circles',      // 7 - Pink
  'pat-zigzag',       // 8 - Blue
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
          const stroke = getPatternStroke(color.hex);
          const id = PATTERN_IDS[idx];
          const sw = 2; // stroke width

          switch (idx) {
            case 0: // Solid - no pattern needed, just a filled rect
              return (
                <pattern key={id} id={id} width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect width="10" height="10" fill={stroke} opacity="0.3" />
                </pattern>
              );
            case 1: // Vertical Stripes
              return (
                <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                  <line x1="4" y1="0" x2="4" y2="8" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                </pattern>
              );
            case 2: // Horizontal Stripes
              return (
                <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="4" x2="8" y2="4" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                </pattern>
              );
            case 3: // Diagonal 45°
              return (
                <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="8" x2="8" y2="0" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                </pattern>
              );
            case 4: // Cross-hatch
              return (
                <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="4" x2="8" y2="4" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                  <line x1="4" y1="0" x2="4" y2="8" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                </pattern>
              );
            case 5: // Polka Dots
              return (
                <pattern key={id} id={id} width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="2" fill={stroke} opacity="0.3" />
                </pattern>
              );
            case 6: // Checkerboard
              return (
                <pattern key={id} id={id} width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" fill={stroke} opacity="0.3" />
                  <rect x="4" y="4" width="4" height="4" fill={stroke} opacity="0.3" />
                </pattern>
              );
            case 7: // Concentric Circles
              return (
                <pattern key={id} id={id} width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="6" cy="6" r="4" fill="none" stroke={stroke} strokeWidth={sw} opacity="0.3" />
                  <circle cx="6" cy="6" r="1.5" fill="none" stroke={stroke} strokeWidth={1} opacity="0.3" />
                </pattern>
              );
            case 8: // Zig-Zag
              return (
                <pattern key={id} id={id} width="12" height="8" patternUnits="userSpaceOnUse">
                  <polyline
                    points="0,6 3,2 6,6 9,2 12,6"
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    opacity="0.3"
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
