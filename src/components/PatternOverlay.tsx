import { getPatternId } from '@/components/PatternDefs';

interface PatternOverlayProps {
  colorHex: string | null;
  size: number | string;
  className?: string;
}

/**
 * SVG circle overlay that shows an accessibility pattern on top of a colored circle.
 * Place this absolutely on top of the circle element.
 */
export function PatternOverlay({ colorHex, size, className = '' }: PatternOverlayProps) {
  if (!colorHex) return null;
  const patternId = getPatternId(colorHex);
  if (!patternId) return null;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="49" fill={`url(#${patternId})`} />
    </svg>
  );
}
