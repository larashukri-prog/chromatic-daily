import { useId } from 'react';
import { getDailyPalette, hexLightness } from '@/lib/palette';

/**
 * MIX visual style — a distinct repeating SVG pattern per daily-palette slot.
 *
 * Both the colors (see lib/palette) and the pattern assignment rotate every
 * calendar day, so each day feels fresh. The 9 patterns shown on any given day
 * are drawn from different visual families, so no two tiles read alike.
 */

type Family = 'dot' | 'line' | 'grid' | 'radial' | 'organic';

interface PatternDef {
  id: string;
  name: string;
  family: Family;
  /** Tile cell size; omit for centre-relative (radial) patterns. */
  cell?: { w: number; h: number };
}

export const MIX_PATTERNS: PatternDef[] = [
  { id: 'dots', name: 'Polka Dots', family: 'dot', cell: { w: 16, h: 16 } },
  { id: 'confetti', name: 'Confetti Dots', family: 'dot', cell: { w: 20, h: 20 } },
  { id: 'crosses', name: 'Crosses', family: 'dot', cell: { w: 18, h: 18 } },
  { id: 'diagonal', name: 'Diagonal Stripes', family: 'line', cell: { w: 14, h: 14 } },
  { id: 'pinstripe', name: 'Vertical Pinstripes', family: 'line', cell: { w: 12, h: 12 } },
  { id: 'dashes', name: 'Horizontal Dashes', family: 'line', cell: { w: 16, h: 12 } },
  { id: 'zigzag', name: 'Zigzag Chevrons', family: 'line', cell: { w: 20, h: 12 } },
  { id: 'crosshatch', name: 'Square Grid', family: 'grid', cell: { w: 16, h: 16 } },
  { id: 'lattice', name: 'Diamond Lattice', family: 'grid', cell: { w: 18, h: 18 } },
  { id: 'checker', name: 'Checkerboard Mesh', family: 'grid', cell: { w: 16, h: 16 } },
  { id: 'bricks', name: 'Brickwork', family: 'grid', cell: { w: 24, h: 14 } },
  { id: 'weave', name: 'Basket Weave', family: 'grid', cell: { w: 20, h: 20 } },
  { id: 'triangles', name: 'Triangles', family: 'organic', cell: { w: 18, h: 16 } },
  { id: 'scales', name: 'Fish Scales', family: 'organic', cell: { w: 20, h: 12 } },
  { id: 'honeycomb', name: 'Honeycomb', family: 'organic', cell: { w: 24, h: 14 } },
  { id: 'waves', name: 'Concentric Waves', family: 'radial', cell: undefined },
  { id: 'starburst', name: 'Starburst', family: 'radial', cell: undefined },
  { id: 'spiral', name: 'Spiral Rings', family: 'radial', cell: undefined },
];

export const MIX_PATTERN_NAMES = MIX_PATTERNS.map((p) => p.name);

const OPACITY = 0.5;

// ------------------------------------------------------------ daily rotation

