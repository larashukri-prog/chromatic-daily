import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

export type VisualTheme = 'colors' | 'mix';

export const VISUAL_THEME_OPTIONS: { value: VisualTheme; label: string }[] = [
  { value: 'colors', label: 'Color Only' },
  { value: 'mix', label: 'MIX' },
];

export function getVisualThemeLabel(theme: VisualTheme): string {
  return VISUAL_THEME_OPTIONS.find((o) => o.value === theme)?.label ?? theme;
}

const THEME_KEY = 'chromatic-visual-theme';
const LEGACY_KEY = 'chromatic-accessibility';

interface VisualThemeContextType {
  theme: VisualTheme;
  setTheme: (t: VisualTheme) => void;
  // Back-compat shim
  enabled: boolean;
  toggle: () => void;
}

const VisualThemeContext = createContext<VisualThemeContextType>({
  theme: 'colors',
  setTheme: () => {},
  enabled: false,
  toggle: () => {},
});

function loadInitial(): VisualTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'colors' || stored === 'mix') return stored;
    // Migrate legacy pattern/shape/MTA/FIFA styles onto MIX.
    if (
      stored === 'patterns' ||
      stored === 'shapes' ||
      stored === 'mta' ||
      stored === 'fifa' ||
      stored === 'knicks'
    ) {
      return 'mix';
    }
    // Migrate legacy boolean
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'true') return 'mix';
    return 'colors';
  } catch {
    return 'colors';
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<VisualTheme>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    try {
      posthog.register({ visual_style: theme });
    } catch {}
  }, [theme]);

  const setTheme = (t: VisualTheme) => setThemeState(t);
  const toggle = () =>
    setThemeState((prev) => (prev === 'mix' ? 'colors' : 'mix'));

  return (
    <VisualThemeContext.Provider
      value={{ theme, setTheme, enabled: theme === 'mix', toggle }}
    >
      {children}
    </VisualThemeContext.Provider>
  );
}

export function useAccessibility() {
  const { enabled, toggle } = useContext(VisualThemeContext);
  return { enabled, toggle };
}

export function useVisualTheme() {
  const { theme, setTheme } = useContext(VisualThemeContext);
  return { theme, setTheme };
}
