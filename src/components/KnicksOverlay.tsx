import basketball from '@/assets/knicks/basketball.jpg';
import wordmark from '@/assets/knicks/wordmark.png';
import liberty from '@/assets/knicks/liberty.jpg';
import jersey11 from '@/assets/knicks/jersey11.png';
import roundel from '@/assets/knicks/roundel.png';
import arena from '@/assets/knicks/arena.jpg';
import skyline from '@/assets/knicks/skyline.jpg';
import nymonogram from '@/assets/knicks/nymonogram.png';
import player from '@/assets/knicks/player.jpg';

// 1:1 hex → Knicks image mapping for the 9 chromatic colors.
// Black/White anchors render as solid Knicks blue/orange (no image overlay).
export const KNICKS_IMAGE_FOR_HEX: Record<string, string> = {
  '#EF4444': basketball,    // Red
  '#FDE047': wordmark,      // Yellow
  '#2DD4D4': liberty,       // Teal
  '#FD9349': jersey11,      // Orange
  '#8B5CF6': roundel,       // Purple
  '#7AC00F': arena,         // Lime
  '#3F6212': skyline,       // Dark Green
  '#F198C4': nymonogram,    // Pink
  '#2563EB': player,        // Blue
};

interface KnicksOverlayProps {
  colorHex: string | null;
  className?: string;
}

/** Circular image overlay covering the full button. */
export function KnicksOverlay({ colorHex, className = '' }: KnicksOverlayProps) {
  if (!colorHex) return null;
  const src = KNICKS_IMAGE_FOR_HEX[colorHex.toUpperCase()] ?? KNICKS_IMAGE_FOR_HEX[colorHex];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className={`absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none ${className}`}
    />
  );
}