import type { AppData, EmergencyFund, Expense, SavingsGoal } from '../types';

export const EMERGENCY_FUND_ID = 'emergency-fund' as const;

const EMERGENCY_NAME_PATTERN = /emergency|rainy\s*day/i;

export function isEmergencyGoalName(name: string): boolean {
  return EMERGENCY_NAME_PATTERN.test(name.trim());
}

/** Recurring monthly obligations — excludes one-time planned expenses. */
export function monthlyCoreExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => !e.isPlannedExpense)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function defaultEmergencyTarget(expenses: Expense[]): number {
  return monthlyCoreExpenses(expenses) * 3;
}

export function createEmptyEmergencyFund(expenses: Expense[]): EmergencyFund {
  return {
    id: EMERGENCY_FUND_ID,
    name: 'Emergency Fund',
    currentAmount: 0,
    targetAmount: defaultEmergencyTarget(expenses),
    monthlyContribution: 0,
  };
}

export function computeEmergencyRunwayMonths(
  emergencyFund: EmergencyFund,
  expenses: Expense[],
): number | null {
  const core = monthlyCoreExpenses(expenses);
  if (core <= 0) return emergencyFund.currentAmount > 0 ? null : 0;
  return emergencyFund.currentAmount / core;
}

export type EmergencyFundStatusTone = 'vulnerable' | 'building' | 'healthy' | 'strong';

export function getEmergencyFundStatus(months: number | null): {
  label: string;
  tone: EmergencyFundStatusTone;
} {
  if (months === null || months < 1) {
    return { label: 'Under 1 month — vulnerable', tone: 'vulnerable' };
  }
  if (months < 3) {
    return { label: 'Building toward 3 months', tone: 'building' };
  }
  if (months < 6) {
    return { label: '3–6 months — healthy', tone: 'healthy' };
  }
  return { label: '6+ months — strong reserve', tone: 'strong' };
}

export function protectedExpenseDays(months: number): number {
  return Math.max(0, Math.round(months * 30.44));
}

function coerceEmergencyFund(
  raw: Partial<EmergencyFund> | undefined,
  expenses: Expense[],
): EmergencyFund {
  const target =
    raw && raw.targetAmount != null && raw.targetAmount > 0
      ? raw.targetAmount
      : defaultEmergencyTarget(expenses);
  return {
    id: EMERGENCY_FUND_ID,
    name: 'Emergency Fund',
    currentAmount: Math.max(0, Number(raw?.currentAmount) || 0),
    targetAmount: target,
    monthlyContribution: Math.max(0, Number(raw?.monthlyContribution) || 0),
  };
}

/** Normalize storage/import data and migrate legacy emergency savings goals. */
export function normalizeAppData(raw: {
  income?: AppData['income'];
  expenses?: AppData['expenses'];
  debts?: AppData['debts'];
  savingsGoals?: SavingsGoal[];
  emergencyFund?: Partial<EmergencyFund>;
}): AppData {
  const income = raw.income ?? [];
  const expenses = raw.expenses ?? [];
  const debts = raw.debts ?? [];
  let savingsGoals = [...(raw.savingsGoals ?? [])];

  let emergencyFund = raw.emergencyFund
    ? coerceEmergencyFund(raw.emergencyFund, expenses)
    : undefined;

  const migrateIdx = savingsGoals.findIndex((g) => isEmergencyGoalName(g.name));
  if (migrateIdx >= 0) {
    const legacy = savingsGoals[migrateIdx];
    if (!emergencyFund || emergencyFund.currentAmount === 0) {
      emergencyFund = {
        id: EMERGENCY_FUND_ID,
        name: 'Emergency Fund',
        currentAmount: legacy.currentAmount,
        targetAmount:
          legacy.targetAmount > 0 ? legacy.targetAmount : defaultEmergencyTarget(expenses),
        monthlyContribution: Math.max(0, Number(legacy.monthlyContribution) || 0),
      };
    } else if (legacy.targetAmount > emergencyFund.targetAmount) {
      emergencyFund = {
        ...emergencyFund,
        targetAmount: legacy.targetAmount,
      };
    }
    savingsGoals.splice(migrateIdx, 1);
  }

  savingsGoals = savingsGoals.filter((g) => !isEmergencyGoalName(g.name));

  savingsGoals = savingsGoals.map((g) => ({
    ...g,
    monthlyContribution: Math.max(0, Number(g.monthlyContribution) || 0),
  }));

  if (!emergencyFund) {
    emergencyFund = createEmptyEmergencyFund(expenses);
  }

  return { income, expenses, debts, emergencyFund, savingsGoals };
}
