import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'chromatic-accessibility';

interface AccessibilityContextType {
  enabled: boolean;
  toggle: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  enabled: false,
  toggle: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const toggle = () => setEnabled((prev) => !prev);

  return (
    <AccessibilityContext.Provider value={{ enabled, toggle }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