function dayKey(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic per-day mapping of palette slot (0-8) -> pattern id.
 * Picks 9 patterns spread across families so nothing on screen looks alike.
 */
export function getDailyPatternOrder(date: Date = new Date()): PatternDef[] {
  const rand = mulberry32(dayKey(date) * 2654435761 + 917);

  const byFamily = new Map<Family, PatternDef[]>();
  for (const p of MIX_PATTERNS) {
    const list = byFamily.get(p.family) ?? [];
    list.push(p);
    byFamily.set(p.family, list);
  }
  // Shuffle within each family so the specific member rotates day to day.
  for (const list of byFamily.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  const families = [...byFamily.keys()].sort();
  // Shuffle family order too.
  for (let i = families.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [families[i], families[j]] = [families[j], families[i]];
  }

  // Round-robin across families: guarantees maximum family spread before any
  // family repeats, so similar patterns never crowd a single day.
  const picked: PatternDef[] = [];
  let depth = 0;
  while (picked.length < 9) {
    let added = false;
    for (const f of families) {
      const list = byFamily.get(f)!;
      if (depth < list.length) {
        picked.push(list[depth]);
        added = true;
        if (picked.length === 9) break;
      }
    }
    if (!added) break;
    depth += 1;
  }

  // Shuffle the slot assignment so patterns move between colors each day.
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}

// -------------------------------------------------------------- pattern art

function PatternCell({ id, stroke }: { id: string; stroke: string }) {
  const s = {
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'dots':
      return (
        <>
          <circle cx="8" cy="8" r="3" fill={stroke} stroke="none" />
          <circle cx="0" cy="0" r="3" fill={stroke} stroke="none" />
          <circle cx="16" cy="0" r="3" fill={stroke} stroke="none" />
          <circle cx="0" cy="16" r="3" fill={stroke} stroke="none" />
          <circle cx="16" cy="16" r="3" fill={stroke} stroke="none" />
        </>
      );
    case 'confetti':
      return (
        <>
          <circle cx="4" cy="5" r="2.2" fill={stroke} stroke="none" />
          <circle cx="14" cy="3" r="1.4" fill={stroke} stroke="none" />
          <circle cx="9" cy="12" r="3" fill={stroke} stroke="none" />
          <circle cx="17" cy="15" r="2" fill={stroke} stroke="none" />
          <circle cx="2" cy="17" r="1.6" fill={stroke} stroke="none" />
        </>
      );
    case 'crosses':
      return (
        <>
          <line x1="9" y1="4" x2="9" y2="14" strokeWidth="2.4" {...s} />
          <line x1="4" y1="9" x2="14" y2="9" strokeWidth="2.4" {...s} />
          <line x1="0" y1="-5" x2="0" y2="5" strokeWidth="2.4" {...s} />
          <line x1="-5" y1="0" x2="5" y2="0" strokeWidth="2.4" {...s} />
          <line x1="18" y1="13" x2="18" y2="23" strokeWidth="2.4" {...s} />
          <line x1="13" y1="18" x2="23" y2="18" strokeWidth="2.4" {...s} />
        </>
      );
    case 'diagonal':
      return (
        <>
          <line x1="-4" y1="10" x2="10" y2="-4" strokeWidth="3" {...s} />
          <line x1="3" y1="17" x2="17" y2="3" strokeWidth="3" {...s} />
        </>
      );
    case 'pinstripe':
      return <line x1="3" y1="-1" x2="3" y2="13" strokeWidth="2.6" {...s} />;
    case 'dashes':
      return (
        <>
          <line x1="1" y1="3" x2="9" y2="3" strokeWidth="2.6" {...s} />
          <line x1="9" y1="9" x2="17" y2="9" strokeWidth="2.6" {...s} />
          <line x1="-7" y1="9" x2="1" y2="9" strokeWidth="2.6" {...s} />
        </>
      );
    case 'zigzag':
      return (
        <>
          <polyline points="-2,9 3,3 8,9 13,3 18,9 22,3" strokeWidth="2.6" {...s} />
          <polyline points="-2,15 3,9 8,15 13,9 18,15 22,9" strokeWidth="2.6" {...s} />
        </>
      );
    case 'crosshatch':
      return (
        <>
          <line x1="0" y1="0" x2="16" y2="0" strokeWidth="2.2" {...s} />
          <line x1="0" y1="0" x2="0" y2="16" strokeWidth="2.2" {...s} />
        </>
      );
    case 'lattice':
      return (
        <>
          <polygon points="9,1 17,9 9,17 1,9" strokeWidth="2.2" {...s} />
          <polygon points="0,-8 8,0 0,8 -8,0" strokeWidth="2.2" {...s} />
          <polygon points="18,-8 26,0 18,8 10,0" strokeWidth="2.2" {...s} />
          <polygon points="0,10 8,18 0,26 -8,18" strokeWidth="2.2" {...s} />
          <polygon points="18,10 26,18 18,26 10,18" strokeWidth="2.2" {...s} />
        </>
      );
    case 'checker':
      return (
        <>
          <rect x="0" y="0" width="8" height="8" fill={stroke} stroke="none" />
          <rect x="8" y="8" width="8" height="8" fill={stroke} stroke="none" />
        </>
      );
    case 'bricks':
      return (
        <>
          <line x1="0" y1="0" x2="24" y2="0" strokeWidth="2.2" {...s} />
          <line x1="0" y1="7" x2="24" y2="7" strokeWidth="2.2" {...s} />
          <line x1="0" y1="14" x2="24" y2="14" strokeWidth="2.2" {...s} />
          <line x1="6" y1="0" x2="6" y2="7" strokeWidth="2.2" {...s} />
          <line x1="18" y1="7" x2="18" y2="14" strokeWidth="2.2" {...s} />
        </>
      );
    case 'weave':
      return (
        <>
          <rect x="1" y="1" width="8" height="3.5" fill={stroke} stroke="none" />
          <rect x="1" y="6" width="8" height="3.5" fill={stroke} stroke="none" />
          <rect x="11" y="1" width="3.5" height="8" fill={stroke} stroke="none" />
          <rect x="16" y="1" width="3.5" height="8" fill={stroke} stroke="none" />
          <rect x="1" y="11" width="3.5" height="8" fill={stroke} stroke="none" />
          <rect x="6" y="11" width="3.5" height="8" fill={stroke} stroke="none" />
          <rect x="11" y="11" width="8" height="3.5" fill={stroke} stroke="none" />
          <rect x="11" y="16" width="8" height="3.5" fill={stroke} stroke="none" />
        </>
      );
    case 'triangles':
      return (
        <>
          <polygon points="9,2 16,14 2,14" strokeWidth="2.2" {...s} />
          <polygon points="0,18 7,30 -7,30" strokeWidth="2.2" {...s} />
          <polygon points="18,18 25,30 11,30" strokeWidth="2.2" {...s} />
        </>
      );
    case 'scales':
      return (
        <>
          <path d="M -10 12 A 10 10 0 0 1 10 12" strokeWidth="2.4" {...s} />
          <path d="M 10 12 A 10 10 0 0 1 30 12" strokeWidth="2.4" {...s} />
          <path d="M 0 24 A 10 10 0 0 1 20 24" strokeWidth="2.4" {...s} />
        </>
      );
    case 'honeycomb':
      return (
        <>
          <polygon points="6,0 14,0 18,7 14,14 6,14 2,7" strokeWidth="2.2" {...s} />
          <polygon points="18,0 26,0 30,7 26,14 18,14 14,7" strokeWidth="2.2" {...s} />
        </>
      );
    default:
      return null;
  }
}

function RadialPattern({ id, stroke }: { id: string; stroke: string }) {
  const s = {
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
  };
  if (id === 'waves') {
    return (
      <g {...s} strokeWidth="2.6">
        {[8, 18, 28, 38, 48, 58, 68].map((r) => (
          <circle key={r} cx="48" cy="48" r={r} />
        ))}
      </g>
    );
  }
  if (id === 'spiral') {
    const pts: string[] = [];
    for (let i = 0; i <= 260; i++) {
      const t = (i / 260) * Math.PI * 8;
      const r = 3 + (t / (Math.PI * 8)) * 66;
      pts.push(`${(48 + Math.cos(t) * r).toFixed(2)},${(48 + Math.sin(t) * r).toFixed(2)}`);
    }
    return (
      <g {...s} strokeWidth="2.6">
        <polyline points={pts.join(' ')} />
      </g>
    );
  }
  return (
    <g {...s} strokeWidth="2.6">
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI * 2) / 16;
        return (
          <line
            key={i}
            x1={48 + Math.cos(a) * 6}
            y1={48 + Math.sin(a) * 6}
            x2={48 + Math.cos(a) * 78}
            y2={48 + Math.sin(a) * 78}
          />
        );
      })}
    </g>
  );
}

