import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type ThemePreference,
  loadThemePreference,
  saveThemePreference,
  applyThemeToDocument,
  getSystemDark,
} from '../utils/theme';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    loadThemePreference(),
  );
  const [systemDark, setSystemDark] = useState(() => getSystemDark());

  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    if (preference === 'system') return systemDark ? 'dark' : 'light';
    return preference;
  }, [preference, systemDark]);

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
    saveThemePreference(preference);
  }, [preference, resolvedTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
