import { useMtaPalette } from '@/components/MtaPaletteContext';

/**
 * Official-ish NYC MTA subway bullet: filled brand-colored circle with a
 * bold white character centered inside. Pure inline SVG — no network,
 * no assets, no per-day rotation.
 */

/** 1:1 mapping of the 9 palette hexes to their MTA line character. */
export const MTA_LETTER_FOR_HEX: Record<string, string> = {
  '#D82233': '1',
  '#009952': '5',
  '#0062CF': 'A',
  '#EB6800': 'F',
  '#F6BC26': 'Q',
  '#7C858C': 'L',
  '#8E5C33': 'Z',
  '#799534': 'G',
  '#9A38A1': '7',
};

/** Palette hexes that can carry an MTA bullet (ordered to match COLORS). */
export const MTA_SLOT_HEXES: string[] = Object.keys(MTA_LETTER_FOR_HEX);

interface MtaOverlayProps {
  colorHex: string | null;
  className?: string;
}

export function MtaOverlay({ colorHex, className = '' }: MtaOverlayProps) {
  // Keep hook order stable across renders even though we do not depend on it.
  useMtaPalette();
  if (!colorHex) return null;
  const up = colorHex.toUpperCase();
  const letter = MTA_LETTER_FOR_HEX[up];
  if (!letter) return null;

  return (
    <span
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        width="86%"
        height="86%"
        role="presentation"
      >
        <circle cx="50" cy="50" r="48" fill={up} />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontWeight={800}
          fontSize="62"
          style={{ letterSpacing: '-0.02em' }}
        >
          {letter}
        </text>
      </svg>
    </span>
  );
}

/** Back-compat with the old flag-based overlay API. */
export const MTA_IMAGE_FOR_HEX_KEYS = [...MTA_SLOT_HEXES];