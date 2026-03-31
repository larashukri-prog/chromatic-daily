import { COLORS } from '@/lib/game';

const S = 'rgba(0,0,0,0.85)';

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
        {/* 0 — Solid (no pattern) */}
        <pattern id="pattern-solid" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="transparent" />
        </pattern>

        {/* 1 — Vertical Stripes */}
        <pattern id="pattern-vertical-stripes" patternUnits="userSpaceOnUse" width="24" height="24">
          <line x1="6" y1="0" x2="6" y2="24" stroke={S} strokeWidth={3.5} />
          <line x1="18" y1="0" x2="18" y2="24" stroke={S} strokeWidth={3.5} />
        </pattern>

        {/* 2 — Horizontal Stripes */}
        <pattern id="pattern-horizontal-stripes" patternUnits="userSpaceOnUse" width="24" height="24">
          <line x1="0" y1="6" x2="24" y2="6" stroke={S} strokeWidth={3.5} />
          <line x1="0" y1="18" x2="24" y2="18" stroke={S} strokeWidth={3.5} />
        </pattern>

        {/* 3 — Diagonal 45° */}
        <pattern id="pattern-diagonal-45" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="20" stroke={S} strokeWidth={3.5} />
        </pattern>

        {/* 4 — Crosshatch */}
        <pattern id="pattern-crosshatch" patternUnits="userSpaceOnUse" width="24" height="24">
          <line x1="0" y1="12" x2="24" y2="12" stroke={S} strokeWidth={3.5} />
          <line x1="12" y1="0" x2="12" y2="24" stroke={S} strokeWidth={3.5} />
        </pattern>

        {/* 5 — Polka Dots (single large centered circle) */}
        <pattern id="pattern-polka-dots" patternUnits="userSpaceOnUse" width="24" height="24">
          <circle cx="12" cy="12" r="5" fill={S} />
        </pattern>

        {/* 6 — Checkerboard */}
        <pattern id="pattern-checkerboard" patternUnits="userSpaceOnUse" width="24" height="24">
          <rect x="0" y="0" width="12" height="12" fill={S} opacity="0.65" />
          <rect x="12" y="12" width="12" height="12" fill={S} opacity="0.65" />
        </pattern>

        {/* 7 — Concentric Circles */}
        <pattern id="pattern-concentric-circles" patternUnits="userSpaceOnUse" width="32" height="32">
          <circle cx="16" cy="16" r="6" fill="none" stroke={S} strokeWidth={3.5} />
          <circle cx="16" cy="16" r="14" fill="none" stroke={S} strokeWidth={3.5} />
        </pattern>

        {/* 8 — Zigzag */}
        <pattern id="pattern-zigzag" patternUnits="userSpaceOnUse" width="24" height="24">
          <polyline
            points="0,8 6,2 12,8 18,2 24,8"
            fill="none"
            stroke={S}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="0,20 6,14 12,20 18,14 24,20"
            fill="none"
            stroke={S}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
    </svg>
  );
}
