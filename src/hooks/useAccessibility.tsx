import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

export type VisualTheme = 'colors' | 'patterns' | 'shapes' | 'knicks';

export const VISUAL_THEME_OPTIONS: { value: VisualTheme; label: string }[] = [
  { value: 'colors', label: 'Colors' },
  { value: 'patterns', label: 'Patterns' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'knicks', label: 'Knicks' },
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
    if (stored === 'colors' || stored === 'patterns' || stored === 'shapes' || stored === 'knicks') return stored;
    // Migrate legacy boolean
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'true') return 'patterns';
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
    setThemeState((prev) => (prev === 'patterns' ? 'colors' : 'patterns'));

  return (
    <VisualThemeContext.Provider
      value={{ theme, setTheme, enabled: theme === 'patterns', toggle }}
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
