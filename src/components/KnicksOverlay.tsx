import basketball from '@/assets/knicks/mask.png.asset.json';
import brunson from '@/assets/knicks/mask_1.png.asset.json';
import towns from '@/assets/knicks/mask_2.png.asset.json';
import roundel from '@/assets/knicks/mask_4.png.asset.json';
import liberty from '@/assets/knicks/mask_5.png.asset.json';
import jersey11 from '@/assets/knicks/mask_6.png.asset.json';
import roundelAnunoby from '@/assets/knicks/roundel_anunoby.png.asset.json';
import portraitAnunoby from '@/assets/knicks/portrait_anunoby.png.asset.json';
import jersey8 from '@/assets/knicks/jersey_8.png.asset.json';
import anchorBlue from '@/assets/knicks/anchor_blue.png.asset.json';
import anchorOrange from '@/assets/knicks/anchor_orange.png.asset.json';

// 1:1 hex → Knicks image mapping for the 9 chromatic colors.
// Black/White anchors render as solid Knicks blue/orange (no image overlay).
export const KNICKS_IMAGE_FOR_HEX: Record<string, string> = {
  '#EF4444': basketball.url,  // Red — basketball
  '#FDE047': roundelAnunoby.url, // Yellow — ANUNOBY roundel
  '#2DD4D4': liberty.url,     // Teal — Statue of Liberty
  '#FD9349': jersey11.url,    // Orange — jersey 11
  '#8B5CF6': roundel.url,     // Purple — KNICKS circular logo
  '#7AC00F': brunson.url,     // Lime — player portrait
  '#3F6212': towns.url,       // DarkGreen — player portrait
  '#F198C4': portraitAnunoby.url, // Pink — Anunoby portrait
  '#2563EB': jersey8.url,     // Blue — jersey 8
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