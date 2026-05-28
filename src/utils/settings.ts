import type { AppSettings, CurrencyCode } from '../types';

export const SETTINGS_STORAGE_KEY = 'finance_planner_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  weekStartsOn: 0,
  compactMode: false,
  reducedMotion: false,
  exportIncludeTimestamp: true,
  acknowledgedInsightIds: [],
  availableCash: 0,
};

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'CAD', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      acknowledgedInsightIds: Array.isArray(parsed.acknowledgedInsightIds)
        ? parsed.acknowledgedInsightIds.filter((id): id is string => typeof id === 'string')
        : [],
      availableCash:
        typeof parsed.availableCash === 'number' && parsed.availableCash >= 0
          ? parsed.availableCash
          : 0,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function applySettingsToDocument(settings: AppSettings): void {
  document.documentElement.classList.toggle('compact', settings.compactMode);
  document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
}