interface MixOverlayProps {
  colorHex: string | null;
  className?: string;
}

export function MixOverlay({ colorHex, className = '' }: MixOverlayProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!colorHex) return null;
  const up = colorHex.toUpperCase();
  const palette = getDailyPalette();
  const order = getDailyPatternOrder();
  let index = palette.findIndex((c) => c.hex.toUpperCase() === up);
  if (index === -1) {
    // Colors stored from previous days: derive a stable pattern from the hex.
    const n = parseInt(up.replace('#', '').slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    index = n % order.length;
  }
  const def = order[index % order.length];
  if (!def) return null;
  const stroke = hexLightness(up) >= 0.6 ? 'rgba(15,23,42,1)' : 'rgba(255,255,255,1)';
  const cell = def.cell;
  const pid = `mixp-${uid}-${def.id}`;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 96 96"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g opacity={OPACITY}>
        {!cell ? (
          <RadialPattern id={def.id} stroke={stroke} />
        ) : (
          <>
            <defs>
              <pattern
                id={pid}
                patternUnits="userSpaceOnUse"
                width={cell.w}
                height={cell.h}
              >
                <PatternCell id={def.id} stroke={stroke} />
              </pattern>
            </defs>
            <rect x="0" y="0" width="96" height="96" fill={`url(#${pid})`} />
          </>
        )}
      </g>
    </svg>
  );
}
