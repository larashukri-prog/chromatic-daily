import basketball from '@/assets/knicks/mask.png.asset.json';
import brunson from '@/assets/knicks/mask_1.png.asset.json';
import towns from '@/assets/knicks/mask_2.png.asset.json';
import wordmark from '@/assets/knicks/mask_3.png.asset.json';
import roundel from '@/assets/knicks/mask_4.png.asset.json';
import liberty from '@/assets/knicks/mask_5.png.asset.json';
import jersey11 from '@/assets/knicks/mask_6.png.asset.json';
import portrait23 from '@/assets/knicks/mask_7.png.asset.json';
import jersey23 from '@/assets/knicks/mask_8.png.asset.json';
import anchorBlue from '@/assets/knicks/anchor_blue.png.asset.json';
import anchorOrange from '@/assets/knicks/anchor_orange.png.asset.json';

// 1:1 hex → Knicks image mapping for the 9 chromatic colors.
// Black/White anchors render as solid Knicks blue/orange (no image overlay).
export const KNICKS_IMAGE_FOR_HEX: Record<string, string> = {
  '#EF4444': basketball.url,  // Red — basketball
  '#FDE047': wordmark.url,    // Yellow — KNICKS wordmark roundel
  '#2DD4D4': liberty.url,     // Teal — Statue of Liberty
  '#FD9349': jersey11.url,    // Orange — jersey 11
  '#8B5CF6': roundel.url,     // Purple — KNICKS circular logo
  '#7AC00F': brunson.url,     // Lime — player portrait
  '#3F6212': towns.url,       // DarkGreen — player portrait
  '#F198C4': portrait23.url,  // Pink — player portrait
  '#2563EB': jersey23.url,    // Blue — jersey 23
  '#000000': anchorBlue.url,  // Black anchor → blue Knicks PNG
  '#FFFFFF': anchorOrange.url, // White anchor → orange Knicks PNG
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
      style={{ objectPosition: 'center' }}
      className={`absolute inset-0 w-full h-full object-contain rounded-full pointer-events-none ${className}`}
    />
  );
}