import { getDailyMix, isDarkColor } from '@/lib/dailyMix';

interface MixedTileProps {
  /** Base color of the tile. Null renders nothing (empty slot). */
  colorHex: string | null;
  className?: string;
  /** Shape size relative to the tile. */
  shapeScale?: number;
}

/**
 * Universal tile decoration: subtle daily pattern wash + centered daily shape.
 * The base color is applied by the parent element's background.
 */
export function MixedTile({ colorHex, className = '', shapeScale = 0.52 }: MixedTileProps) {
  if (!colorHex) return null;
  const mix = getDailyMix();
  const patternId = mix.patternIdFor(colorHex);
  const Icon = mix.iconFor(colorHex);
  if (!patternId && !Icon) return null;
  const dark = isDarkColor(colorHex);
  const glyphColor = dark ? '#FFFFFF' : '#0F172A';

  return (
    <span
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-full ${className}`}
      aria-hidden
    >
      {patternId && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 96 96"
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: 0.45 }}
        >
          <circle cx="48" cy="48" r="48" fill={`url(#${patternId})`} />
        </svg>
      )}
      {Icon && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Icon
            style={{
              width: `${shapeScale * 100}%`,
              height: `${shapeScale * 100}%`,
              color: glyphColor,
              filter: dark
                ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))'
                : 'drop-shadow(0 1px 1px rgba(255,255,255,0.45))',
            }}
          />
        </span>
      )}
    </span>
  );
}
