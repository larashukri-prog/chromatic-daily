import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** The 9 chromatic hex slots that carry MTA subway bullets. */
const DEFAULT_HEXES = [
  '#D82233', // 1
  '#009952', // 5
  '#0062CF', // A
  '#EB6800', // F
  '#F6BC26', // Q
  '#7C858C', // L
  '#8E5C33', // Z
  '#799534', // G
  '#9A38A1', // 7
];

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