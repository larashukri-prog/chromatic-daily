import { useMtaPalette } from '@/components/MtaPaletteContext';
import { MTA_COLORS } from '@/lib/game';

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

/** Per-line text color: Q (yellow) uses black; all others use white. */
export const MTA_TEXT_COLOR_FOR_HEX: Record<string, string> = {
  '#D82233': '#FFFFFF',
  '#009952': '#FFFFFF',
  '#0062CF': '#FFFFFF',
  '#EB6800': '#FFFFFF',
  '#F6BC26': '#000000',
  '#7C858C': '#FFFFFF',
  '#8E5C33': '#FFFFFF',
  '#799534': '#FFFFFF',
  '#9A38A1': '#FFFFFF',
};

/** Palette hexes that can carry an MTA bullet (ordered to match MTA_COLORS). */
export const MTA_SLOT_HEXES: string[] = MTA_COLORS.map((c) => c.hex);

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
  const textFill = MTA_TEXT_COLOR_FOR_HEX[up] ?? '#FFFFFF';

  return (
    <span
      className={`absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        role="presentation"
        shapeRendering="geometricPrecision"
      >
        <circle cx="50" cy="50" r="50" fill={up} stroke="none" />
        <foreignObject x="0" y="0" width="100" height="100">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textFill,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 800,
              fontSize: '62px',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              // Optical nudge so glyphs sit visually centered against the circle's
              // cap-height/baseline, not the em-box.
              paddingTop: '2px',
            }}
          >
            {letter}
          </div>
        </foreignObject>
      </svg>
    </span>
  );
}

/** Back-compat with the old flag-based overlay API. */
export const MTA_IMAGE_FOR_HEX_KEYS = [...MTA_SLOT_HEXES];