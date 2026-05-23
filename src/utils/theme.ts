export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'finance_planner_theme';

export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'system';
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return getSystemDark() ? 'dark' : 'light';
  }
  return preference;
}

export function applyThemeToDocument(resolved: 'light' | 'dark'): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

/** Run before React paint to avoid flash */
export function initThemeFromStorage(): ThemePreference {
  const preference = loadThemePreference();
  applyThemeToDocument(resolveTheme(preference));
  return preference;
}
