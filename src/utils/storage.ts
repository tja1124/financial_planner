import type { AppData } from '../types';

export const STORAGE_KEY = 'finance_planner_data';
export const ONBOARDING_KEY = 'finance_planner_onboarding_complete';
export const LAST_SAVED_KEY = 'finance_planner_last_saved';

export const DATA_VERSION = 1;

export const defaultData: AppData = {
  income: [],
  expenses: [],
  debts: [],
  savingsGoals: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AppData;
    return validateAppData(parsed) ? parsed : defaultData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const timestamp = new Date().toISOString();
  localStorage.setItem(LAST_SAVED_KEY, timestamp);
}

export function getLastSaved(): string | null {
  return localStorage.getItem(LAST_SAVED_KEY);
}

export function formatLastSaved(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function clearAllStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_SAVED_KEY);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function hasAnyData(data: AppData): boolean {
  return (
    data.income.length > 0 ||
    data.expenses.length > 0 ||
    data.debts.length > 0 ||
    data.savingsGoals.length > 0
  );
}

export function validateAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const d = value as Record<string, unknown>;
  return (
    Array.isArray(d.income) &&
    Array.isArray(d.expenses) &&
    Array.isArray(d.debts) &&
    Array.isArray(d.savingsGoals)
  );
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  app: string;
  data: AppData;
}

export function buildExportPayload(data: AppData): ExportPayload {
  return {
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FinancePlanner',
    data,
  };
}

export function downloadJsonExport(data: AppData): void {
  const payload = buildExportPayload(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `finance-planner-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(text: string): AppData | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (validateAppData(parsed)) return parsed;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      validateAppData((parsed as ExportPayload).data)
    ) {
      return (parsed as ExportPayload).data;
    }
    return null;
  } catch {
    return null;
  }
}
