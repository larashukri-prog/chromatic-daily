import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** The 7 chromatic hex slots that flags can occupy (matches FLAG_SLOT_HEXES). */
const DEFAULT_HEXES = [
  '#EF4444', // Red
  '#FD9349', // Orange
  '#FDE047', // Yellow
  '#2DD4D4', // Teal
  '#8B5CF6', // Purple
  '#7AC00F', // Lime
  '#EC4899', // Pink
];

interface FifaPaletteCtx {
  /** Uppercase hexes of the colors currently in play (flag-eligible). */
  activeHexes: string[];
}

const Ctx = createContext<FifaPaletteCtx>({ activeHexes: DEFAULT_HEXES });

export function FifaPaletteProvider({
  activeHexes,
  children,
}: {
  activeHexes: string[] | undefined;
  children: ReactNode;
}) {
  const value = useMemo<FifaPaletteCtx>(() => {
    const list = (activeHexes && activeHexes.length ? activeHexes : DEFAULT_HEXES)
      .map((h) => h.toUpperCase());
    return { activeHexes: list };
  }, [activeHexes]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFifaPalette(): FifaPaletteCtx {
  return useContext(Ctx);
}

export const FIFA_DEFAULT_PALETTE_HEXES = DEFAULT_HEXES;