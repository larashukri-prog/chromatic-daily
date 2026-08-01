import { createContext, useContext, useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

/** Single unified visual style: colors + daily rotating patterns. */
export type VisualTheme = 'mix';

export const VISUAL_THEME_OPTIONS: { value: VisualTheme; label: string }[] = [
  { value: 'mix', label: 'MIX' },
];

export function getVisualThemeLabel(_theme?: VisualTheme | string): string {
  return 'MIX';
}

const THEME_KEY = 'chromatic-visual-theme';

interface VisualThemeContextType {
  theme: VisualTheme;
  setTheme: (t: VisualTheme) => void;
  // Back-compat shim
  enabled: boolean;
  toggle: () => void;
}

const VisualThemeContext = createContext<VisualThemeContextType>({
  theme: 'mix',
  setTheme: () => {},
  enabled: true,
  toggle: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Migrate any legacy stored style (colors/patterns/shapes/mta/fifa) to MIX.
    try {
      localStorage.setItem(THEME_KEY, 'mix');
    } catch {}
    try {
      posthog.register({ visual_style: 'mix' });
    } catch {}
  }, []);

  return (
    <VisualThemeContext.Provider
      value={{ theme: 'mix', setTheme: () => {}, enabled: true, toggle: () => {} }}
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
