import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MTA_COLORS } from '@/lib/game';

/** The 9 MTA subway-line hex slots that carry bullets. */
const DEFAULT_HEXES = MTA_COLORS.map((c) => c.hex);

interface MtaPaletteCtx {
  activeHexes: string[];
}

const Ctx = createContext<MtaPaletteCtx>({ activeHexes: DEFAULT_HEXES });

export function MtaPaletteProvider({
  activeHexes,
  children,
}: {
  activeHexes: string[] | undefined;
  children: ReactNode;
}) {
  const value = useMemo<MtaPaletteCtx>(() => {
    const list = (activeHexes && activeHexes.length ? activeHexes : DEFAULT_HEXES)
      .map((h) => h.toUpperCase());
    return { activeHexes: list };
  }, [activeHexes]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMtaPalette(): MtaPaletteCtx {
  return useContext(Ctx);
}

export const MTA_DEFAULT_PALETTE_HEXES = DEFAULT_HEXES;