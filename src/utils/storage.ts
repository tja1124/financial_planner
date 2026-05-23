import type { AppData } from '../types';

export const STORAGE_KEY = 'finance_planner_data';

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
    return JSON.parse(raw) as AppData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
